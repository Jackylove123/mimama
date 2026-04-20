import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { maskPassword } from '../../utils/password'

const repository = getVaultRepository()

let remaskTimer: number | undefined
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
    id: '',
    title: '',
    account: '',
    password: '',
    note: '',
    passwordVisible: false,
    maskedPassword: '••••••••',
    dialog: createDialogState(),
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
  },

  onHide() {
    this.clearRemaskTimer()
    this.setData({ passwordVisible: false })
  },

  onUnload() {
    this.clearRemaskTimer()
    if (dialogResolver) {
      dialogResolver(false)
      dialogResolver = undefined
    }
  },

  async onTapCopyAccount() {
    await copyText(this.data.account, '账号已复制')
    await repository.touchLastUsed(this.data.id)
  },

  async onTapCopyPassword() {
    await copyText(this.data.password, '密码已复制')
    await repository.touchLastUsed(this.data.id)
  },

  onTapTogglePassword() {
    if (this.data.passwordVisible) {
      this.clearRemaskTimer()
      this.setData({ passwordVisible: false })
      return
    }

    this.setData({ passwordVisible: true })
    this.clearRemaskTimer()
    remaskTimer = setTimeout(() => {
      this.setData({ passwordVisible: false })
    }, 8 * 1000)
  },

  onTapEdit() {
    wx.navigateTo({
      url: `/pages/edit/index?id=${this.data.id}`,
    })
  },

  async onTapDelete() {
    const confirmed = await this.openDialog({
      title: '删除记录',
      content: '确认删除这条记录吗？删除后将移入回收站，保留 30 天。',
      confirmText: '移入回收站',
      danger: true,
    })
    if (!confirmed) {
      return
    }

    await repository.deleteItem(this.data.id)
    wx.showToast({
      title: '已移入回收站',
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
      note: item.note,
      passwordVisible: false,
      maskedPassword: maskPassword(item.password),
    })
  },

  clearRemaskTimer() {
    if (remaskTimer) {
      clearTimeout(remaskTimer)
      remaskTimer = undefined
    }
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
})

const copyText = (value: string, title: string) => {
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
