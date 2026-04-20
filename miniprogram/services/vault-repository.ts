import type {
  BackupReminder,
  ExportPolicyDecision,
  TxtImportResult,
  TxtExportResult,
  VaultCategory,
  VaultCategorySource,
  VaultItem,
  VaultItemInput,
  VaultMeta,
  VaultStats,
  VaultStatus,
} from '../types/vault'
import { CATEGORY_LABELS, inferCategoryByTitle, isCategory, normalizeCategory } from './category-engine'

const fs = wx.getFileSystemManager()
const USER_DATA_PATH = (wx.env && wx.env.USER_DATA_PATH) || '/user_data'
const ROOT_DIR = `${USER_DATA_PATH}/mimama_v3`
const VAULT_DATA_PATH = `${ROOT_DIR}/vault.dat`
const VAULT_META_PATH = `${ROOT_DIR}/vault.meta`

const CONFIG_KEY = 'mimama.config.v3'
const MAX_FAIL_BEFORE_RESET = 8
const COOLDOWN_START_FAILS = 5
const COOLDOWN_MS = 30 * 1000
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000
const SESSION_BACKGROUND_TIMEOUT_MS = 90 * 1000
const RECYCLE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

interface VaultContainer {
  items: VaultItem[]
}

interface SessionState {
  key: string
  unlockedAt: number
}

let sessionState: SessionState | null = null

interface RuntimeConfig {
  initialized: boolean
  guideSeen: boolean
  uiDensity: 'standard' | 'compact'
  lastAdCooldownAt: number
  exportFreeUsed: boolean
  exportDay: string
  exportCountInDay: number
  failCount: number
  lockUntil: number
  lastHideAt: number
}

export type PasscodeVerifyCode = 'OK' | 'INVALID' | 'LOCKED' | 'PAIRING_REQUIRED'

export interface PasscodeVerifyResult {
  ok: boolean
  code: PasscodeVerifyCode
  remainingAttempts: number
  lockUntil?: number
}

class VaultRepository {
  async isInitialized() {
    // Use both config flag and file probing to avoid false negatives after app restarts.
    const config = readConfig()
    if (config.initialized) {
      return true
    }

    return fileExists(VAULT_DATA_PATH) && fileExists(VAULT_META_PATH)
  }

  async initialize(passcode: string) {
    ensureRootDir()

    const salt = createRandomHex(16)
    const key = deriveKey(passcode, salt)
    const emptyVault: VaultContainer = {
      items: [],
    }

    const cipher = encryptText(JSON.stringify(emptyVault), key)
    const now = Date.now()
    const meta: VaultMeta = {
      version: '3.0-local',
      salt,
      passcodeVerifier: hashText(`${key}:verify`),
      recordCount: 0,
      lastBackupAt: 0,
      lastModifiedAt: now,
      checksum: hashText(`${cipher}:${salt}:0`),
    }

    fs.writeFileSync(VAULT_DATA_PATH, cipher, 'utf8')
    fs.writeFileSync(VAULT_META_PATH, JSON.stringify(meta), 'utf8')

    if (!fileExists(VAULT_DATA_PATH) || !fileExists(VAULT_META_PATH)) {
      throw new Error('Vault initialization failed: data files were not persisted.')
    }

    const nextConfig = {
      ...readConfig(),
      initialized: true,
      failCount: 0,
      lockUntil: 0,
    }
    writeConfig(nextConfig)
    sessionState = {
      key,
      unlockedAt: now,
    }
  }

  async verifyPasscode(passcode: string): Promise<PasscodeVerifyResult> {
    if (!(await this.isInitialized())) {
      return {
        ok: false,
        code: 'PAIRING_REQUIRED',
        remainingAttempts: 0,
      }
    }

    const config = readConfig()
    const now = Date.now()

    if (config.lockUntil > now) {
      return {
        ok: false,
        code: 'LOCKED',
        remainingAttempts: Math.max(0, MAX_FAIL_BEFORE_RESET - config.failCount),
        lockUntil: config.lockUntil,
      }
    }

    let meta: VaultMeta
    try {
      meta = readMeta()
    } catch (_error) {
      return {
        ok: false,
        code: 'PAIRING_REQUIRED',
        remainingAttempts: 0,
      }
    }
    const key = deriveKey(passcode, meta.salt)
    const expected = hashText(`${key}:verify`)

    if (meta.passcodeVerifier === expected) {
      writeConfig({
        ...config,
        failCount: 0,
        lockUntil: 0,
      })

      sessionState = {
        key,
        unlockedAt: now,
      }

      return {
        ok: true,
        code: 'OK',
        remainingAttempts: MAX_FAIL_BEFORE_RESET,
      }
    }

    const nextFail = config.failCount + 1
    const nextConfig: RuntimeConfig = {
      ...config,
      failCount: nextFail,
      lockUntil: nextFail >= COOLDOWN_START_FAILS ? now + COOLDOWN_MS : 0,
    }

    writeConfig(nextConfig)

    if (nextFail >= MAX_FAIL_BEFORE_RESET) {
      this.lockSession()
      return {
        ok: false,
        code: 'PAIRING_REQUIRED',
        remainingAttempts: 0,
      }
    }

    if (nextFail >= COOLDOWN_START_FAILS) {
      return {
        ok: false,
        code: 'LOCKED',
        remainingAttempts: MAX_FAIL_BEFORE_RESET - nextFail,
        lockUntil: nextConfig.lockUntil,
      }
    }

    return {
      ok: false,
      code: 'INVALID',
      remainingAttempts: MAX_FAIL_BEFORE_RESET - nextFail,
    }
  }

  lockSession() {
    sessionState = null
  }

  needsUnlock() {
    if (!sessionState) {
      return true
    }

    if (Date.now() - sessionState.unlockedAt > SESSION_MAX_AGE_MS) {
      this.lockSession()
      return true
    }

    return false
  }

  markAppHidden() {
    const config = readConfig()
    writeConfig({
      ...config,
      lastHideAt: Date.now(),
    })
  }

  markAppVisible() {
    const config = readConfig()
    if (!config.lastHideAt) {
      return
    }

    if (Date.now() - config.lastHideAt > SESSION_BACKGROUND_TIMEOUT_MS) {
      this.lockSession()
    }

    writeConfig({
      ...config,
      lastHideAt: 0,
    })
  }

  lockCountdownSeconds() {
    const config = readConfig()
    const left = config.lockUntil - Date.now()
    return left > 0 ? Math.ceil(left / 1000) : 0
  }

  async listItems() {
    const vault = this.readVaultWithSession()
    const { vault: purgedVault } = this.purgeExpiredDeleted(vault)
    return purgedVault.items.filter((item) => !item.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async searchItems(keyword: string, category: VaultCategory | 'all' = 'all') {
    const normalized = keyword.trim().toLowerCase()
    const items = await this.listItems()

    if (!normalized && category === 'all') {
      return items
    }

    return items.filter((item) => {
      const categoryMatched = category === 'all' || item.category === category
      if (!categoryMatched) {
        return false
      }

      if (!normalized) {
        return true
      }

      return [item.title, item.account, item.note].some((field) => field.toLowerCase().includes(normalized))
    })
  }

  async getItemById(id: string) {
    const items = await this.listItems()
    return items.find((item) => item.id === id)
  }

  async upsertItem(input: VaultItemInput) {
    const vault = this.readVaultWithSession()
    const now = Date.now()
    const existing = vault.items.find((item) => item.id === input.id && !item.deletedAt)
    const nextTitle = input.title.trim()
    const normalizedNote = typeof input.note === 'string' ? input.note : ''
    const categoryState = resolveCategoryState(nextTitle, input.category, input.categorySource, existing)

    if (existing) {
      const nextItems = vault.items.map((item) => {
        if (item.id !== existing.id) {
          return item
        }

        return {
          ...item,
          title: nextTitle,
          account: input.account.trim(),
          password: input.password,
          note: normalizedNote.trim(),
          category: categoryState.category,
          categorySource: categoryState.source,
          updatedAt: now,
          lastUsedAt: now,
        }
      })

      this.saveVault({ items: nextItems }, now)
      return existing.id
    }

    const nextItem: VaultItem = {
      id: createId(),
      title: nextTitle,
      account: input.account.trim(),
      password: input.password,
      note: normalizedNote.trim(),
      category: categoryState.category,
      categorySource: categoryState.source,
      deletedAt: undefined,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    }

    this.saveVault({ items: [nextItem, ...vault.items] }, now)
    return nextItem.id
  }

  async deleteItem(id: string) {
    const vault = this.readVaultWithSession()
    const now = Date.now()
    let changed = false
    const nextItems = vault.items.map((item) => {
      if (item.id !== id || item.deletedAt) {
        return item
      }

      changed = true
      return {
        ...item,
        deletedAt: now,
        updatedAt: now,
      }
    })

    if (!changed) {
      return
    }

    this.saveVault({ items: nextItems }, now)
  }

  async listRecycleItems() {
    const vault = this.readVaultWithSession()
    const { vault: purgedVault } = this.purgeExpiredDeleted(vault)
    return purgedVault.items
      .filter((item) => typeof item.deletedAt === 'number')
      .sort((a, b) => {
        const bDeletedAt = typeof b.deletedAt === 'number' ? b.deletedAt : 0
        const aDeletedAt = typeof a.deletedAt === 'number' ? a.deletedAt : 0
        return bDeletedAt - aDeletedAt
      })
  }

  async restoreRecycleItem(id: string) {
    const vault = this.readVaultWithSession()
    const now = Date.now()
    let changed = false
    const nextItems = vault.items.map((item) => {
      if (item.id !== id || !item.deletedAt) {
        return item
      }

      changed = true
      return {
        ...item,
        deletedAt: undefined,
        updatedAt: now,
      }
    })

    if (!changed) {
      return false
    }

    this.saveVault({ items: nextItems }, now)
    return true
  }

  async removeRecycleItem(id: string) {
    const vault = this.readVaultWithSession()
    const nextItems = vault.items.filter((item) => !(item.id === id && item.deletedAt))
    if (nextItems.length === vault.items.length) {
      return false
    }

    this.saveVault({ items: nextItems }, Date.now())
    return true
  }

  async clearRecycleItems() {
    const vault = this.readVaultWithSession()
    const nextItems = vault.items.filter((item) => !item.deletedAt)
    if (nextItems.length === vault.items.length) {
      return 0
    }

    const removedCount = vault.items.length - nextItems.length
    this.saveVault({ items: nextItems }, Date.now())
    return removedCount
  }

  async touchLastUsed(id: string) {
    const vault = this.readVaultWithSession()
    const now = Date.now()
    const nextItems = vault.items.map((item) => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        lastUsedAt: now,
      }
    })

    this.saveVault({ items: nextItems }, now)
  }

  async getStats(): Promise<VaultStats> {
    const items = await this.listItems()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const meta = this.readMetaSafe()
    const lastBackupAt = meta && typeof meta.lastBackupAt === 'number' ? meta.lastBackupAt : 0
    const lastModifiedAt = meta && typeof meta.lastModifiedAt === 'number' ? meta.lastModifiedAt : 0

    return {
      total: items.length,
      updatedToday: items.filter((item) => item.updatedAt >= startOfToday.getTime()).length,
      lastBackupAt,
      lastModifiedAt,
    }
  }

  async getBackupReminder(): Promise<BackupReminder> {
    const stats = await this.getStats()

    if (stats.total === 0) {
      return {
        level: 'none',
        message: '',
        actionText: '',
      }
    }

    if (!stats.lastBackupAt) {
      if (stats.total >= 20) {
        return {
          level: 'danger',
          message: `已保存 ${stats.total} 条且从未备份，建议马上导出。`,
          actionText: '去备份',
        }
      }

      if (stats.total >= 3) {
        return {
          level: 'warning',
          message: '这份密码小本只存在本机，建议先导出一份备份。',
          actionText: '去备份',
        }
      }
    }

    if (stats.lastBackupAt > 0) {
      const days = Math.floor((Date.now() - stats.lastBackupAt) / (24 * 60 * 60 * 1000))
      if (days >= 14 && stats.lastModifiedAt > stats.lastBackupAt) {
        return {
          level: 'warning',
          message: '最近有内容更新，建议重新备份一次。',
          actionText: '立即备份',
        }
      }
    }

    return {
      level: 'none',
      message: '',
      actionText: '',
    }
  }

  async exportTxt(): Promise<TxtExportResult> {
    const items = await this.listItems()
    const txt = toReadableTxt(items)
    const decision = this.decideExportPolicy()

    const filePath = `${ROOT_DIR}/${formatExportFilename(new Date())}.txt`
    fs.writeFileSync(filePath, txt, 'utf8')

    const meta = readMeta()
    const now = Date.now()
    const nextMeta: VaultMeta = {
      ...meta,
      lastBackupAt: now,
      checksum: hashText(`${readVaultCipherText()}:${meta.salt}:${meta.recordCount}`),
    }
    fs.writeFileSync(VAULT_META_PATH, JSON.stringify(nextMeta), 'utf8')

    return {
      filePath,
      txt,
      decision,
    }
  }

  async importTxt(filePath: string): Promise<TxtImportResult> {
    if (!filePath) {
      throw new Error('INVALID_IMPORT_TXT')
    }

    const raw = fs.readFileSync(filePath, 'utf8')
    if (typeof raw !== 'string' || raw.length === 0) {
      throw new Error('INVALID_IMPORT_TXT')
    }

    const parsedItems = parseMimamaTxtImport(raw)
    const vault = this.readVaultWithSession()
    const now = Date.now()
    const seen = new Set(vault.items.map((item) => buildDuplicateKey(item.account, item.password)))

    let duplicateCount = 0
    let skippedCount = 0
    const importedItems: VaultItem[] = []

    parsedItems.forEach((item, index) => {
      const title = item.title.trim()
      const account = item.account.trim()
      const password = item.password
      const note = item.note.trim()

      if (!title || !account || !password) {
        skippedCount += 1
        return
      }

      const key = buildDuplicateKey(account, password)
      if (seen.has(key)) {
        duplicateCount += 1
        return
      }

      seen.add(key)
      const categoryState = resolveCategoryState(title, item.category, 'manual')
      const timestamp = now + index

      importedItems.push({
        id: createId(),
        title,
        account,
        password,
        note,
        category: categoryState.category,
        categorySource: categoryState.source,
        deletedAt: undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastUsedAt: timestamp,
      })
    })

    if (importedItems.length > 0) {
      this.saveVault(
        {
          items: [...importedItems, ...vault.items],
        },
        now,
      )
    }

    return {
      totalCount: parsedItems.length,
      importedCount: importedItems.length,
      duplicateCount,
      skippedCount,
    }
  }

  async getStatus(): Promise<VaultStatus> {
    if (!(await this.isInitialized())) {
      return {
        initialized: false,
        recordCount: 0,
        recycleCount: 0,
        lastBackupAt: 0,
        lastModifiedAt: 0,
        fileBytes: 0,
        dataPath: VAULT_DATA_PATH,
        metaPath: VAULT_META_PATH,
      }
    }

    const meta = readMeta()
    let recordCount = meta.recordCount
    let recycleCount = 0
    if (!this.needsUnlock()) {
      const vault = this.readVaultWithSession()
      const { vault: purgedVault } = this.purgeExpiredDeleted(vault)
      recordCount = countActiveItems(purgedVault.items)
      recycleCount = countRecycleItems(purgedVault.items)
    }

    return {
      initialized: true,
      recordCount,
      recycleCount,
      lastBackupAt: meta.lastBackupAt,
      lastModifiedAt: meta.lastModifiedAt,
      fileBytes: fileSize(VAULT_DATA_PATH),
      dataPath: VAULT_DATA_PATH,
      metaPath: VAULT_META_PATH,
    }
  }

  async resetVault() {
    this.lockSession()

    if (fileExists(VAULT_DATA_PATH)) {
      fs.unlinkSync(VAULT_DATA_PATH)
    }

    if (fileExists(VAULT_META_PATH)) {
      fs.unlinkSync(VAULT_META_PATH)
    }

    writeConfig(defaultConfig())
  }

  async changePasscode(oldPasscode: string, newPasscode: string) {
    if (!(await this.isInitialized())) {
      return false
    }

    const meta = readMeta()
    const oldKey = deriveKey(oldPasscode, meta.salt)
    if (hashText(`${oldKey}:verify`) !== meta.passcodeVerifier) {
      return false
    }

    const vault = readVaultWithKey(oldKey)
    const newSalt = createRandomHex(16)
    const newKey = deriveKey(newPasscode, newSalt)
    const cipher = encryptText(JSON.stringify(vault), newKey)

    const nextMeta: VaultMeta = {
      ...meta,
      salt: newSalt,
      passcodeVerifier: hashText(`${newKey}:verify`),
      checksum: hashText(`${cipher}:${newSalt}:${countActiveItems(vault.items)}`),
      lastModifiedAt: Date.now(),
    }

    fs.writeFileSync(VAULT_DATA_PATH, cipher, 'utf8')
    fs.writeFileSync(VAULT_META_PATH, JSON.stringify(nextMeta), 'utf8')

    sessionState = {
      key: newKey,
      unlockedAt: Date.now(),
    }

    return true
  }

  private readVaultWithSession() {
    if (this.needsUnlock() || !sessionState) {
      throw new Error('Vault is locked. Please unlock first.')
    }

    sessionState.unlockedAt = Date.now()
    return readVaultWithKey(sessionState.key)
  }

  private saveVault(vault: VaultContainer, modifiedAt: number) {
    if (this.needsUnlock() || !sessionState) {
      throw new Error('Vault is locked. Please unlock first.')
    }

    const key = sessionState.key
    const cipher = encryptText(JSON.stringify(vault), key)
    const currentMeta = readMeta()

    const nextMeta: VaultMeta = {
      ...currentMeta,
      recordCount: countActiveItems(vault.items),
      lastModifiedAt: modifiedAt,
      checksum: hashText(`${cipher}:${currentMeta.salt}:${countActiveItems(vault.items)}`),
    }

    fs.writeFileSync(VAULT_DATA_PATH, cipher, 'utf8')
    fs.writeFileSync(VAULT_META_PATH, JSON.stringify(nextMeta), 'utf8')
  }

  private decideExportPolicy(): ExportPolicyDecision {
    const config = readConfig()
    const today = formatDay(new Date())

    let nextConfig = { ...config }
    let freeReason: ExportPolicyDecision['freeReason'] = 'none'

    if (!config.exportFreeUsed) {
      nextConfig = {
        ...nextConfig,
        exportFreeUsed: true,
        exportDay: today,
        exportCountInDay: 1,
      }
      writeConfig(nextConfig)
      freeReason = 'first_ever'
      return {
        requiresAd: false,
        freeReason,
      }
    }

    const isNewDay = config.exportDay !== today
    const countInDay = isNewDay ? 1 : config.exportCountInDay + 1

    nextConfig = {
      ...nextConfig,
      exportDay: today,
      exportCountInDay: countInDay,
    }

    writeConfig(nextConfig)

    if (countInDay === 1) {
      freeReason = 'first_daily'
    }

    return {
      requiresAd: countInDay > 1,
      freeReason,
    }
  }

  private readMetaSafe() {
    try {
      return readMeta()
    } catch (_error) {
      return null
    }
  }

  private purgeExpiredDeleted(vault: VaultContainer) {
    const now = Date.now()
    const nextItems = vault.items.filter((item) => {
      if (!item.deletedAt) {
        return true
      }

      return now - item.deletedAt < RECYCLE_RETENTION_MS
    })

    if (nextItems.length === vault.items.length) {
      return { vault, changed: false }
    }

    const meta = this.readMetaSafe()
    const modifiedAt = meta && typeof meta.lastModifiedAt === 'number' ? meta.lastModifiedAt : now
    const nextVault = { items: nextItems }
    this.saveVault(nextVault, modifiedAt)
    return { vault: nextVault, changed: true }
  }
}

const repository = new VaultRepository()

export const getVaultRepository = () => repository

const defaultConfig = (): RuntimeConfig => {
  return {
    initialized: false,
    guideSeen: false,
    uiDensity: 'standard',
    lastAdCooldownAt: 0,
    exportFreeUsed: false,
    exportDay: '',
    exportCountInDay: 0,
    failCount: 0,
    lockUntil: 0,
    lastHideAt: 0,
  }
}

const readConfig = () => {
  const raw = wx.getStorageSync(CONFIG_KEY)
  if (typeof raw !== 'string' || raw.length === 0) {
    return defaultConfig()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RuntimeConfig>
    return {
      ...defaultConfig(),
      ...parsed,
    }
  } catch (_error) {
    return defaultConfig()
  }
}

const writeConfig = (config: RuntimeConfig) => {
  wx.setStorageSync(CONFIG_KEY, JSON.stringify(config))
}

const ensureRootDir = () => {
  if (fileExists(ROOT_DIR)) {
    return
  }

  try {
    fs.mkdirSync(ROOT_DIR, true)
    return
  } catch (_error) {
    // Fallback for runtimes that do not support the recursive argument.
    try {
      fs.mkdirSync(ROOT_DIR)
      return
    } catch (_innerError) {
      if (!fileExists(ROOT_DIR)) {
        throw _innerError
      }
    }
  }
}

const fileExists = (path: string) => {
  try {
    fs.statSync(path)
    return true
  } catch (_error) {
    try {
      fs.accessSync(path)
      return true
    } catch (_innerError) {
      return false
    }
  }
}

const readMeta = (): VaultMeta => {
  const raw = fs.readFileSync(VAULT_META_PATH, 'utf8')
  if (typeof raw !== 'string') {
    throw new Error('Vault meta file is invalid.')
  }

  const parsed = JSON.parse(raw) as VaultMeta
  if (parsed.version !== '3.0-local') {
    throw new Error('Unsupported vault meta version.')
  }

  return parsed
}

const readVaultCipherText = () => {
  const cipher = fs.readFileSync(VAULT_DATA_PATH, 'utf8')
  if (typeof cipher !== 'string' || cipher.length === 0) {
    throw new Error('Vault data file is empty.')
  }

  return cipher
}

const readVaultWithKey = (key: string): VaultContainer => {
  const cipher = readVaultCipherText()
  const plain = decryptText(cipher, key)
  const parsed = JSON.parse(plain) as VaultContainer

  if (!Array.isArray(parsed.items)) {
    throw new Error('Vault data is corrupted.')
  }

  const now = Date.now()
  return {
    items: parsed.items
      .map((item, index) => coerceVaultItem(item, now + index))
      .filter((item): item is VaultItem => item !== null),
  }
}

const isText = (value: unknown): value is string => typeof value === 'string'
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const coerceVaultItem = (value: unknown, fallbackTimestamp: number): VaultItem | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const raw = value as Partial<VaultItem>
  if (!isText(raw.title) || !isText(raw.account) || !isText(raw.password)) {
    return null
  }

  const normalized = normalizeCategory(
    (raw as { category?: string }).category,
    (raw as { categorySource?: string }).categorySource,
    raw.title,
  )

  const updatedAt = isNumber(raw.updatedAt) ? raw.updatedAt : fallbackTimestamp
  const createdAt = isNumber(raw.createdAt) ? raw.createdAt : updatedAt
  const lastUsedAt = isNumber(raw.lastUsedAt) ? raw.lastUsedAt : updatedAt
  const deletedAt = isNumber(raw.deletedAt) ? raw.deletedAt : undefined

  return {
    id: isText(raw.id) && raw.id ? raw.id : createId(),
    title: raw.title,
    account: raw.account,
    password: raw.password,
    note: isText(raw.note) ? raw.note : '',
    category: normalized.category,
    categorySource: normalized.source,
    deletedAt,
    createdAt,
    updatedAt,
    lastUsedAt,
  }
}

const createId = () => {
  return `item_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}

const createRandomHex = (bytes: number) => {
  let result = ''
  for (let index = 0; index < bytes; index += 1) {
    const value = Math.floor(Math.random() * 256)
    result += value.toString(16).padStart(2, '0')
  }
  return result
}

const deriveKey = (passcode: string, salt: string) => {
  let seed = `${passcode}:${salt}:mimama-v3-local`

  for (let round = 0; round < 3000; round += 1) {
    seed = hashText(`${seed}:${round}`)
  }

  let key = ''
  for (let block = 0; block < 8; block += 1) {
    key += hashText(`${seed}:${block}`)
  }

  return key
}

const hashText = (input: string) => {
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

const encryptText = (plainText: string, keyHex: string) => {
  const plainBytes = utf8ToBytes(plainText)
  const keyBytes = hexToBytes(keyHex)
  const cipher = new Uint8Array(plainBytes.length)

  for (let index = 0; index < plainBytes.length; index += 1) {
    cipher[index] = plainBytes[index] ^ keyBytes[index % keyBytes.length] ^ ((index * 131) & 0xff)
  }

  return wx.arrayBufferToBase64(cipher.buffer)
}

const decryptText = (cipherBase64: string, keyHex: string) => {
  const cipherBuffer = wx.base64ToArrayBuffer(cipherBase64)
  const cipherBytes = new Uint8Array(cipherBuffer)
  const keyBytes = hexToBytes(keyHex)
  const plain = new Uint8Array(cipherBytes.length)

  for (let index = 0; index < cipherBytes.length; index += 1) {
    plain[index] = cipherBytes[index] ^ keyBytes[index % keyBytes.length] ^ ((index * 131) & 0xff)
  }

  return bytesToUtf8(plain)
}

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) {
    const slice = hex.slice(index * 2, index * 2 + 2)
    bytes[index] = parseInt(slice, 16)
  }
  return bytes
}

const utf8ToBytes = (value: string) => {
  const encoded = encodeURIComponent(value)
  const bytes: number[] = []

  for (let index = 0; index < encoded.length; index += 1) {
    const char = encoded[index]
    if (char === '%') {
      bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16))
      index += 2
      continue
    }

    bytes.push(char.charCodeAt(0))
  }

  return Uint8Array.from(bytes)
}

const bytesToUtf8 = (bytes: Uint8Array) => {
  let encoded = ''
  for (let index = 0; index < bytes.length; index += 1) {
    encoded += `%${bytes[index].toString(16).padStart(2, '0')}`
  }
  return decodeURIComponent(encoded)
}

const CATEGORY_EXPORT_ORDER: VaultCategory[] = ['social', 'email', 'finance', 'website', 'others']
const IMPORT_HEADER = '密麻麻离线备份'
const CATEGORY_LABEL_TO_KEY: Record<string, VaultCategory> = {
  [CATEGORY_LABELS.social]: 'social',
  [CATEGORY_LABELS.email]: 'email',
  [CATEGORY_LABELS.finance]: 'finance',
  [CATEGORY_LABELS.website]: 'website',
  [CATEGORY_LABELS.others]: 'others',
}
const CATEGORY_IMPORT_RULES: Array<{ category: VaultCategory; keywords: string[] }> = [
  { category: 'social', keywords: ['社交', 'social'] },
  { category: 'email', keywords: ['邮箱', 'email'] },
  { category: 'finance', keywords: ['支付', 'finance', 'bank'] },
  { category: 'website', keywords: ['网站', 'website', 'web'] },
  { category: 'others', keywords: ['其他', 'others'] },
]

const toReadableTxt = (items: VaultItem[]) => {
  const exportAt = formatDate(Date.now())
  const grouped = groupByCategory(items)
  const sections: string[] = []

  for (const category of CATEGORY_EXPORT_ORDER) {
    const categoryItems = grouped[category]
    if (!categoryItems.length) {
      continue
    }

    const title = `【${CATEGORY_LABELS[category]}】(${categoryItems.length}条)`
    const lines = categoryItems.map((item, index) => {
      return [
        `${index + 1}. ${safeText(item.title)}`,
        `账号：${safeText(item.account)}`,
        `密码：${safeText(item.password)}`,
        `备注：${safeText(item.note) || '无'}`,
        `更新：${formatDate(item.updatedAt)}`,
        `创建：${formatDate(item.createdAt)}`,
      ].join('\n')
    })

    sections.push([title, lines.join('\n\n')].join('\n'))
  }

  const body =
    sections.length > 0
      ? sections.join('\n\n----------------------------------------\n\n')
      : '当前没有可导出的记录。'

  return [
    '密麻麻离线备份',
    `导出时间：${exportAt}`,
    `记录总数：${items.length} 条`,
    '',
    '注意：本文件包含明文账号与密码，请妥善保存，避免外泄。',
    '',
    body,
    '',
    '---- 文件结束 ----',
  ].join('\n')
}

const groupByCategory = (items: VaultItem[]) => {
  const grouped: Record<VaultCategory, VaultItem[]> = {
    social: [],
    email: [],
    finance: [],
    website: [],
    others: [],
  }

  for (const item of items) {
    grouped[item.category].push(item)
  }

  return grouped
}

const resolveCategoryState = (
  title: string,
  category?: string,
  categorySource?: string,
  existing?: VaultItem,
): { category: VaultCategory; source: VaultCategorySource } => {
  if (isCategory(category)) {
    const normalized = normalizeCategory(category, categorySource, title)
    return {
      category: normalized.category,
      source: normalized.source,
    }
  }

  if (existing && existing.categorySource === 'manual') {
    return {
      category: existing.category,
      source: 'manual',
    }
  }

  const inferred = inferCategoryByTitle(title)
  return {
    category: inferred.category,
    source: inferred.source,
  }
}

const countActiveItems = (items: VaultItem[]) => {
  return items.reduce((count, item) => {
    return item.deletedAt ? count : count + 1
  }, 0)
}

const countRecycleItems = (items: VaultItem[]) => {
  return items.reduce((count, item) => {
    return item.deletedAt ? count + 1 : count
  }, 0)
}

const safeText = (value: string) => value.replace(/\r?\n/g, ' ').trim()

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const formatDay = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatExportFilename = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `Mimama-${year}${month}${day}-${hour}${minute}`
}

interface TxtImportItem {
  title: string
  account: string
  password: string
  note: string
  category: VaultCategory
}

const parseMimamaTxtImport = (raw: string): TxtImportItem[] => {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const lines = text.split('\n')
  const firstNonEmpty = lines.find((line) => line.trim().length > 0)
  if (!firstNonEmpty || firstNonEmpty.trim() !== IMPORT_HEADER) {
    throw new Error('INVALID_IMPORT_TXT')
  }

  const items: TxtImportItem[] = []
  let currentCategory: VaultCategory = 'others'
  let draft: Partial<TxtImportItem> | null = null

  const pushDraft = () => {
    if (!draft) {
      return
    }

    const account = (draft.account || '').trim()
    const password = (draft.password || '').trim()
    const note = (draft.note || '').trim()
    const category = isCategory(draft.category) ? draft.category : currentCategory
    const title = ((draft.title || '').trim() || buildImportFallbackTitle(account)).trim()

    if (account && password) {
      items.push({
        title,
        account,
        password,
        note,
        category,
      })
    }

    draft = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }

    if (line === IMPORT_HEADER || line.startsWith('导出时间：') || line.startsWith('导出时间:') || line.startsWith('记录总数：') || line.startsWith('记录总数:')) {
      continue
    }

    if (line.startsWith('注意：') || line.startsWith('注意:')) {
      continue
    }

    if (line === '---- 文件结束 ----') {
      pushDraft()
      break
    }

    if (isImportSectionDivider(line)) {
      pushDraft()
      continue
    }

    const detectedCategory = detectImportCategory(line)
    if (detectedCategory) {
      pushDraft()
      currentCategory = detectedCategory
      continue
    }

    const titleMatch = line.match(/^\d+\.\s*(.+)$/)
    if (titleMatch) {
      pushDraft()
      draft = {
        title: titleMatch[1].trim(),
        category: currentCategory,
        note: '',
      }
      continue
    }

    const accountMatch = line.match(/^账号[:：]\s*(.*)$/)
    if (accountMatch) {
      if (draft && draft.account && draft.password) {
        pushDraft()
      }
      if (!draft) {
        draft = {
          category: currentCategory,
          note: '',
        }
      }
      draft.account = accountMatch[1].trim()
      continue
    }

    const passwordMatch = line.match(/^密码[:：]\s*(.*)$/)
    if (passwordMatch) {
      if (!draft) {
        draft = {
          category: currentCategory,
          note: '',
        }
      }
      draft.password = passwordMatch[1]
      continue
    }

    const noteMatch = line.match(/^备注[:：]\s*(.*)$/)
    if (noteMatch) {
      if (!draft) {
        draft = {
          category: currentCategory,
        }
      }
      const note = noteMatch[1].trim()
      draft.note = note === '无' ? '' : note
      continue
    }

    if (!draft) {
      continue
    }

    if (line.startsWith('更新：') || line.startsWith('更新:') || line.startsWith('创建：') || line.startsWith('创建:')) {
      continue
    }

    if (!draft.title) {
      draft.title = line
    }
  }

  pushDraft()

  if (items.length === 0) {
    throw new Error('INVALID_IMPORT_TXT')
  }

  return items
}

const detectImportCategory = (line: string): VaultCategory | '' => {
  const sectionMatch = line.match(/^【(.+?)】(?:\(\d+条\))?$/)
  if (sectionMatch) {
    const mapped = CATEGORY_LABEL_TO_KEY[sectionMatch[1]]
    if (mapped) {
      return mapped
    }
  }

  const normalized = line.toLowerCase()
  for (const rule of CATEGORY_IMPORT_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return rule.category
    }
  }

  return ''
}

const isImportSectionDivider = (line: string) => /^-{8,}$/.test(line)

const buildImportFallbackTitle = (account: string) => {
  if (!account) {
    return '导入记录'
  }

  if (account.includes('@')) {
    return '邮箱账号'
  }

  const compact = account.replace(/\s+/g, '')
  const tail = compact.slice(-4)
  if (tail) {
    return `账号 ${tail}`
  }

  return '导入记录'
}

const buildDuplicateKey = (account: string, password: string) => {
  return `${account}\u0000${password}`
}

const fileSize = (path: string) => {
  try {
    const stat = fs.statSync(path)
    return stat.size
  } catch (_error) {
    return 0
  }
}
