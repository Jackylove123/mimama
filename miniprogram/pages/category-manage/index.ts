import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { isTimelineSinglePageMode } from '../../utils/timeline-mode'
import type { VaultCategory, VaultCategoryDefinition } from '../../types/vault'

const repository = getVaultRepository()
const DRAG_SWITCH_THRESHOLD_PX = 74
const DRAG_SWAP_MIN_INTERVAL_MS = 120
const DRAG_FOLLOW_FACTOR = 0.84
const DRAG_OVERFLOW_FACTOR = 0.36
const MAX_CUSTOM_CATEGORY_COUNT = 10
const SHARE_TITLE = '密麻麻｜本地密码管理工具'
const SHARE_PATH = '/pages/pin/index?redirect=%2Fpages%2Fvault%2Findex'
const SHARE_IMAGE = '/assets/mimama-share.png'
const CATEGORY_RECOMMEND_TRIGGER_COUNTS = [1, 3, 6, 10]

interface CategoryRow {
  key: VaultCategory
  label: string
  source: 'system' | 'custom'
}

let loading = false
let pendingCategoryShare = false

Page({
  data: {
    categories: [] as CategoryRow[],
    canAddCustomCategory: true,
    recommendStage: 'idle' as 'idle' | 'gate' | 'ready',
    recommendShareReady: false,
    dragKey: '',
    dragStartY: 0,
    dragOffsetY: 0,
    dragStyle: '',
    dragDirty: false,
    dragLastSwapAt: 0,
    addSheetVisible: false,
    newCategoryLabel: '',
    creating: false,
    sheetInputFocus: false,
    singlePageMode: false,
  },

  onLoad() {
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

  onShareAppMessage() {
    return {
      title: SHARE_TITLE,
      path: SHARE_PATH,
      imageUrl: SHARE_IMAGE,
    }
  },

  onShareTimeline() {
    return {
      title: SHARE_TITLE,
      query: 'redirect=%2Fpages%2Fvault%2Findex',
      imageUrl: SHARE_IMAGE,
    }
  },

  onShow() {
    if (this.syncEntryMode()) {
      return
    }

    if (!ensureUnlocked('/pages/category-manage/index')) {
      return
    }

    if (this.data.recommendStage === 'gate' && pendingCategoryShare) {
      pendingCategoryShare = false
      this.markCategoryShareReady()
    }

    this.loadCategories()
  },

  onUnload() {
    pendingCategoryShare = false
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

  async loadCategories() {
    if (loading) {
      return
    }
    loading = true
    try {
      const categories = await repository.listCategories()
      const rows = categories.map(toCategoryRow)
      this.setData({
        categories: rows,
        canAddCustomCategory: countCustomCategories(rows) < MAX_CUSTOM_CATEGORY_COUNT,
      })
    } catch (error) {
      console.error('Failed to load category management page:', error)
      wx.showToast({
        title: '分类加载失败',
        icon: 'none',
      })
    } finally {
      loading = false
    }
  },

  onTapOpenAddSheet() {
    if (this.shouldShowCategoryRecommendGate()) {
      this.openCategoryRecommendGate()
      return
    }

    this.openAddSheetDirect()
  },

  openAddSheetDirect() {
    this.setData(
      {
        addSheetVisible: true,
        newCategoryLabel: '',
        sheetInputFocus: false,
      },
      () => {
        setTimeout(() => {
          this.setData({
            sheetInputFocus: true,
          })
        }, 16)
      },
    )
  },

  openCategoryRecommendGate() {
    this.setupShareMenu()
    this.setData({
      recommendStage: 'gate',
      recommendShareReady: false,
    })
  },

  onCloseCategoryRecommendGate() {
    this.resetCategoryRecommendGate()
  },

  markCategoryShareReady() {
    this.setData({ recommendShareReady: true })
  },

  onTapShareFriendForCategory() {
    pendingCategoryShare = true
  },

  onContinueAddAfterShare() {
    if (!this.data.recommendShareReady) {
      wx.showToast({
        title: '请先推荐密麻麻',
        icon: 'none',
      })
      return
    }

    this.resetCategoryRecommendGate()
    this.openAddSheetDirect()
  },

  shouldShowCategoryRecommendGate() {
    const customCount = countCustomCategories(this.data.categories)
    const nextCustomCount = customCount + 1
    return CATEGORY_RECOMMEND_TRIGGER_COUNTS.includes(nextCustomCount)
  },

  resetCategoryRecommendGate() {
    pendingCategoryShare = false
    this.setData({
      recommendStage: 'idle',
      recommendShareReady: false,
    })
  },

  onTapCloseAddSheet() {
    if (this.data.creating) {
      return
    }
    this.setData({
      addSheetVisible: false,
      newCategoryLabel: '',
      sheetInputFocus: false,
    })
  },

  onInputCategoryLabel(event: WechatMiniprogram.CustomEvent) {
    const value = typeof event.detail.value === 'string' ? event.detail.value : ''
    this.setData({
      newCategoryLabel: value,
    })
  },

  onCategoryInputFocus() {
    this.setData({
      sheetInputFocus: true,
    })
  },

  onCategoryInputBlur() {
    this.setData({
      sheetInputFocus: false,
    })
  },

  async onTapCreateCategory() {
    const label = this.data.newCategoryLabel.trim()
    if (!label) {
      wx.showToast({
        title: '分类名称不能为空',
        icon: 'none',
      })
      return
    }

    const normalizedLabel = normalizeCategoryLabelForCompare(label)
    const duplicated = this.data.categories.some(
      (category) => normalizeCategoryLabelForCompare(category.label) === normalizedLabel,
    )
    if (duplicated) {
      wx.showToast({
        title: '分类名称已存在',
        icon: 'none',
      })
      this.setData({ sheetInputFocus: true })
      return
    }

    if (this.data.creating) {
      return
    }

    const customCount = this.data.categories.filter((category) => category.source === 'custom').length
    if (customCount >= MAX_CUSTOM_CATEGORY_COUNT) {
      wx.showModal({
        title: '提示',
        content: `最多只能添加 ${MAX_CUSTOM_CATEGORY_COUNT} 个自定义分类`,
        showCancel: false,
        confirmText: '知道了',
      })
      return
    }

    this.setData({ creating: true })
    try {
      await repository.createCustomCategory(label)
      const categories = await repository.listCategories()
      const rows = categories.map(toCategoryRow)
      this.setData({
        categories: rows,
        canAddCustomCategory: countCustomCategories(rows) < MAX_CUSTOM_CATEGORY_COUNT,
        addSheetVisible: false,
        newCategoryLabel: '',
        sheetInputFocus: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'CATEGORY_CUSTOM_LIMIT') {
        wx.showModal({
          title: '提示',
          content: `最多只能添加 ${MAX_CUSTOM_CATEGORY_COUNT} 个自定义分类`,
          showCancel: false,
          confirmText: '知道了',
        })
        return
      }
      wx.showToast({
        title: message === 'CATEGORY_LABEL_EMPTY' ? '分类名称不能为空' : '添加失败，请重试',
        icon: 'none',
      })
    } finally {
      this.setData({ creating: false })
    }
  },

  async onTapDeleteCategory(event: WechatMiniprogram.BaseEvent) {
    const key = event.currentTarget.dataset.key as VaultCategory | undefined
    if (!key) {
      return
    }

    const target = this.data.categories.find((category) => category.key === key)
    if (!target || target.source !== 'custom') {
      return
    }

    const confirmed = await confirmDeleteCategory()
    if (!confirmed) {
      return
    }

    try {
      await repository.deleteCustomCategory(key)
      const categories = await repository.listCategories()
      const rows = categories.map(toCategoryRow)
      this.setData({
        categories: rows,
        canAddCustomCategory: countCustomCategories(rows) < MAX_CUSTOM_CATEGORY_COUNT,
      })
      wx.showToast({
        title: '已删除分类',
        icon: 'success',
      })
    } catch (error) {
      console.error('Failed to delete custom category:', error)
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none',
      })
    }
  },

  onRowLongPress(event: WechatMiniprogram.BaseEvent) {
    const key = event.currentTarget.dataset.key as string | undefined
    if (!key) {
      return
    }

    const touchY = pickTouchY(event)
    this.setData({
      dragKey: key,
      dragStartY: typeof touchY === 'number' ? touchY : 0,
      dragOffsetY: 0,
      dragStyle: 'transform: translate3d(0, 0px, 0) scale(1.015); z-index: 20;',
      dragDirty: false,
      dragLastSwapAt: 0,
    })

    if (typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({ type: 'light' })
    }
  },

  onRowTouchMove(event: WechatMiniprogram.BaseEvent) {
    const key = event.currentTarget.dataset.key as string | undefined
    if (!key || key !== this.data.dragKey) {
      return
    }

    this.onDragging(event)
  },

  onDragLayerTouchMove(event: WechatMiniprogram.BaseEvent) {
    this.onDragging(event)
  },

  onDragging(event: WechatMiniprogram.BaseEvent) {
    if (!this.data.dragKey) {
      return
    }

    const touchY = pickTouchY(event)
    if (typeof touchY !== 'number') {
      return
    }

    const now = Date.now()
    const offsetY = touchY - this.data.dragStartY
    this.setData({
      dragOffsetY: offsetY,
      dragStyle: `transform: translate3d(0, ${Math.round(getDragVisualOffset(offsetY))}px, 0) scale(1.015); z-index: 20;`,
    })

    if (Math.abs(offsetY) < DRAG_SWITCH_THRESHOLD_PX) {
      return
    }

    if (now - this.data.dragLastSwapAt < DRAG_SWAP_MIN_INTERVAL_MS) {
      return
    }

    const direction: 1 | -1 = offsetY > 0 ? 1 : -1
    if (!this.reorderDraggingRow(direction)) {
      return
    }

    const nextStartY = this.data.dragStartY + direction * DRAG_SWITCH_THRESHOLD_PX
    const nextOffsetY = touchY - nextStartY
    this.setData({
      dragStartY: nextStartY,
      dragOffsetY: nextOffsetY,
      dragStyle: `transform: translate3d(0, ${Math.round(getDragVisualOffset(nextOffsetY))}px, 0) scale(1.015); z-index: 20;`,
      dragDirty: true,
      dragLastSwapAt: now,
    })

    if (typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({ type: 'light' })
    }
  },

  onRowTouchEnd() {
    this.finishDrag()
  },

  onDragLayerTouchEnd() {
    this.finishDrag()
  },

  async finishDrag() {
    if (!this.data.dragKey) {
      return
    }

    const dirty = this.data.dragDirty
    this.resetDragState()

    if (!dirty) {
      return
    }

    const orderedKeys = this.data.categories.map((category) => category.key)
    try {
      await repository.reorderCategories(orderedKeys)
    } catch (error) {
      console.error('Failed to persist category order:', error)
      wx.showToast({
        title: '排序保存失败',
        icon: 'none',
      })
      this.loadCategories()
    }
  },

  reorderDraggingRow(step: 1 | -1) {
    const dragKey = this.data.dragKey
    if (!dragKey) {
      return false
    }

    const categories = [...this.data.categories]
    const fromIndex = categories.findIndex((category) => category.key === dragKey)
    if (fromIndex < 0) {
      return false
    }

    const toIndex = fromIndex + step
    if (toIndex < 0 || toIndex >= categories.length) {
      return false
    }

    ;[categories[fromIndex], categories[toIndex]] = [categories[toIndex], categories[fromIndex]]
    this.setData({ categories })
    return true
  },

  resetDragState() {
    this.setData({
      dragKey: '',
      dragStartY: 0,
      dragOffsetY: 0,
      dragStyle: '',
      dragDirty: false,
      dragLastSwapAt: 0,
    })
  },

  noop() {},
})

const toCategoryRow = (category: VaultCategoryDefinition): CategoryRow => {
  return {
    key: category.id || category.key,
    label: category.label,
    source: category.source,
  }
}

const countCustomCategories = (categories: CategoryRow[]): number => {
  return categories.filter((category) => category.source === 'custom').length
}

const confirmDeleteCategory = () => {
  return new Promise<boolean>((resolve) => {
    wx.showModal({
      title: '确定删除？',
      content: '删除后，该分类下数据自动划分到其他',
      confirmColor: '#ef4444',
      confirmText: '删除',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false),
    })
  })
}

const pickTouchY = (event: WechatMiniprogram.BaseEvent): number | null => {
  const detail = event as unknown as {
    touches?: Array<{ clientY?: number }>
    changedTouches?: Array<{ clientY?: number }>
  }
  const touch = (detail.touches && detail.touches[0]) || (detail.changedTouches && detail.changedTouches[0]) || null
  if (!touch || typeof touch.clientY !== 'number') {
    return null
  }
  return touch.clientY
}

const getDragVisualOffset = (rawOffset: number): number => {
  const abs = Math.abs(rawOffset)
  const sign = rawOffset < 0 ? -1 : 1
  if (abs <= DRAG_SWITCH_THRESHOLD_PX) {
    return rawOffset * DRAG_FOLLOW_FACTOR
  }
  const overflow = abs - DRAG_SWITCH_THRESHOLD_PX
  const eased = DRAG_SWITCH_THRESHOLD_PX * DRAG_FOLLOW_FACTOR + overflow * DRAG_OVERFLOW_FACTOR
  return sign * eased
}

const normalizeCategoryLabelForCompare = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()
}
