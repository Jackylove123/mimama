import { hardResetVault, hasPin, lockCountdownSeconds, setPin, validatePinFormat, verifyPin } from '../../services/security'

const TAB_PAGE_ROUTES = ['/pages/vault/index', '/pages/mine/index']
const PRIVACY_AGREED_STORAGE_KEY = 'mm_privacy_agreed_v1'
const PRIVACY_CONSENT_ONCE_KEY = 'mm_privacy_consent_once_v1'

const PIN_COPY = {
  unlockTitle: '对一下启动暗号',
  unlockTips: '暗号连错会进入冷却；次数过多需重置本机数据。',
  setupTitle: '设一个启动暗号',
  setupTips: '设 6 位数字暗号，用它打开密麻麻。',
  setupConfirmTitle: '再对一次暗号',
  setupConfirmTips: '两次一致后，开始本地加密保存。',
  setupMismatchTips: '两次不一致，请重新设一个启动暗号。',
}

let lockTimer: number | undefined
let dialogResolver: ((confirmed: boolean) => void) | undefined

type DialogState = {
  visible: boolean
  title: string
  content: string
  showCancel: boolean
  cancelText: string
  confirmText: string
  danger: boolean
}

const createDialogState = (): DialogState => ({
  visible: false,
  title: '',
  content: '',
  showCancel: true,
  cancelText: '取消',
  confirmText: '确定',
  danger: false,
})

Page({
  data: {
    title: PIN_COPY.unlockTitle,
    tips: PIN_COPY.unlockTips,
    digits: '',
    pinSlots: [0, 1, 2, 3, 4, 5],
    keypadRows: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'del'],
    ],
    setupStep: 1,
    firstPin: '',
    creating: false,
    pinBootstrapped: false,
    cooldownSeconds: 0,
    redirectPath: '/pages/vault/index',
    showPrivacyPopup: false,
    privacyContractName: '隐私协议',
    privacyNeedOfficialAuth: false,
    dialog: createDialogState(),
  },

  async onLoad(options) {
    this.setData({
      redirectPath: normalizeRedirect(options.redirect),
    })

    const privacyReady = await this.ensurePrivacyReady()
    if (!privacyReady) {
      return
    }

    await this.bootstrapPinPage()
  },

  onUnload() {
    this.stopLockTimer()
    if (dialogResolver) {
      dialogResolver(false)
      dialogResolver = undefined
    }
  },

  onTapKey(event: WechatMiniprogram.BaseEvent) {
    const key = event.currentTarget.dataset.key as string
    if (!key) {
      return
    }

    if (this.data.cooldownSeconds > 0) {
      return
    }

    if (key === 'del') {
      const next = this.data.digits.slice(0, -1)
      this.setData({ digits: next })
      return
    }

    if (this.data.digits.length >= 6) {
      return
    }

    const nextDigits = `${this.data.digits}${key}`
    this.setData({ digits: nextDigits })

    if (nextDigits.length === 6) {
      void this.handleFullPin(nextDigits).catch((error) => {
        console.error('Failed to handle full passcode input on pin page:', error)
        this.setData({ digits: '' })
        wx.showToast({
          title: '处理失败，请重试',
          icon: 'none',
        })
      })
    }
  },

  noop() {},

  async ensurePrivacyReady() {
    if (this.hasPrivacyConsentOnce()) {
      return true
    }

    // Privacy popup is only needed on first-use bootstrap.
    // Returning users should never be interrupted on each unlock.
    const creating = !(await hasPin())
    if (!creating) {
      this.markPrivacyConsentOnce()
      return true
    }

    const localAgreed = this.hasLocalPrivacyAgreement()

    const runtime = wx as WechatMiniprogram.Wx & {
      getPrivacySetting?: (options: {
        success: (res: { needAuthorization?: boolean; privacyContractName?: string }) => void
        fail?: (error: unknown) => void
      }) => void
    }

    if (typeof runtime.getPrivacySetting !== 'function') {
      if (!localAgreed) {
        this.openPrivacyPopup('隐私协议', false)
        return false
      }
      this.markPrivacyConsentOnce()
      return true
    }

    try {
      const setting = await new Promise<{ needAuthorization?: boolean; privacyContractName?: string }>((resolve, reject) => {
        runtime.getPrivacySetting!({
          success: resolve,
          fail: reject,
        })
      })

      if (setting.needAuthorization) {
        this.openPrivacyPopup(setting.privacyContractName || '隐私协议', true)
        return false
      }

      if (!localAgreed) {
        this.openPrivacyPopup(setting.privacyContractName || '隐私协议', false)
        return false
      }

      this.markPrivacyConsentOnce()
      return true
    } catch (error) {
      console.warn('Failed to query privacy setting, fallback to local privacy gate:', error)
      if (!localAgreed) {
        this.openPrivacyPopup('隐私协议', false)
        return false
      }
      this.markPrivacyConsentOnce()
      return true
    }
  },

  async bootstrapPinPage() {
    if (this.data.pinBootstrapped) {
      return
    }

    const creating = !(await hasPin())

    this.setData({
      pinBootstrapped: true,
      creating,
      title: creating ? PIN_COPY.setupTitle : PIN_COPY.unlockTitle,
      tips: creating ? PIN_COPY.setupTips : PIN_COPY.unlockTips,
    })

    this.refreshCooldown()
  },

  onTapPrivacyContract() {
    // Always open in-app privacy document to keep wording/date fully controllable.
    wx.navigateTo({ url: '/pages/privacy/index' })
  },

  onRejectPrivacy() {
    wx.showToast({
      title: '同意后才能继续使用',
      icon: 'none',
    })

    setTimeout(() => {
      const runtime = wx as WechatMiniprogram.Wx & {
        exitMiniProgram?: () => void
      }
      if (typeof runtime.exitMiniProgram === 'function') {
        runtime.exitMiniProgram()
      }
    }, 420)
  },

  onAgreePrivacyTap() {
    if (this.data.privacyNeedOfficialAuth) {
      return
    }
    this.finishPrivacyAgreement()
  },

  onAgreePrivacyAuthorization() {
    this.finishPrivacyAgreement()
  },

  async handleFullPin(pin: string) {
    if (this.data.creating) {
      await this.handleSetupPin(pin)
      return
    }

    const result = await verifyPin(pin)

    if (result.code === 'OK') {
      wx.showToast({
        title: '暗号正确，已开启',
        icon: 'success',
      })

      this.navigateAfterSuccess()
      return
    }

    if (result.code === 'INVALID') {
      this.setData({ digits: '' })
      wx.showToast({
        title: `暗号不对，还可再试 ${result.remainingAttempts} 次`,
        icon: 'none',
      })
      return
    }

    if (result.code === 'LOCKED') {
      this.setData({ digits: '' })
      this.refreshCooldown()
      wx.showToast({
        title: '暗号输错过多，请稍后再试',
        icon: 'none',
      })
      return
    }

    this.setData({ digits: '' })

    const confirmed = await this.openDialog({
      title: '需要重置本地数据',
      content: '暗号连续错误过多。重置后将清空本机数据，且无法恢复。',
      confirmText: '确认重置',
      danger: true,
    })
    if (!confirmed) {
      return
    }

    await hardResetVault()
    this.setData({
      creating: true,
      setupStep: 1,
      firstPin: '',
      title: PIN_COPY.setupTitle,
      tips: PIN_COPY.setupTips,
    })
  },

  async handleSetupPin(pin: string) {
    if (this.data.setupStep === 1) {
      const error = validatePinFormat(pin)
      if (error) {
        this.setData({ digits: '' })
        wx.showToast({
          title: error,
          icon: 'none',
        })
        return
      }

      this.setData({
        firstPin: pin,
        digits: '',
        setupStep: 2,
        title: PIN_COPY.setupConfirmTitle,
        tips: PIN_COPY.setupConfirmTips,
      })

      this.showDialog({
        title: '请记住这串暗号',
        content: '暗号只在你这里。忘记暗号，记录将无法找回。',
        showCancel: false,
        confirmText: '继续',
      })
      return
    }

    if (pin !== this.data.firstPin) {
      this.setData({
        digits: '',
        firstPin: '',
        setupStep: 1,
        title: PIN_COPY.setupTitle,
        tips: PIN_COPY.setupMismatchTips,
      })

      wx.showToast({
        title: '两次不一致，请重设',
        icon: 'none',
      })
      return
    }

    await setPin(pin)
    wx.showToast({
      title: '暗号设置完成，已开启',
      icon: 'success',
    })

    this.navigateAfterSuccess()
  },

  onResetFirstRound() {
    this.setData({
      setupStep: 1,
      firstPin: '',
      digits: '',
      title: PIN_COPY.setupTitle,
      tips: PIN_COPY.setupTips,
    })
  },

  hasPrivacyConsentOnce() {
    try {
      return !!wx.getStorageSync(PRIVACY_CONSENT_ONCE_KEY)
    } catch (error) {
      console.warn('Failed to read privacy once state:', error)
      return false
    }
  },

  hasLocalPrivacyAgreement() {
    try {
      return !!wx.getStorageSync(PRIVACY_AGREED_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to read local privacy agreement state:', error)
      return false
    }
  },

  saveLocalPrivacyAgreement() {
    try {
      wx.setStorageSync(PRIVACY_AGREED_STORAGE_KEY, 1)
    } catch (error) {
      console.warn('Failed to persist local privacy agreement state:', error)
    }
  },

  savePrivacyConsentOnce() {
    try {
      wx.setStorageSync(PRIVACY_CONSENT_ONCE_KEY, 1)
    } catch (error) {
      console.warn('Failed to persist privacy once state:', error)
    }
  },

  markPrivacyConsentOnce() {
    this.saveLocalPrivacyAgreement()
    this.savePrivacyConsentOnce()
  },

  openPrivacyPopup(contractName: string, needOfficialAuth: boolean) {
    this.setData({
      showPrivacyPopup: true,
      privacyContractName: contractName,
      privacyNeedOfficialAuth: needOfficialAuth,
    })
  },

  finishPrivacyAgreement() {
    this.markPrivacyConsentOnce()

    this.setData({
      showPrivacyPopup: false,
      privacyNeedOfficialAuth: false,
    })

    void this.bootstrapPinPage().catch((error) => {
      console.error('Failed to continue boot after privacy authorization:', error)
      wx.showToast({
        title: '启动失败，请再试一次',
        icon: 'none',
      })
    })
  },

  refreshCooldown() {
    this.stopLockTimer()

    const seconds = lockCountdownSeconds()
    this.setData({ cooldownSeconds: seconds })

    if (seconds <= 0) {
      return
    }

    lockTimer = setInterval(() => {
      const next = lockCountdownSeconds()
      this.setData({ cooldownSeconds: next })
      if (next <= 0) {
        this.stopLockTimer()
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

  showDialog(options: Partial<DialogState>) {
    if (dialogResolver) {
      dialogResolver(false)
      dialogResolver = undefined
    }

    this.setData({
      dialog: {
        ...createDialogState(),
        ...options,
        visible: true,
      },
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

  stopLockTimer() {
    if (lockTimer) {
      clearInterval(lockTimer)
      lockTimer = undefined
    }
  },

  navigateAfterSuccess() {
    const target = this.data.redirectPath

    if (TAB_PAGE_ROUTES.includes(target)) {
      wx.switchTab({ url: target })
      return
    }

    const pages = getCurrentPages()
    if (pages.length <= 1) {
      wx.switchTab({
        url: '/pages/vault/index',
        success: () => {
          setTimeout(() => {
            wx.navigateTo({ url: target })
          }, 0)
        },
      })
      return
    }

    wx.redirectTo({ url: target })
  },
})

const normalizeRedirect = (raw?: string) => {
  if (!raw) {
    return '/pages/vault/index'
  }

  const decoded = decodeURIComponent(raw)
  if (decoded.startsWith('/')) {
    return decoded
  }

  return `/${decoded}`
}
