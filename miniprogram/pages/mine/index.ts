import { getVaultRepository } from '../../services/vault-repository'
import { clearSession, disablePasscode, isPasscodeEnabledSync, lockCountdownSeconds, verifyPin } from '../../services/security'
import { ensureUnlocked } from '../../utils/auth-guard'
import { isTimelineSinglePageMode } from '../../utils/timeline-mode'
import { getOpenid, encryptBackup, formatEncryptedBackup, decryptBackup, parseEncryptedBackupV2, isBackupV2 } from '../../services/crypto'
import { generateBackupPdf, PdfSection } from '../../services/pdf-generator'
import { getCategoryLabel } from '../../services/category-engine'

type SensitiveAction = 'wipe' | 'disable_passcode' | ''
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
interface ShareAppMessageContent {
  title: string
  path: string
  imageUrl: string
  success?: () => void
  fail?: () => void
}

const repository = getVaultRepository()
const SHARE_TITLE = '密麻麻｜本地密码管理工具'
const SHARE_PATH = '/pages/vault/index'
const SHARE_IMAGE = '/assets/mimama-share.png'

let lockTimer: number | undefined
let dialogResolver: ((confirmed: boolean) => void) | undefined
let scrollabilityTimer: number | undefined
let pendingShareFilePath = ''

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function finishLoading(startTime: number, minMs: number) {
  const elapsed = Date.now() - startTime
  if (elapsed < minMs) {
    await sleep(minMs - elapsed)
  }
}

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
    passcodeEnabled: false,
    passcodeEntryLabel: '设置启动暗号',
    navHeightPx: 32,
    pagePaddingTopPx: 88,
    mineScrollable: false,
    singlePageMode: false,
    importLoading: false,
    importStatus: '' as '' | 'loading' | 'success' | 'fail',
  },

  onLoad() {
    this.applyAdaptiveLayout()
    this.scheduleScrollabilityCheck()
    this.setupShareMenu()
    this.syncEntryMode()
  },

  setupShareMenu() {
    if (typeof wx.showShareMenu !== 'function') {
      return
    }

    wx.showShareMenu({
      withShareTicket: false,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  },

  onShareAppMessage(): ShareAppMessageContent {
    const content: ShareAppMessageContent = {
      title: SHARE_TITLE,
      path: SHARE_PATH,
      imageUrl: SHARE_IMAGE,
    }

    return content
  },

  onShareTimeline() {
    return {
      title: SHARE_TITLE,
      query: 'redirect=%2Fpages%2Fvault%2Findex',
      imageUrl: SHARE_IMAGE,
    }
  },

  onShow() {
    this.applyAdaptiveLayout()
    if (this.syncEntryMode()) {
      return
    }

    if (!ensureUnlocked('/pages/mine/index')) {
      return
    }

    this.refreshCooldown()
    void this.loadStatus()
    this.scheduleScrollabilityCheck()
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
    const mode = this.data.passcodeEnabled ? 'change' : 'set'
    wx.navigateTo({
      url: `/pages/passcode/index?mode=${mode}`,
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

  onTapCategoryManage() {
    wx.navigateTo({
      url: '/pages/category-manage/index',
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

  async onTapExport() {
    wx.showLoading({ title: '正在导出...', mask: true })

    try {
      const openid = await getOpenid()
      const result = await repository.exportTxt()
      const encrypted = await encryptBackup(result.txt, openid)
      const encryptedText = formatEncryptedBackup(encrypted)

      const fs = wx.getFileSystemManager()
      const filePath = `${wx.env.USER_DATA_PATH}/backup-${Date.now()}.mmbak`
      fs.writeFileSync(filePath, encryptedText, 'utf8')

      wx.hideLoading()

      pendingShareFilePath = filePath
      void this.openDialog({
        title: '导出完成',
        content: '请导出到自己的微信小号或文件助手',
        confirmText: '分享',
        cancelText: '稍后',
      }).then((confirmed) => {
        if (!confirmed) {
          pendingShareFilePath = ''
          wx.showToast({ title: '已取消导出', icon: 'none', duration: 2000 })
        }
      })
    } catch (error) {
      wx.hideLoading()
      console.error('Export failed:', error)
      wx.showToast({ title: '导出失败，请重试', icon: 'none' })
    }
  },

  async onTapExportPlain() {
    wx.showLoading({ title: '生成PDF中...', mask: true })

    try {
      const [items, categories] = await Promise.all([
        repository.searchItems('', 'all'),
        repository.listCategories(),
      ])

      if (items.length === 0) {
        wx.hideLoading()
        wx.showToast({ title: '暂无记录可导出', icon: 'none' })
        return
      }

      const labelMap: Record<string, string> = {}
      categories.forEach((cat) => {
        labelMap[cat.id || cat.key] = cat.label
      })

      // Keep user's category order
      const catOrder = categories.map((c) => c.id || c.key)
      const grouped: Record<string, PdfSection> = {}

      for (const item of items) {
        const catId = item.categoryId || 'others'
        if (!grouped[catId]) {
          grouped[catId] = {
            categoryLabel: getCategoryLabel(catId, labelMap),
            entries: [],
          }
        }
        grouped[catId].entries.push({
          title: item.title,
          account: item.account,
          password: item.password,
          note: item.note || undefined,
        })
      }

      // Build ordered sections
      const sections: PdfSection[] = []
      for (const catId of catOrder) {
        if (grouped[catId] && grouped[catId].entries.length > 0) {
          sections.push(grouped[catId])
        }
      }
      // Include any items whose category wasn't in the user's category list
      for (const catId of Object.keys(grouped)) {
        if (!catOrder.includes(catId) && grouped[catId].entries.length > 0) {
          sections.push(grouped[catId])
        }
      }

      const pdfPath = await generateBackupPdf(sections)

      wx.hideLoading()

      pendingShareFilePath = pdfPath
      void this.openDialog({
        title: '导出完成',
        content: '请导出到自己的微信小号或文件助手',
        confirmText: '分享',
        cancelText: '稍后',
      }).then((confirmed) => {
        if (!confirmed) {
          pendingShareFilePath = ''
          wx.showToast({ title: '已取消导出', icon: 'none', duration: 2000 })
        }
      })
    } catch (error) {
      wx.hideLoading()
      const message = error instanceof Error ? error.message : String(error)
      console.error('Plain export failed:', error)
      wx.showToast({ title: message || '导出失败，请重试', icon: 'none', duration: 3000 })
    }
  },

  async onTapImport() {
    if (this.data.importLoading) {
      return
    }

    let content = ''

    try {
      const picked = await pickBackupFile()
      if (!picked) {
        return
      }

      const fs = wx.getFileSystemManager()
      const fileContent = fs.readFileSync(picked.path, 'utf8')
      content = typeof fileContent === 'string' ? fileContent : ''

      if (!content) {
        wx.showToast({ title: '备份文件为空', icon: 'none' })
        return
      }

      if (!isBackupV2(content)) {
        wx.showToast({ title: '请选择加密备份文件', icon: 'none' })
        return
      }
    } catch (error) {
      const errMsg = (error as { errMsg?: string }).errMsg || ''
      wx.showToast({
        title: errMsg.includes('cancel') ? '已取消选择' : '选择文件失败',
        icon: 'none',
      })
      return
    }

    // Show loading overlay
    this.setData({ importLoading: true, importStatus: 'loading' })

    const MIN_LOADING_MS = 1000
    const startTime = Date.now()

    try {
      const openid = await getOpenid()
      const encrypted = parseEncryptedBackupV2(content)
      if (!encrypted) {
        throw new Error('无法解析备份文件')
      }

      const decryptResult = await decryptBackup(encrypted, openid)

      if (!decryptResult.success || !decryptResult.data) {
        await finishLoading(startTime, MIN_LOADING_MS)
        this.setData({ importStatus: 'fail' })
        setTimeout(() => {
          this.setData({ importLoading: false, importStatus: '' })
        }, 1800)
        return
      }

      const fs = wx.getFileSystemManager()
      const tempPath = `${wx.env.USER_DATA_PATH}/temp-import-${Date.now()}.txt`
      fs.writeFileSync(tempPath, decryptResult.data, 'utf8')

      const importResult = await repository.importTxt(tempPath)

      await finishLoading(startTime, MIN_LOADING_MS)

      this.setData({ importLoading: false, importStatus: '' })
      void this.openDialog({
        title: '导入完成',
        content: `共识别 ${importResult.totalCount} 条，新增 ${importResult.importedCount} 条，重复 ${importResult.duplicateCount} 条，跳过 ${importResult.skippedCount} 条。`,
        showCancel: false,
        confirmText: '我知道了',
      })
      this.loadStatus()
    } catch (error) {
      console.error('Import failed:', error)
      await finishLoading(startTime, MIN_LOADING_MS)
      this.setData({ importStatus: 'fail' })
      setTimeout(() => {
        this.setData({ importLoading: false, importStatus: '' })
      }, 1800)
    }
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

  onTapDisablePasscode() {
    if (!this.isPasscodeRequiredNow()) {
      return
    }
    this.requestSensitive('disable_passcode')
  },

  onTapPinClose() {
    this.setData({
      showPinSheet: false,
      pinDigits: '',
      pendingAction: '',
    })
  },

  syncEntryMode() {
    const isSinglePage = isTimelineSinglePageMode()
    if (isSinglePage === this.data.singlePageMode) {
      return isSinglePage
    }

    this.setData({
      singlePageMode: isSinglePage,
    })
    return isSinglePage
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
    if (!this.isPasscodeRequiredNow()) {
      void this.runSensitiveAction(action).catch((error) => {
        console.error('Failed to run sensitive action without passcode on mine page:', error)
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none',
        })
      })
      return
    }

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

  async runSensitiveAction(action: SensitiveAction, verifiedPin = '') {
    if (action === 'wipe') {
      await this.wipeAllData()
      return
    }

    if (action === 'disable_passcode') {
      await this.disablePasscodeWithPin(verifiedPin)
    }
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
      url: '/pages/vault/index',
    })
  },

  async loadStatus() {
    const status = await repository.getStatus()
    const passcodeEnabled = !!status.passcodeEnabled

    this.setData(
      {
        recordCount: status.recordCount,
        recycleCount: status.recycleCount,
        passcodeEnabled,
        passcodeEntryLabel: passcodeEnabled ? '重置启动暗号' : '设置启动暗号',
      },
      () => {
        this.scheduleScrollabilityCheck()
      },
    )
  },

  async disablePasscodeWithPin(verifiedPin: string) {
    if (!this.isPasscodeRequiredNow()) {
      return
    }

    const confirmed = await this.openDialog({
      title: '关闭启动暗号？',
      content: '关闭后，下次打开无需暗号即可进入。你可以随时再次设置。',
      confirmText: '确认关闭',
      danger: true,
    })
    if (!confirmed) {
      return
    }

    const disabled = await disablePasscode(verifiedPin)
    if (!disabled) {
      wx.showToast({
        title: '暗号校验失败，请重试',
        icon: 'none',
      })
      return
    }

    wx.showToast({
      title: '已关闭启动暗号',
      icon: 'success',
    })
    await this.loadStatus()
    this.refreshCooldown()
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
    if (pendingShareFilePath) {
      const path = pendingShareFilePath
      pendingShareFilePath = ''
      this.closeDialog(true)
      void this.tryShareBackupFile(path).then((result) => {
        if (result === 'shared') {
          wx.showToast({ title: '已分享', icon: 'success', duration: 2000 })
        } else if (result === 'cancelled') {
          wx.showToast({ title: '已取消分享', icon: 'none', duration: 2000 })
        } else {
          wx.showToast({ title: '文件已生成', icon: 'none', duration: 2000 })
        }
      })
      return
    }
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

  isPasscodeRequiredNow() {
    return this.data.passcodeEnabled || isPasscodeEnabledSync()
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
