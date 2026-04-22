import { getVaultRepository } from '../../services/vault-repository'
import { CATEGORY_LABELS, CATEGORY_OPTIONS, inferCategoryByTitle, isCategory } from '../../services/category-engine'
import { ensureUnlocked } from '../../utils/auth-guard'
import { generatePassword } from '../../utils/password'
import type { VaultCategory, VaultCategorySource } from '../../types/vault'

const repository = getVaultRepository()

Page({
  data: {
    id: '',
    title: '',
    account: '',
    password: '',
    note: '',
    category: 'others' as VaultCategory,
    categorySource: 'default' as VaultCategorySource,
    categoryLabel: CATEGORY_LABELS.others,
    categoryOptions: CATEGORY_OPTIONS,
    categorySheetVisible: false,
    manualCategory: false,
    showPassword: false,
    isEdit: false,
    saving: false,
    deleting: false,
  },

  onLoad(options) {
    const id = options.id as string | undefined
    const presetCategory = options.category as string | undefined
    const pageTitle = id ? '编辑' : '添加'
    wx.setNavigationBarTitle({
      title: pageTitle,
    })

    if (id) {
      this.setData({ id, isEdit: true })
      return
    }

    if (isCategory(presetCategory)) {
      this.setData({
        category: presetCategory,
        categorySource: 'default',
        categoryLabel: CATEGORY_LABELS[presetCategory],
        manualCategory: false,
      })
    }
  },

  onShow() {
    this.setData({
      showPassword: false,
      categorySheetVisible: false,
    })

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
    const rawValue = event.detail.value as string | undefined
    const value = typeof rawValue === 'string' ? rawValue : ''
    if (!field) {
      return
    }

    const nextState: Record<string, unknown> = {
      [field]: value,
    }

    if (field === 'title' && !this.data.manualCategory) {
      const inferred = inferCategoryByTitle(value)
      nextState.category = inferred.category
      nextState.categorySource = inferred.source
      nextState.categoryLabel = CATEGORY_LABELS[inferred.category]
    }

    this.setData(nextState)
  },

  onGeneratePassword() {
    this.setData({
      password: generatePassword(16),
    })
  },

  onTogglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword,
    })
  },

  noop() {},

  onOpenCategorySheet() {
    this.setData({
      categorySheetVisible: true,
    })
  },

  onCloseCategorySheet() {
    this.setData({
      categorySheetVisible: false,
    })
  },

  onSelectCategory(event: WechatMiniprogram.BaseEvent) {
    const key = event.currentTarget.dataset.key as VaultCategory | undefined
    if (!key) {
      return
    }

    this.setData({
      category: key,
      categorySource: 'manual',
      categoryLabel: CATEGORY_LABELS[key],
      manualCategory: true,
      categorySheetVisible: false,
    })
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

    try {
      await repository.upsertItem({
        id: this.data.id || undefined,
        title,
        account,
        password,
        note: this.data.note,
        category: this.data.category,
        categorySource: this.data.manualCategory ? 'manual' : this.data.categorySource,
      })

      try {
        wx.setStorageSync('mimama.pendingCategory', this.data.category)
      } catch (_error) {}

      wx.showToast({
        title: '已保存',
        icon: 'success',
      })

      this.navigateAfterSave()
    } catch (_error) {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  async onTapDelete() {
    if (!this.data.isEdit || !this.data.id) {
      return
    }

    if (this.data.saving || this.data.deleting) {
      return
    }

    const confirmed = await confirmDelete()
    if (!confirmed) {
      return
    }

    this.setData({ deleting: true })

    try {
      await repository.deleteItem(this.data.id)
      wx.showToast({
        title: '已删除',
        icon: 'success',
      })
      wx.navigateBack()
    } catch (_error) {
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ deleting: false })
    }
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
      category: item.category,
      categorySource: item.categorySource,
      categoryLabel: CATEGORY_LABELS[item.category],
      manualCategory: item.categorySource === 'manual',
    })
  },

  navigateAfterSave() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }

    wx.switchTab({
      url: '/pages/vault/index',
    })
  },
})

const confirmDelete = () => {
  return new Promise<boolean>((resolve) => {
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后将进入回收站，并在 30 天后自动清除。',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    })
  })
}
