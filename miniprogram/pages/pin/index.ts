import { hardResetVault, hasPin, lockCountdownSeconds, setPin, validatePinFormat, verifyPin } from '../../services/security'

const TAB_PAGE_ROUTES = ['/pages/vault/index', '/pages/mine/index']

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
    title: '请输入启动暗号',
    tips: '不登录、不上传，只在本机解锁使用',
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
    cooldownSeconds: 0,
    redirectPath: '/pages/vault/index',
    dialog: createDialogState(),
  },

  async onLoad(options) {
    const redirect = normalizeRedirect(options.redirect)
    const creating = !(await hasPin())

    this.setData({
      creating,
      title: creating ? '设置启动暗号' : '请输入启动暗号',
      tips: creating
        ? '请设置 6 位启动暗号，用于本机解锁。'
        : '连续输错会触发冷却；超过阈值需重置本地数据。',
      redirectPath: redirect,
    })

    this.refreshCooldown()
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

  async handleFullPin(pin: string) {
    if (this.data.creating) {
      await this.handleSetupPin(pin)
      return
    }

    const result = await verifyPin(pin)

    if (result.code === 'OK') {
      wx.showToast({
        title: '解锁成功',
        icon: 'success',
      })

      this.navigateAfterSuccess()
      return
    }

    if (result.code === 'INVALID') {
      this.setData({ digits: '' })
      wx.showToast({
        title: `暗号错误，还剩 ${result.remainingAttempts} 次`,
        icon: 'none',
      })
      return
    }

    if (result.code === 'LOCKED') {
      this.setData({ digits: '' })
      this.refreshCooldown()
      wx.showToast({
        title: '已触发 30 秒冷却',
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
      title: '设置启动暗号',
      tips: '请重新设置启动暗号，用于本机解锁。',
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
        title: '再次输入启动暗号',
        tips: '确认一致后将创建本地密文仓',
      })

      this.showDialog({
        title: '请牢记暗号',
        content: '暗号仅存于你的脑海，一旦遗忘，数据将随风而去。',
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
        title: '设置启动暗号',
        tips: '两次输入不一致，请重新设置',
      })

      wx.showToast({
        title: '两次输入不一致',
        icon: 'none',
      })
      return
    }

    await setPin(pin)
    wx.showToast({
      title: '初始化完成',
      icon: 'success',
    })

    this.navigateAfterSuccess()
  },

  onResetFirstRound() {
    this.setData({
      setupStep: 1,
      firstPin: '',
      digits: '',
      title: '设置启动暗号',
      tips: '请设置 6 位启动暗号，用于本机解锁。',
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
