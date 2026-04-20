export type VaultCategory = 'social' | 'email' | 'finance' | 'website' | 'others'
export type VaultCategorySource = 'manual' | 'icon' | 'keyword' | 'default'

export interface VaultItem {
  id: string
  title: string
  account: string
  password: string
  note: string
  category: VaultCategory
  categorySource: VaultCategorySource
  deletedAt?: number
  createdAt: number
  updatedAt: number
  lastUsedAt: number
}

export interface VaultItemInput {
  id?: string
  title: string
  account: string
  password: string
  note?: string
  category?: VaultCategory
  categorySource?: VaultCategorySource
}

export interface VaultMeta {
  version: '3.0-local'
  salt: string
  passcodeVerifier: string
  recordCount: number
  lastBackupAt: number
  lastModifiedAt: number
  checksum: string
}

export interface VaultStats {
  total: number
  updatedToday: number
  lastBackupAt: number
  lastModifiedAt: number
}

export interface BackupReminder {
  level: 'none' | 'info' | 'warning' | 'danger'
  message: string
  actionText: string
}

export interface ExportPolicyDecision {
  requiresAd: boolean
  freeReason: 'first_ever' | 'first_daily' | 'none'
}

export interface TxtExportResult {
  filePath: string
  txt: string
  decision: ExportPolicyDecision
}

export interface TxtImportResult {
  totalCount: number
  importedCount: number
  duplicateCount: number
  skippedCount: number
}

export interface VaultStatus {
  initialized: boolean
  recordCount: number
  recycleCount: number
  lastBackupAt: number
  lastModifiedAt: number
  fileBytes: number
  dataPath: string
  metaPath: string
}
