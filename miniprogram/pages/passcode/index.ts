import { changePasscode, lockCountdownSeconds, validatePinFormat, verifyPin } from '../../services/security'

let lockTimer: number | undefined
let dialogResolver: ((confirmed: boolean) => void) | undefined

type Stage = 'verify_old' | 'new_first' | 'new_confirm'
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
    stage: 'verify_old' as Stage,
    title: '先对旧暗号',
    tips: '输入当前暗号',
    digits: '',
    firstNewPin: '',
    oldPin: '',
    pinSlots: [0, 1, 2, 3, 4, 5],
    keypadRows: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'del'],
    ],
    cooldownSeconds: 0,
    dialog: createDialogState(),
  },

  onShow() {
    this.refreshCooldown()
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
  },

  onTapKey(event: WechatMiniprogram.BaseEvent) {
    if (this.data.cooldownSeconds > 0) {
      return
    }

    const key = event.currentTarget.dataset.key as string
    if (!key) {
      return
    }

    if (key === 'del') {
      this.setData({
        digits: this.data.digits.slice(0, -1),
      })
      return
    }

    if (this.data.digits.length >= 6) {
      return
    }

    const next = `${this.data.digits}${key}`
    this.setData({ digits: next })

    if (next.length === 6) {
      void this.handleFullPin(next).catch((error) => {
        console.error('Failed to handle full passcode input on passcode page:', error)
        this.setData({ digits: '' })
        wx.showToast({
          title: '处理失败，请重试',
          icon: 'none',
        })
      })
    }
  },

  async handleFullPin(pin: string) {
    if (this.data.stage === 'verify_old') {
      const result = await verifyPin(pin)

      if (result.code === 'OK') {
        this.setData({
          stage: 'new_first',
          title: '设一个新暗号',
          tips: '请输入新的 6 位启动暗号',
          digits: '',
          oldPin: pin,
        })
        return
      }

      this.setData({ digits: '' })
      this.handleVerifyError(result)
      return
    }

    if (this.data.stage === 'new_first') {
      const error = validatePinFormat(pin)
      if (error) {
        this.setData({ digits: '' })
        wx.showToast({ title: error, icon: 'none' })
        return
      }

      this.setData({
        stage: 'new_confirm',
        title: '再对一次新暗号',
        tips: '两次一致后，重新加密本地数据',
        digits: '',
        firstNewPin: pin,
      })

      this.showDialog({
        title: '请记住这串暗号',
        content: '暗号只在你这里。忘记暗号，记录将无法找回。',
        showCancel: false,
        confirmText: '继续',
      })
      return
    }

    if (pin !== this.data.firstNewPin) {
      this.setData({
        stage: 'new_first',
        title: '设一个新暗号',
        tips: '两次输入不一致，请重新设置',
        digits: '',
        firstNewPin: '',
      })
      wx.showToast({ title: '两次输入不一致', icon: 'none' })
      return
    }

    const changed = await changePasscode(this.data.oldPin, pin)
    if (!changed) {
      this.setData({
        stage: 'verify_old',
        title: '先对旧暗号',
        tips: '验证失败，请重新输入当前暗号',
        digits: '',
        firstNewPin: '',
      })
      wx.showToast({ title: '旧暗号校验失败', icon: 'none' })
      return
    }

    wx.showToast({
      title: '新暗号已生效',
      icon: 'success',
    })

    wx.navigateBack()
  },

  handleVerifyError(result: { code: string; remainingAttempts: number }) {
    if (result.code === 'LOCKED') {
      this.refreshCooldown()
      wx.showToast({ title: '已触发冷却，请稍后', icon: 'none' })
      return
    }

    if (result.code === 'PAIRING_REQUIRED') {
      void this.openDialog({
        title: '需要重置本地数据',
        content: '旧暗号验证失败次数过多，请返回“我的”页执行重置。',
        showCancel: false,
      })
      return
    }

    wx.showToast({ title: `暗号不对，还可再试 ${result.remainingAttempts} 次`, icon: 'none' })
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

  onResetNewFirstRound() {
    this.setData({
      stage: 'new_first',
      title: '设一个新暗号',
      tips: '请输入新的 6 位启动暗号',
      digits: '',
      firstNewPin: '',
    })
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
})
