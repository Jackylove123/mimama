import { getVaultRepository } from '../../services/vault-repository'
import { clearSession, lockCountdownSeconds, verifyPin } from '../../services/security'
import { ensureUnlocked } from '../../utils/auth-guard'

type SensitiveAction = 'import' | 'export' | 'wipe' | ''
type DialogState = {
  visible: boolean
  title: string
  content: string
  showCancel: boolean
  maskClosable: boolean
  cancelText: string
  confirmText: string
  danger: boolean
}

interface LayoutWindowInfo {
  statusBarHeight?: number
  windowHeight: number
  safeArea?: {
    bottom: number
  }
}

interface ShareFileMessageOptions {
  filePath: string
  fileName?: string
  success?: () => void
  fail?: (error: unknown) => void
}

type ShareResult = 'shared' | 'cancelled' | 'unavailable' | 'failed'

const repository = getVaultRepository()

let lockTimer: number | undefined
let dialogResolver: ((confirmed: boolean) => void) | undefined
let scrollabilityTimer: number | undefined

const createDialogState = (): DialogState => ({
  visible: false,
  title: '',
  content: '',
  showCancel: true,
  maskClosable: false,
  cancelText: '取消',
  confirmText: '确定',
  danger: false,
})

Page({
  data: {
    recordCount: 0,
    recycleCount: 0,
    importing: false,
    showPinSheet: false,
    pinDigits: '',
    pendingAction: '' as SensitiveAction,
    cooldownSeconds: 0,
    pinSlots: [0, 1, 2, 3, 4, 5],
    keypadRows: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'del'],
    ],
    dialog: createDialogState(),
    feedbackActive: false,
    navHeightPx: 32,
    pagePaddingTopPx: 88,
    mineScrollable: false,
  },

  onLoad() {
    this.applyAdaptiveLayout()
    this.scheduleScrollabilityCheck()
  },

  onShow() {
    this.applyAdaptiveLayout()
    if (!ensureUnlocked('/pages/mine/index')) {
      return
    }

    this.refreshCooldown()
    void this.loadStatus()
    this.scheduleScrollabilityCheck()

    const pending = wx.getStorageSync('mimama.pendingAction')
    if (pending === 'export') {
      wx.removeStorageSync('mimama.pendingAction')
      this.requestSensitive('export')
    }
  },

  onUnload() {
    if (lockTimer) {
      clearInterval(lockTimer)
      lockTimer = undefined
    }
    if (dialogResolver) {
      dialogResolver(false)
      dialogResolver = undefined
    }
    if (scrollabilityTimer) {
      clearTimeout(scrollabilityTimer)
      scrollabilityTimer = undefined
    }
  },

  onTapChangePasscode() {
    wx.navigateTo({
      url: '/pages/passcode/index',
    })
  },

  onTapAbout() {
    wx.navigateTo({
      url: '/pages/about/index',
    })
  },

  onTapRecycle() {
    wx.navigateTo({
      url: '/pages/recycle/index',
    })
  },

  onFeedbackTouchStart() {
    this.setData({ feedbackActive: true })
  },

  onFeedbackTouchEnd() {
    if (!this.data.feedbackActive) {
      return
    }
    this.setData({ feedbackActive: false })
  },

  onTapExport() {
    this.requestSensitive('export')
  },

  async onTapImport() {
    if (this.data.importing) {
      return
    }
    this.requestSensitive('import')
  },

  async onTapWipe() {
    const confirmed = await this.openDialog({
      title: '抹除密麻麻所有数据',
      content: '抹除后数据无法恢复。确认继续吗？',
      showCancel: false,
      maskClosable: true,
      confirmText: '继续抹除',
      danger: true,
    })

    if (!confirmed) {
      return
    }

    this.requestSensitive('wipe')
  },

  onTapPinClose() {
    this.setData({
      showPinSheet: false,
      pinDigits: '',
      pendingAction: '',
    })
  },

  noop() {},

  onTapPinKey(event: WechatMiniprogram.BaseEvent) {
    if (this.data.cooldownSeconds > 0) {
      return
    }

    const key = event.currentTarget.dataset.key as string
    if (!key) {
      return
    }

    if (key === 'del') {
      this.setData({
        pinDigits: this.data.pinDigits.slice(0, -1),
      })
      return
    }

    if (this.data.pinDigits.length >= 6) {
      return
    }

    const next = `${this.data.pinDigits}${key}`
    this.setData({ pinDigits: next })

    if (next.length === 6) {
      void this.verifySensitivePin(next).catch((error) => {
        console.error('Failed to verify sensitive passcode on mine page:', error)
        this.setData({ pinDigits: '' })
        wx.showToast({
          title: '校验失败，请重试',
          icon: 'none',
        })
      })
    }
  },

  requestSensitive(action: SensitiveAction) {
    this.setData({
      showPinSheet: true,
      pinDigits: '',
      pendingAction: action,
    })
  },

  async verifySensitivePin(pin: string) {
    const result = await verifyPin(pin)
    this.setData({ pinDigits: '' })

    if (result.code === 'OK') {
      const action = this.data.pendingAction
      this.setData({
        showPinSheet: false,
        pendingAction: '',
      })
      void this.runSensitiveAction(action, pin).catch((error) => {
        console.error('Failed to run sensitive action on mine page:', error)
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none',
        })
      })
      return
    }

    if (result.code === 'LOCKED') {
      this.refreshCooldown()
      wx.showToast({
        title: '已触发冷却，请稍后',
        icon: 'none',
      })
      return
    }

    if (result.code === 'PAIRING_REQUIRED') {
      void this.openDialog({
        title: '需要重置本地数据',
        content: '暗号输错次数过多。请重新进入并设一个启动暗号。',
        showCancel: false,
      })
      return
    }

    wx.showToast({
      title: `暗号不对，还可再试 ${result.remainingAttempts} 次`,
      icon: 'none',
    })
  },

  async runSensitiveAction(action: SensitiveAction, verifiedPin: string) {
    if (action === 'import') {
      await this.importTxt(verifiedPin)
      return
    }

    if (action === 'export') {
      await this.exportTxt()
      return
    }

    if (action === 'wipe') {
      await this.wipeAllData()
    }
  },

  async importTxt(verifiedPin: string) {
    if (this.data.importing) {
      return
    }

    this.setData({ importing: true })

    try {
      const picked = await pickBackupFile()
      if (!picked) {
        return
      }

      const recheck = await verifyPin(verifiedPin)
      if (recheck.code !== 'OK') {
        wx.showToast({
          title: '暗号状态失效，请重试导入',
          icon: 'none',
        })
        return
      }

      const result = await repository.importTxt(picked.path)
      await this.openDialog({
        title: '导入完成',
        content: `共识别 ${result.totalCount} 条，新增 ${result.importedCount} 条，重复 ${result.duplicateCount} 条，跳过 ${result.skippedCount} 条。`,
        showCancel: false,
        confirmText: '我知道了',
      })

      this.loadStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const errMsg = (error as { errMsg?: string }).errMsg || ''
      if (message === 'INVALID_IMPORT_TXT') {
        wx.showToast({
          title: '备份文件无效或已损坏',
          icon: 'none',
        })
        return
      }

      if (message.includes('Vault is locked')) {
        wx.showToast({
          title: '导入前会话已锁定，请重试',
          icon: 'none',
        })
        return
      }

      console.error('Import txt failed:', error)
      wx.showToast({
        title: errMsg.includes('cancel') ? '已取消选择' : '导入失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ importing: false })
    }
  },

  async exportTxt() {
    const result = await repository.exportTxt()
    const shareResult = await this.tryShareBackupFile(result.filePath)

    if (shareResult === 'shared') {
      await this.openDialog({
        title: '导出完成',
        content: '备份已加密，请妥善保管。',
        showCancel: false,
        confirmText: '我知道了',
      })
    } else if (shareResult === 'cancelled') {
      await this.openDialog({
        title: '已取消分享',
        content: '备份文件已生成，但你已取消分享。',
        showCancel: false,
        confirmText: '我知道了',
      })
    } else {
      await this.openDialog({
        title: '导出完成',
        content: '备份文件已生成并加密，请妥善保管。',
        showCancel: false,
        confirmText: '我知道了',
      })
    }

    this.loadStatus()
  },

  tryShareBackupFile(filePath: string) {
    const runtime = wx as WechatMiniprogram.Wx & {
      shareFileMessage?: (options: ShareFileMessageOptions) => void
    }
    const shareFileMessage = runtime.shareFileMessage

    if (typeof shareFileMessage !== 'function') {
      return Promise.resolve('unavailable' as ShareResult)
    }

    return new Promise<ShareResult>((resolve) => {
      shareFileMessage({
        filePath,
        fileName: filePath.split('/').pop() || 'Mimama-backup.mmbak',
        success: () => resolve('shared'),
        fail: (error) => {
          const errMsg = (error as { errMsg?: string }).errMsg || ''
          if (errMsg.includes('cancel')) {
            resolve('cancelled')
            return
          }
          console.warn('shareFileMessage failed:', error)
          resolve('failed')
        },
      })
    })
  },

  async wipeAllData() {
    await repository.resetVault()
    clearSession()

    wx.showToast({
      title: '密麻麻数据已清空',
      icon: 'none',
    })

    wx.reLaunch({
      url: '/pages/pin/index',
    })
  },

  async loadStatus() {
    const status = await repository.getStatus()

    this.setData(
      {
        recordCount: status.recordCount,
        recycleCount: status.recycleCount,
      },
      () => {
        this.scheduleScrollabilityCheck()
      },
    )
  },

  refreshCooldown() {
    if (lockTimer) {
      clearInterval(lockTimer)
      lockTimer = undefined
    }

    const seconds = lockCountdownSeconds()
    this.setData({ cooldownSeconds: seconds })

    if (seconds <= 0) {
      return
    }

    lockTimer = setInterval(() => {
      const next = lockCountdownSeconds()
      this.setData({ cooldownSeconds: next })
      if (next <= 0 && lockTimer) {
        clearInterval(lockTimer)
        lockTimer = undefined
      }
    }, 1000)
  },

  openDialog(options: Partial<DialogState>) {
    if (dialogResolver) {
      dialogResolver(false)
      dialogResolver = undefined
    }

    return new Promise<boolean>((resolve) => {
      dialogResolver = resolve
      this.setData({
        dialog: {
          ...createDialogState(),
          ...options,
          visible: true,
        },
      })
    })
  },

  onDialogConfirm() {
    this.closeDialog(true)
  },

  onDialogCancel() {
    this.closeDialog(false)
  },

  closeDialog(confirmed: boolean) {
    this.setData({ dialog: createDialogState() })
    if (!dialogResolver) {
      return
    }

    const resolve = dialogResolver
    dialogResolver = undefined
    resolve(confirmed)
  },

  applyAdaptiveLayout() {
    const menuRect = typeof wx.getMenuButtonBoundingClientRect === 'function' ? wx.getMenuButtonBoundingClientRect() : null

    const runtime = wx as WechatMiniprogram.Wx & {
      getWindowInfo?: () => LayoutWindowInfo
    }

    const windowInfo: LayoutWindowInfo =
      typeof runtime.getWindowInfo === 'function'
        ? runtime.getWindowInfo()
        : (wx.getSystemInfoSync() as unknown as LayoutWindowInfo)

    const statusBarHeight = windowInfo.statusBarHeight || 20
    const topPadding = menuRect ? menuRect.top : statusBarHeight + 8
    const navHeight = menuRect ? menuRect.height : 32

    this.setData(
      {
        navHeightPx: Math.round(navHeight),
        pagePaddingTopPx: Math.round(topPadding),
      },
      () => {
        this.scheduleScrollabilityCheck()
      },
    )
  },

  scheduleScrollabilityCheck() {
    if (scrollabilityTimer) {
      clearTimeout(scrollabilityTimer)
      scrollabilityTimer = undefined
    }

    scrollabilityTimer = setTimeout(() => {
      const query = wx.createSelectorQuery().in(this)
      query.select('.content-scroll').boundingClientRect()
      query.select('.content-inner').boundingClientRect()
      query.exec((result) => {
        const viewportRect = result && result[0]
        const contentRect = result && result[1]
        if (!viewportRect || !contentRect) {
          return
        }

        const viewportHeight = viewportRect.height || 0
        const contentHeight = contentRect.height || 0
        const nextScrollable = contentHeight - viewportHeight > 1
        if (nextScrollable !== this.data.mineScrollable) {
          this.setData({ mineScrollable: nextScrollable })
        }
      })
    }, 48)
  },
})

const pickBackupFile = () => {
  return new Promise<WechatMiniprogram.ChooseFile | null>((resolve, reject) => {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        resolve(res.tempFiles[0] || null)
      },
      fail: (error) => {
        const errMsg = (error as { errMsg?: string }).errMsg || ''
        if (errMsg.includes('cancel')) {
          resolve(null)
          return
        }
        reject(error)
      },
    })
  })
}
