import { hasPin, lockCountdownSeconds, setPin, validatePinFormat, verifyPin } from '../../services/security'

const TAB_PAGE_ROUTES = ['/pages/vault/index', '/pages/search/index', '/pages/favorites/index', '/pages/mine/index']

let lockTimer: number | undefined

Page({
  data: {
    title: '请输入 PIN',
    tips: '用于解锁密麻麻小程序',
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
  },

  onLoad(options) {
    const redirect = normalizeRedirect(options.redirect)
    const creating = !hasPin()

    this.setData({
      creating,
      title: creating ? '设置 6 位 PIN' : '请输入 PIN',
      tips: creating ? '仅保存在本地，用于解锁与敏感操作验证' : '连续输错会触发冷却或重置',
      redirectPath: redirect,
    })

    this.refreshCooldown()
  },

  onUnload() {
    this.stopLockTimer()
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
      this.handleFullPin(nextDigits)
    }
  },

  async handleFullPin(pin: string) {
    if (this.data.creating) {
      this.handleSetupPin(pin)
      return
    }

    const result = verifyPin(pin)

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
        title: `PIN 错误，还剩 ${result.remainingAttempts} 次`,
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

    this.setData({
      creating: true,
      digits: '',
      setupStep: 1,
      firstPin: '',
      title: '重新设置 PIN',
      tips: '失败次数过多，请重新设置本地 PIN',
    })

    wx.showModal({
      title: '需要重新设置 PIN',
      content: '已达到安全阈值，请重新设置 6 位 PIN 后继续。',
      showCancel: false,
    })
  },

  handleSetupPin(pin: string) {
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
        title: '再次输入 PIN',
        tips: '请再次输入，确认一致',
      })
      return
    }

    if (pin !== this.data.firstPin) {
      this.setData({
        digits: '',
        firstPin: '',
        setupStep: 1,
        title: '设置 6 位 PIN',
        tips: '两次输入不一致，请重新设置',
      })

      wx.showToast({
        title: '两次 PIN 不一致',
        icon: 'none',
      })
      return
    }

    setPin(pin)
    wx.showToast({
      title: 'PIN 设置成功',
      icon: 'success',
    })

    this.navigateAfterSuccess()
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
