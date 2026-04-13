import type { ImportMode, StorageMode, VaultExportPayload, VaultItem, VaultItemInput, VaultStats } from '../types/vault'

const STORAGE_KEY = 'mimama.vault.items.v0_1'

interface VaultProvider {
  listItems(): Promise<VaultItem[]>
  saveItems(items: VaultItem[]): Promise<void>
}

class LocalVaultProvider implements VaultProvider {
  async listItems() {
    const raw = wx.getStorageSync(STORAGE_KEY)

    if (typeof raw !== 'string' || raw.length === 0) {
      return []
    }

    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed
        .filter(isVaultItem)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.warn('Failed to parse vault storage:', error)
      return []
    }
  }

  async saveItems(items: VaultItem[]) {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(items))
  }
}

class CloudVaultProvider implements VaultProvider {
  async listItems(): Promise<VaultItem[]> {
    throw new Error('Cloud storage is reserved for later versions and is not enabled in v0.1.')
  }

  async saveItems(): Promise<void> {
    throw new Error('Cloud storage is reserved for later versions and is not enabled in v0.1.')
  }
}

class VaultRepository {
  private readonly provider: VaultProvider
  private readonly storageMode: StorageMode

  constructor(storageMode: StorageMode) {
    this.storageMode = storageMode
    this.provider = storageMode === 'cloud' ? new CloudVaultProvider() : new LocalVaultProvider()
  }

  async ensureSeedData() {
    const items = await this.provider.listItems()
    if (items.length > 0) {
      return
    }

    await this.provider.saveItems(createSeedItems())
  }

  async listItems() {
    const items = await this.provider.listItems()
    return items.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async listRecent(limit = 50) {
    const items = await this.listItems()
    return items
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, limit)
  }

  async listFavorites() {
    const items = await this.listItems()
    return items.filter((item) => item.isFavorite)
  }

  async search(keyword: string) {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) {
      return this.listItems()
    }

    const items = await this.listItems()
    return items.filter((item) => {
      return [item.title, item.account, item.website, item.note].some((field) => field.toLowerCase().includes(normalized))
    })
  }

  async getItemById(id: string) {
    const items = await this.listItems()
    return items.find((item) => item.id === id)
  }

  async upsertItem(input: VaultItemInput) {
    const items = await this.listItems()
    const now = Date.now()
    const normalized: VaultItem = {
      id: input.id ?? createId(),
      title: input.title.trim(),
      account: input.account.trim(),
      password: input.password,
      website: (input.website ?? '').trim(),
      note: (input.note ?? '').trim(),
      isFavorite: Boolean(input.isFavorite),
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    }

    const existing = items.find((item) => item.id === normalized.id)
    const nextItems = existing
      ? items.map((item) => {
          if (item.id !== normalized.id) {
            return item
          }

          return {
            ...item,
            ...normalized,
            createdAt: item.createdAt,
            lastUsedAt: item.lastUsedAt,
          }
        })
      : [normalized, ...items]

    await this.provider.saveItems(nextItems)
    return normalized
  }

  async deleteItem(id: string) {
    const items = await this.listItems()
    const nextItems = items.filter((item) => item.id !== id)
    await this.provider.saveItems(nextItems)
  }

  async toggleFavorite(id: string) {
    const items = await this.listItems()
    const nextItems = items.map((item) => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        isFavorite: !item.isFavorite,
        updatedAt: Date.now(),
      }
    })

    await this.provider.saveItems(nextItems)
  }

  async touchLastUsed(id: string) {
    const items = await this.listItems()
    const now = Date.now()
    const nextItems = items.map((item) => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        lastUsedAt: now,
      }
    })

    await this.provider.saveItems(nextItems)
  }

  async getStats(): Promise<VaultStats> {
    const items = await this.listItems()
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const updatedToday = items.filter((item) => item.updatedAt >= startOfToday.getTime()).length

    return {
      total: items.length,
      favorite: items.filter((item) => item.isFavorite).length,
      updatedToday,
    }
  }

  async exportPayload(): Promise<VaultExportPayload> {
    const items = await this.listItems()
    return {
      version: '0.1',
      exportedAt: Date.now(),
      storageMode: this.storageMode,
      items,
    }
  }

  async importPayload(payload: VaultExportPayload, mode: ImportMode) {
    const payloadItems = payload.items.filter(isVaultItem)

    if (mode === 'replace') {
      await this.provider.saveItems(payloadItems)
      return payloadItems.length
    }

    const current = await this.listItems()
    const map = new Map<string, VaultItem>()

    current.forEach((item) => {
      map.set(item.id, item)
    })

    payloadItems.forEach((item) => {
      map.set(item.id, item)
    })

    const merged = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt)
    await this.provider.saveItems(merged)

    return payloadItems.length
  }

  getStorageMode() {
    return this.storageMode
  }
}

const repositories = new Map<StorageMode, VaultRepository>()

export const getVaultRepository = (mode: StorageMode) => {
  if (!repositories.has(mode)) {
    repositories.set(mode, new VaultRepository(mode))
  }

  return repositories.get(mode) as VaultRepository
}

const createSeedItems = (): VaultItem[] => {
  const now = Date.now()

  return [
    {
      id: createId(),
      title: '微信',
      account: 'mimama_user',
      password: 'Mm@2026Wechat!',
      website: 'https://weixin.qq.com',
      note: '默认示例数据，可编辑或删除',
      isFavorite: true,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    },
    {
      id: createId(),
      title: '邮箱',
      account: 'hello@mimama.cn',
      password: 'Mm@Mail#2026',
      website: 'https://mail.qq.com',
      note: '建议启用二步验证',
      isFavorite: false,
      createdAt: now - 1000,
      updatedAt: now - 1000,
      lastUsedAt: now - 1000,
    },
  ]
}

const createId = () => `item_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`

const isVaultItem = (value: unknown): value is VaultItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const item = value as VaultItem

  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.account === 'string' &&
    typeof item.password === 'string' &&
    typeof item.website === 'string' &&
    typeof item.note === 'string' &&
    typeof item.isFavorite === 'boolean' &&
    typeof item.createdAt === 'number' &&
    typeof item.updatedAt === 'number' &&
    typeof item.lastUsedAt === 'number'
  )
}
