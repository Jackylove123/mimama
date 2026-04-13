import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { generatePassword } from '../../utils/password'

const app = getApp<IAppOption>()
const repository = getVaultRepository(app.globalData.storageMode)

Page({
  data: {
    id: '',
    title: '',
    account: '',
    password: '',
    website: '',
    note: '',
    isFavorite: false,
    isEdit: false,
    saving: false,
  },

  onLoad(options) {
    const id = options.id as string | undefined
    if (id) {
      this.setData({ id, isEdit: true })
    }
  },

  onShow() {
    const redirect = this.data.id ? `/pages/edit/index?id=${this.data.id}` : '/pages/edit/index'
    if (!ensureUnlocked(redirect)) {
      return
    }

    if (this.data.isEdit) {
      this.loadItem()
    }
  },

  onInput(event: WechatMiniprogram.CustomEvent) {
    const field = event.currentTarget.dataset.field as string
    const value = event.detail.value as string
    if (!field) {
      return
    }

    this.setData({
      [field]: value,
    })
  },

  onChangeFavorite(event: WechatMiniprogram.CustomEvent) {
    this.setData({
      isFavorite: event.detail.value as boolean,
    })
  },

  onGeneratePassword() {
    const password = generatePassword(16)
    this.setData({ password })
  },

  async onTapSave() {
    const title = this.data.title.trim()
    const account = this.data.account.trim()
    const password = this.data.password

    if (!title || !account || !password) {
      wx.showToast({
        title: '标题、账号、密码必填',
        icon: 'none',
      })
      return
    }

    if (this.data.saving) {
      return
    }

    this.setData({ saving: true })

    await repository.upsertItem({
      id: this.data.id || undefined,
      title,
      account,
      password,
      website: this.data.website,
      note: this.data.note,
      isFavorite: this.data.isFavorite,
    })

    this.setData({ saving: false })

    wx.showToast({
      title: '已保存',
      icon: 'success',
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
    })
  },
})
