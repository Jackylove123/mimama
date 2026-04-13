import { CLOUD_READY_HINT } from '../../services/runtime-config'
import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import type { VaultExportPayload, VaultItem } from '../../types/vault'

const app = getApp<IAppOption>()
const repository = getVaultRepository(app.globalData.storageMode)

Page({
  data: {
    storageMode: app.globalData.storageMode,
    cloudHint: CLOUD_READY_HINT,
    total: 0,
    favorite: 0,
    updatedToday: 0,
    importText: '',
  },

  onShow() {
    if (!ensureUnlocked('/pages/mine/index')) {
      return
    }

    this.loadStats()
  },

  onImportInput(event: WechatMiniprogram.CustomEvent) {
    this.setData({
      importText: event.detail.value as string,
    })
  },

  async onTapExport() {
    const payload = await repository.exportPayload()
    const text = JSON.stringify(payload, null, 2)

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showModal({
          title: '导出成功',
          content: '数据 JSON 已复制到剪贴板（0.1 版本不做广告拦截，可直接导出）。',
          showCancel: false,
        })
      },
    })
  },

  async onImportAppend() {
    this.importData('append')
  },

  async onImportReplace() {
    this.importData('replace')
  },

  onTapAdd() {
    wx.navigateTo({
      url: '/pages/edit/index',
    })
  },

  async onResetDemo() {
    await repository.importPayload(
      {
        version: '0.1',
        exportedAt: Date.now(),
        storageMode: app.globalData.storageMode,
        items: [],
      },
      'replace',
    )

    await repository.ensureSeedData()
    this.loadStats()

    wx.showToast({
      title: '已重置示例数据',
      icon: 'none',
    })
  },

  async loadStats() {
    const stats = await repository.getStats()
    this.setData({
      total: stats.total,
      favorite: stats.favorite,
      updatedToday: stats.updatedToday,
    })
  },

  async importData(mode: 'append' | 'replace') {
    const text = this.data.importText.trim()
    if (!text) {
      wx.showToast({
        title: '请先粘贴导入内容',
        icon: 'none',
      })
      return
    }

    try {
      const parsed = JSON.parse(text) as unknown
      if (!isExportPayload(parsed)) {
        wx.showToast({
          title: '导入格式不正确',
          icon: 'none',
        })
        return
      }

      const count = await repository.importPayload(parsed, mode)

      this.setData({ importText: '' })
      this.loadStats()

      wx.showToast({
        title: `已导入 ${count} 条`,
        icon: 'none',
      })
    } catch (error) {
      console.warn('Failed to import data:', error)
      wx.showToast({
        title: 'JSON 解析失败',
        icon: 'none',
      })
    }
  },
})

const isExportPayload = (value: unknown): value is VaultExportPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as VaultExportPayload
  if (payload.version !== '0.1') {
    return false
  }

  if (!Array.isArray(payload.items)) {
    return false
  }

  return payload.items.every(isVaultItem)
}

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
