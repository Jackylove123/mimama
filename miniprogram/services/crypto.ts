let cachedOpenid: string | null = null
const OPENID_STORAGE_KEY = 'mimama.openid'

export async function getOpenid(): Promise<string> {
  if (cachedOpenid) return cachedOpenid

  const stored = wx.getStorageSync(OPENID_STORAGE_KEY)
  if (stored) {
    cachedOpenid = stored
    return stored
  }

  const res = await wx.cloud.callFunction({ name: 'getOpenid' })
  const openid = (res.result as { openid: string }).openid

  cachedOpenid = openid
  wx.setStorageSync(OPENID_STORAGE_KEY, openid)
  return openid
}

export async function prefetchOpenid() {
  try {
    const hasCache = !!wx.getStorageSync(OPENID_STORAGE_KEY)
    if (hasCache) {
      cachedOpenid = wx.getStorageSync(OPENID_STORAGE_KEY)
      return
    }
    await getOpenid()
  } catch (_) {
    // Silently fail on launch — will retry on first export/import
  }
}

export interface EncryptedBackupV2 {
  version: '2.0'
  salt: string
  encryptedData: string
}

export interface BackupPasswordResult {
  success: boolean
  data?: string
  error?: string
}

const BACKUP_V2_SECRET = 'mimama::backup::v2::user-password'
const DERIVE_ROUNDS = 5000

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return wx.arrayBufferToBase64(buffer)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  return wx.base64ToArrayBuffer(base64)
}

function utf8ToBytes(str: string): Uint8Array {
  const encoded = encodeURIComponent(str)
  const bytes: number[] = []

  for (let index = 0; index < encoded.length; index++) {
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

function bytesToUtf8(bytes: Uint8Array): string {
  let encoded = ''
  for (let i = 0; i < bytes.length; i++) {
    encoded += `%${bytes[i].toString(16).padStart(2, '0')}`
  }
  return decodeURIComponent(encoded)
}

function hashText(input: string): string {
  let hash = 2166136261

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function deriveKey(secret: string, salt: string): string {
  let seed = `${BACKUP_V2_SECRET}:${secret}:${salt}`
  for (let round = 0; round < DERIVE_ROUNDS; round++) {
    seed = hashText(`${seed}:${round}`)
  }

  let key = ''
  for (let block = 0; block < 8; block++) {
    key += hashText(`${seed}:backup:${block}`)
  }

  return key
}

function encryptText(plainText: string, keyHex: string): string {
  const plainBytes = utf8ToBytes(plainText)
  const keyBytes = hexToBytes(keyHex)
  const cipher = new Uint8Array(plainText.length)

  for (let i = 0; i < plainText.length; i++) {
    cipher[i] = plainBytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 131) & 0xff)
  }

  return arrayBufferToBase64(cipher.buffer)
}

function decryptText(cipherBase64: string, keyHex: string): string {
  const cipherBuffer = base64ToArrayBuffer(cipherBase64)
  const cipherBytes = new Uint8Array(cipherBuffer)
  const keyBytes = hexToBytes(keyHex)
  const plain = new Uint8Array(cipherBytes.length)

  for (let i = 0; i < cipherBytes.length; i++) {
    plain[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length] ^ ((i * 131) & 0xff)
  }

  return bytesToUtf8(plain)
}

export async function encryptBackup(data: string, openid: string): Promise<EncryptedBackupV2> {
  const salt = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('')

  const key = deriveKey(openid, salt)
  const encrypted = encryptText(data, key)

  return {
    version: '2.0',
    salt,
    encryptedData: encrypted,
  }
}

export async function decryptBackup(encrypted: EncryptedBackupV2, openid: string): Promise<BackupPasswordResult> {
  try {
    const key = deriveKey(openid, encrypted.salt)
    const decrypted = decryptText(encrypted.encryptedData, key)

    return { success: true, data: decrypted }
  } catch (error) {
    return { success: false, error: '备份不属于你，无法导入' }
  }
}

export function formatEncryptedBackup(encrypted: EncryptedBackupV2): string {
  const lines = [
    'MIMAMA-BACKUP-2',
    `version=${encrypted.version}`,
    `salt=${encrypted.salt}`,
    `data=${encrypted.encryptedData}`,
    'MIMAMA-END',
  ]
  return lines.join('\n')
}

export function parseEncryptedBackupV2(content: string): EncryptedBackupV2 | null {
  try {
    const lines = content.split('\n').map((line) => line.trim())

    if (lines[0] !== 'MIMAMA-BACKUP-2' || lines[lines.length - 1] !== 'MIMAMA-END') {
      return null
    }

    const result: EncryptedBackupV2 = {
      version: '2.0',
      salt: '',
      encryptedData: '',
    }

    for (const line of lines) {
      const eqIndex = line.indexOf('=')
      if (eqIndex <= 0) continue

      const key = line.slice(0, eqIndex).trim()
      const value = line.slice(eqIndex + 1).trim()

      if (key === 'version') result.version = value as any
      else if (key === 'salt') result.salt = value
      else if (key === 'data') result.encryptedData = value
    }

    if (!result.salt || !result.encryptedData) {
      return null
    }

    return result
  } catch (_e) {
    return null
  }
}

export function isBackupV2(content: string): boolean {
  const firstNonEmpty = content
    .replace(/^﻿/, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)
  return firstNonEmpty === 'MIMAMA-BACKUP-2'
}
