import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { lockCountdownSeconds, markSensitiveVerified, needsSensitiveVerification, verifyPin } from '../../services/security'
import { maskPassword } from '../../utils/password'

const app = getApp<IAppOption>()
const repository = getVaultRepository(app.globalData.storageMode)

type SensitiveAction = 'reveal' | 'copy' | 'copyExit' | ''

let remaskTimer: number | undefined
let lockTimer: number | undefined

Page({
  data: {
    id: '',
    title: '',
    account: '',
    password: '',
    website: '',
    note: '',
    isFavorite: false,
    passwordVisible: false,
    maskedPassword: '••••••••',
    showSensitivePinSheet: false,
    sensitiveDigits: '',
    pendingAction: '' as SensitiveAction,
    cooldownSeconds: 0,
    keypadRows: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'del'],
    ],
    pinSlots: [0, 1, 2, 3, 4, 5],
  },

  onLoad(options) {
    const id = options.id as string | undefined
    if (!id) {
      wx.showToast({
        title: '缺少参数',
        icon: 'none',
      })
      return
    }

    this.setData({ id })
  },

  onShow() {
    const redirect = `/pages/detail/index?id=${this.data.id}`

    if (!ensureUnlocked(redirect)) {
      return
    }

    this.loadItem()
    this.refreshCooldown()
  },

  onUnload() {
    this.clearTimers()
  },

  onHide() {
    this.resetPasswordMask()
  },

  async onTapCopyAccount() {
    if (!this.data.account) {
      return
    }

    await copyToClipboard(this.data.account, '账号已复制')
  },

  onTapTogglePassword() {
    if (this.data.passwordVisible) {
      this.resetPasswordMask()
      return
    }

    this.runSensitiveAction('reveal')
  },

  onTapCopyPassword() {
    this.runSensitiveAction('copy')
  },

  onTapCopyAndExit() {
    this.runSensitiveAction('copyExit')
  },

  async onToggleFavorite() {
    if (!this.data.id) {
      return
    }

    await repository.toggleFavorite(this.data.id)
    this.loadItem()
  },

  onTapEdit() {
    wx.navigateTo({
      url: `/pages/edit/index?id=${this.data.id}`,
    })
  },

  onTapSensitiveClose() {
    this.setData({
      showSensitivePinSheet: false,
      sensitiveDigits: '',
      pendingAction: '',
    })
  },

  noop() {},

  onTapSensitiveKey(event: WechatMiniprogram.BaseEvent) {
    if (this.data.cooldownSeconds > 0) {
      return
    }

    const key = event.currentTarget.dataset.key as string
    if (!key) {
      return
    }

    if (key === 'del') {
      this.setData({
        sensitiveDigits: this.data.sensitiveDigits.slice(0, -1),
      })
      return
    }

    if (this.data.sensitiveDigits.length >= 6) {
      return
    }

    const next = `${this.data.sensitiveDigits}${key}`
    this.setData({ sensitiveDigits: next })

    if (next.length === 6) {
      this.verifySensitivePin(next)
    }
  },

  async onTapDelete() {
    const { confirm } = await showConfirm('删除记录', '确认删除这条记录吗？')
    if (!confirm) {
      return
    }

    await repository.deleteItem(this.data.id)

    wx.showToast({
      title: '已删除',
      icon: 'none',
    })

    wx.navigateBack()
  },

  async loadItem() {
    const item = await repository.getItemById(this.data.id)
    if (!item) {
      wx.showToast({
        title: '记录不存在',
        icon: 'none',
      })
      return
    }

    this.setData({
      title: item.title,
      account: item.account,
      password: item.password,
      website: item.website,
      note: item.note,
      isFavorite: item.isFavorite,
      passwordVisible: false,
      maskedPassword: maskPassword(item.password),
    })
  },

  async runSensitiveAction(action: SensitiveAction) {
    if (!this.data.password) {
      return
    }

    if (!needsSensitiveVerification()) {
      this.executeSensitiveAction(action)
      return
    }

    this.setData({
      showSensitivePinSheet: true,
      pendingAction: action,
      sensitiveDigits: '',
    })
  },

  verifySensitivePin(pin: string) {
    const result = verifyPin(pin)

    if (result.code === 'OK') {
      markSensitiveVerified()
      const action = this.data.pendingAction
      this.setData({
        showSensitivePinSheet: false,
        pendingAction: '',
        sensitiveDigits: '',
      })
      this.executeSensitiveAction(action)
      return
    }

    this.setData({ sensitiveDigits: '' })

    if (result.code === 'LOCKED') {
      wx.showToast({
        title: '已触发冷却，请稍后',
        icon: 'none',
      })
      this.refreshCooldown()
      return
    }

    if (result.code === 'PAIRING_REQUIRED') {
      this.setData({
        showSensitivePinSheet: false,
        pendingAction: '',
      })
      wx.navigateTo({
        url: `/pages/pin/index?redirect=${encodeURIComponent(`/pages/detail/index?id=${this.data.id}`)}`,
      })
      return
    }

    wx.showToast({
      title: `PIN 错误，还剩 ${result.remainingAttempts} 次`,
      icon: 'none',
    })
  },

  executeSensitiveAction(action: SensitiveAction) {
    if (action === 'reveal') {
      this.setData({
        passwordVisible: true,
      })
      this.startRemaskTimer()
      return
    }

    if (action === 'copy') {
      copyToClipboard(this.data.password, '密码已复制')
      repository.touchLastUsed(this.data.id)
      return
    }

    if (action === 'copyExit') {
      copyToClipboard(this.data.password, '已复制并退出').then(() => {
        repository.touchLastUsed(this.data.id)
        exitMiniProgramSafe()
      })
    }
  },

  startRemaskTimer() {
    if (remaskTimer) {
      clearTimeout(remaskTimer)
    }

    remaskTimer = setTimeout(() => {
      this.resetPasswordMask()
    }, 10 * 1000)
  },

  resetPasswordMask() {
    if (remaskTimer) {
      clearTimeout(remaskTimer)
      remaskTimer = undefined
    }

    this.setData({
      passwordVisible: false,
    })
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

  clearTimers() {
    this.resetPasswordMask()

    if (lockTimer) {
      clearInterval(lockTimer)
      lockTimer = undefined
    }
  },
})

const copyToClipboard = (value: string, title: string) => {
  return new Promise<void>((resolve) => {
    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({
          title,
          icon: 'none',
        })
        resolve()
      },
      fail: () => resolve(),
    })
  })
}

const showConfirm = (title: string, content: string) => {
  return new Promise<WechatMiniprogram.ShowModalSuccessCallbackResult>((resolve) => {
    wx.showModal({
      title,
      content,
      success: (result) => {
        resolve(result)
      },
    })
  })
}

const exitMiniProgramSafe = () => {
  const runtime = wx as WechatMiniprogram.Wx & {
    exitMiniProgram?: () => void
  }

  if (typeof runtime.exitMiniProgram === 'function') {
    runtime.exitMiniProgram()
  }
}
