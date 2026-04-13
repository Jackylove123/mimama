export type StorageMode = 'local' | 'cloud'

export interface VaultItem {
  id: string
  title: string
  account: string
  password: string
  website: string
  note: string
  isFavorite: boolean
  createdAt: number
  updatedAt: number
  lastUsedAt: number
}

export interface VaultItemInput {
  id?: string
  title: string
  account: string
  password: string
  website?: string
  note?: string
  isFavorite?: boolean
}

export interface VaultStats {
  total: number
  favorite: number
  updatedToday: number
}

export interface VaultExportPayload {
  version: '0.1'
  exportedAt: number
  storageMode: StorageMode
  items: VaultItem[]
}

export type ImportMode = 'append' | 'replace'
