import { getVaultRepository } from '../../services/vault-repository'
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '../../services/category-engine'
import { ensureUnlocked } from '../../utils/auth-guard'
import { formatRelativeTime } from '../../utils/date'
import { maskPassword } from '../../utils/password'
import type { BackupReminder, VaultCategory, VaultItem } from '../../types/vault'

const repository = getVaultRepository()

interface VaultCard {
  id: string
  title: string
  account: string
  passwordMasked: string
  passwordPlain: string
  updatedText: string
  note: string
  category: VaultCategory
  revealed: boolean
}

interface VaultSection {
  key: string
  label: string
  count: number
  cards: VaultCard[]
}

interface CategoryPanel {
  key: 'all' | VaultCategory
  sections: VaultSection[]
  scrollable: boolean
}

interface LayoutWindowInfo {
  statusBarHeight?: number
  windowHeight: number
  safeArea?: {
    bottom: number
  }
}

const REVEAL_SECONDS = 8
const DRAG_SWITCH_THRESHOLD_PX = 84
const DRAG_SWAP_MIN_INTERVAL_MS = 140
const DRAG_FOLLOW_FACTOR = 0.84
const DRAG_OVERFLOW_FACTOR = 0.36
let revealTimer: number | undefined

const FILTER_PILLS: Array<{ key: 'all' | VaultCategory; label: string }> = [
  { key: 'all', label: '全部' },
  ...CATEGORY_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
  })),
]
const CATEGORY_ORDER: VaultCategory[] = ['social', 'email', 'finance', 'website', 'others']
const CATEGORY_SEQUENCE: Array<'all' | VaultCategory> = ['all', ...CATEGORY_ORDER]
const HEADER_COLLAPSE_SCROLL_TOP = 24
const PENDING_CATEGORY_KEY = 'mimama.pendingCategory'
const panelScrollTops: number[] = Array(CATEGORY_SEQUENCE.length).fill(0)

Page({
  data: {
    query: '',
    cards: [] as VaultCard[],
    categoryPanels: [] as CategoryPanel[],
    pills: FILTER_PILLS,
    activeCategory: 'all' as 'all' | VaultCategory,
    currentCategoryIndex: 0,
    compactHeader: false,
    loading: false,
    revealedId: '',
    revealCountdown: 0,
    reminderVisible: false,
    reminderLevel: 'none',
    reminderMessage: '',
    reminderActionText: '',
    listFadeToken: 0,
    pillScrollIntoView: 'pill-all',
    loadedOnce: false,
    navHeightPx: 32,
    pagePaddingTopPx: 88,
    pagePaddingBottomPx: 180,
    fabBottomPx: 74,
    draggingId: '',
    isDragging: false,
    dragStartY: 0,
    dragLastY: 0,
    dragOffsetY: 0,
    dragStyle: '',
    dragDirty: false,
    dragLastSwapAt: 0,
  },

  onLoad() {
    this.applyAdaptiveLayout()
  },

  onShow() {
    this.applyAdaptiveLayout()

    if (!ensureUnlocked('/pages/vault/index')) {
      return
    }

    const pendingCategory = this.consumePendingCategory()
    if (pendingCategory) {
      const index = CATEGORY_SEQUENCE.indexOf(pendingCategory)
      if (index >= 0) {
        this.setData({
          activeCategory: pendingCategory,
          currentCategoryIndex: index,
          pillScrollIntoView: `pill-${pendingCategory}`,
          compactHeader: panelScrollTops[index] > HEADER_COLLAPSE_SCROLL_TOP,
        })
      }
    }

    this.loadData({
      silent: this.data.loadedOnce,
      animate: !this.data.loadedOnce,
    })
  },

  onUnload() {
    this.hideRevealedPassword()
    this.clearRevealTimer()
    this.stopDragging()
  },

  onHide() {
    this.hideRevealedPassword()
    this.clearRevealTimer()
    this.stopDragging()
  },

  onPullDownRefresh() {
    this.loadData({ animate: false }).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  noop() {},

  onInputQuery(event: WechatMiniprogram.CustomEvent) {
    const rawValue = event.detail.value as string | undefined
    const nextQuery = typeof rawValue === 'string' ? rawValue : ''
    if (nextQuery && this.data.draggingId) {
      this.stopDragging()
    }
    this.setData({
      query: nextQuery,
    })

    this.loadCards()
  },

  onClearQuery() {
    this.setData({ query: '' })
    this.loadCards()
  },

  onTapCategory(event: WechatMiniprogram.BaseEvent) {
    if (this.data.draggingId) {
      return
    }

    const key = event.currentTarget.dataset.key as 'all' | VaultCategory | undefined
    if (!key || key === this.data.activeCategory) {
      return
    }

    const index = CATEGORY_SEQUENCE.indexOf(key)
    if (index < 0) {
      return
    }

    this.applyCategoryByIndex(index)
  },

  onSwiperChange(event: WechatMiniprogram.CustomEvent<{ current?: number }>) {
    if (this.data.draggingId) {
      return
    }

    const index = event.detail.current
    if (typeof index !== 'number' || index < 0 || index >= CATEGORY_SEQUENCE.length) {
      return
    }

    if (index === this.data.currentCategoryIndex) {
      return
    }

    this.applyCategoryByIndex(index)
  },

  onPanelScroll(event: WechatMiniprogram.CustomEvent<{ scrollTop?: number }>) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isFinite(index) || index < 0 || index >= CATEGORY_SEQUENCE.length) {
      return
    }

    const rawScrollTop = event.detail && typeof event.detail.scrollTop === 'number' ? event.detail.scrollTop : 0
    const scrollTop = Math.max(0, rawScrollTop)
    panelScrollTops[index] = scrollTop

    if (index !== this.data.currentCategoryIndex) {
      return
    }

    const nextCompact = scrollTop > HEADER_COLLAPSE_SCROLL_TOP
    if (nextCompact !== this.data.compactHeader) {
      this.setData({ compactHeader: nextCompact })
    }
  },

  onPanelScrollToUpper(event: WechatMiniprogram.CustomEvent) {
    const index = Number(event.currentTarget.dataset.index)
    if (!Number.isFinite(index) || index < 0 || index >= CATEGORY_SEQUENCE.length) {
      return
    }

    panelScrollTops[index] = 0
    if (index === this.data.currentCategoryIndex && this.data.compactHeader) {
      this.setData({ compactHeader: false })
    }
  },

  onTapAdd() {
    const current = this.data.activeCategory
    const suffix = current === 'all' ? '' : `?category=${current}`
    wx.navigateTo({
      url: `/pages/edit/index${suffix}`,
    })
  },

  onOpenDetail(event: WechatMiniprogram.BaseEvent) {
    if (this.data.draggingId) {
      return
    }

    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }

    wx.navigateTo({
      url: `/pages/edit/index?id=${id}`,
    })
  },

  onTapBackup() {
    wx.setStorageSync('mimama.pendingAction', 'export')
    wx.switchTab({
      url: '/pages/mine/index',
    })
  },

  onRevealPassword(event: WechatMiniprogram.BaseEvent) {
    if (this.data.draggingId) {
      return
    }

    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }

    if (id === this.data.revealedId) {
      this.hideRevealedPassword()
      this.clearRevealTimer()
      return
    }

    this.setData({
      revealedId: id,
      revealCountdown: REVEAL_SECONDS,
    })
    this.syncCardsRevealState()
    this.clearRevealTimer()

    revealTimer = setInterval(() => {
      const next = this.data.revealCountdown - 1
      if (next <= 0) {
        this.hideRevealedPassword()
        this.clearRevealTimer()
        return
      }

      this.setData({
        revealCountdown: next,
      })
    }, 1000)
  },

  async onCopyAccount(event: WechatMiniprogram.BaseEvent) {
    if (this.data.draggingId) {
      return
    }

    const id = event.currentTarget.dataset.id as string
    const value = event.currentTarget.dataset.account as string
    if (!id || !value) {
      return
    }

    await copyText(value, '账号已复制')
    await repository.touchLastUsed(id)
    this.loadReminder()
  },

  async onCopyPassword(event: WechatMiniprogram.BaseEvent) {
    if (this.data.draggingId) {
      return
    }

    const id = event.currentTarget.dataset.id as string
    const value = event.currentTarget.dataset.password as string
    if (!id || !value) {
      return
    }

    await copyText(value, '密码已复制')
    await repository.touchLastUsed(id)
    this.loadReminder()
  },

  async loadData(options?: { silent?: boolean; animate?: boolean }) {
    const silent = options && options.silent
    const animate = !(options && options.animate === false)

    if (!silent) {
      this.setData({ loading: true })
    }

    try {
      await Promise.all([this.loadCards(animate), this.loadReminder()])
      this.setData({ loadedOnce: true })
    } catch (error) {
      console.error('Failed to load vault page data:', error)
      wx.showToast({
        title: '加载失败，请下拉重试',
        icon: 'none',
      })
    } finally {
      if (!silent) {
        this.setData({ loading: false })
      }
    }
  },

  async loadCards(animate = true) {
    const items = await repository.searchItems(this.data.query, 'all')
    const cards = items.map((item) => toCard(item, this.data.revealedId))
    this.setData({ cards })
    this.buildCategoryPanels(cards, undefined, { animate })
  },

  async loadReminder() {
    const reminder = await repository.getBackupReminder()
    this.setReminder(reminder)
  },

  syncCardsRevealState() {
    const nextCards = this.data.cards.map((card) => {
      return {
        ...card,
        revealed: card.id === this.data.revealedId,
      }
    })
    this.setData({ cards: nextCards })
    this.buildCategoryPanels(nextCards)
  },

  setReminder(reminder: BackupReminder) {
    this.setData({
      reminderVisible: reminder.level !== 'none',
      reminderLevel: reminder.level,
      reminderMessage: reminder.message,
      reminderActionText: reminder.actionText,
    })
  },

  clearRevealTimer() {
    if (revealTimer) {
      clearInterval(revealTimer)
      revealTimer = undefined
    }
  },

  hideRevealedPassword() {
    if (!this.data.revealedId && this.data.revealCountdown === 0) {
      return
    }

    this.setData({
      revealedId: '',
      revealCountdown: 0,
    })
    this.syncCardsRevealState()
  },

  onCardLongPress(event: WechatMiniprogram.BaseEvent) {
    if (!this.canDragCurrentCategory()) {
      return
    }

    const id = event.currentTarget.dataset.id as string | undefined
    const category = event.currentTarget.dataset.category as VaultCategory | undefined
    if (!id || !category || category !== this.data.activeCategory) {
      return
    }

    const touchY = pickTouchY(event)
    this.setData({
      draggingId: id,
      isDragging: true,
      dragStartY: typeof touchY === 'number' ? touchY : 0,
      dragLastY: typeof touchY === 'number' ? touchY : 0,
      dragOffsetY: 0,
      dragStyle: 'transform: translate3d(0, 0px, 0) scale(1.015); z-index: 20;',
      dragDirty: false,
      dragLastSwapAt: 0,
    })

    if (typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({ type: 'light' })
    }
  },

  onCardTouchMove(event: WechatMiniprogram.BaseEvent) {
    if (!this.data.draggingId) {
      return
    }

    const id = event.currentTarget.dataset.id as string | undefined
    if (!id || id !== this.data.draggingId) {
      return
    }

    const touchY = pickTouchY(event)
    if (typeof touchY !== 'number') {
      return
    }

    const now = Date.now()
    const offsetY = touchY - this.data.dragStartY
    const visualOffsetY = getDragVisualOffset(offsetY)
    this.setData({
      dragLastY: touchY,
      dragOffsetY: offsetY,
      dragStyle: `transform: translate3d(0, ${Math.round(visualOffsetY)}px, 0) scale(1.015); z-index: 20;`,
    })

    if (Math.abs(offsetY) < DRAG_SWITCH_THRESHOLD_PX) {
      return
    }

    if (now - this.data.dragLastSwapAt < DRAG_SWAP_MIN_INTERVAL_MS) {
      return
    }

    const direction: 1 | -1 = offsetY > 0 ? 1 : -1
    const moved = this.reorderDraggingCard(direction)
    if (!moved) {
      return
    }

    const nextStartY = this.data.dragStartY + direction * DRAG_SWITCH_THRESHOLD_PX
    const nextOffsetY = touchY - nextStartY
    const nextVisualOffsetY = getDragVisualOffset(nextOffsetY)
    this.setData({
      dragStartY: nextStartY,
      dragOffsetY: nextOffsetY,
      dragStyle: `transform: translate3d(0, ${Math.round(nextVisualOffsetY)}px, 0) scale(1.015); z-index: 20;`,
      dragLastSwapAt: now,
    })

    if (moved && !this.data.dragDirty) {
      this.setData({ dragDirty: true })
    }

    if (moved && typeof wx.vibrateShort === 'function') {
      wx.vibrateShort({ type: 'light' })
    }
  },

  onCardTouchEnd() {
    if (!this.data.draggingId) {
      return
    }

    if (!this.data.dragDirty || !!this.data.query) {
      this.stopDragging()
      return
    }

    const activeCategory = this.data.activeCategory
    if (activeCategory === 'all') {
      this.stopDragging()
      return
    }

    const orderedIds = this.data.cards.filter((card) => card.category === activeCategory).map((card) => card.id)

    this.stopDragging()

    void repository.reorderCategory(activeCategory, orderedIds).catch((error) => {
      console.error('Failed to persist category drag order:', error)
      wx.showToast({
        title: '排序保存失败，请重试',
        icon: 'none',
      })
    })
  },

  onDragLayerTouchMove(event: WechatMiniprogram.BaseEvent) {
    this.onCardTouchMove(event)
  },

  onDragLayerTouchEnd() {
    this.onCardTouchEnd()
  },

  applyCategoryByIndex(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= CATEGORY_SEQUENCE.length) {
      return
    }

    const nextCategory = CATEGORY_SEQUENCE[nextIndex]
    if (nextCategory === this.data.activeCategory && nextIndex === this.data.currentCategoryIndex) {
      return
    }

    const nextState: Record<string, unknown> = {
      activeCategory: nextCategory,
      currentCategoryIndex: nextIndex,
      pillScrollIntoView: `pill-${nextCategory}`,
      compactHeader: panelScrollTops[nextIndex] > HEADER_COLLAPSE_SCROLL_TOP,
    }

    this.setData(nextState)
  },

  canDragCurrentCategory() {
    return !this.data.query && this.data.activeCategory !== 'all'
  },

  reorderDraggingCard(step: 1 | -1) {
    const activeCategory = this.data.activeCategory
    if (activeCategory === 'all') {
      return false
    }

    const draggingId = this.data.draggingId
    if (!draggingId) {
      return false
    }

    const cards = [...this.data.cards]
    const categoryIndexes: number[] = []
    cards.forEach((card, index) => {
      if (card.category === activeCategory) {
        categoryIndexes.push(index)
      }
    })

    const dragPos = categoryIndexes.findIndex((index) => cards[index].id === draggingId)
    if (dragPos < 0) {
      return false
    }

    const targetPos = dragPos + step
    if (targetPos < 0 || targetPos >= categoryIndexes.length) {
      return false
    }

    const fromIndex = categoryIndexes[dragPos]
    const toIndex = categoryIndexes[targetPos]
    ;[cards[fromIndex], cards[toIndex]] = [cards[toIndex], cards[fromIndex]]

    this.setData({ cards })
    this.buildCategoryPanels(cards, activeCategory, { animate: false })
    return true
  },

  stopDragging() {
    if (
      !this.data.draggingId &&
      !this.data.isDragging &&
      !this.data.dragDirty &&
      this.data.dragLastY === 0 &&
      this.data.dragStartY === 0 &&
      this.data.dragOffsetY === 0
    ) {
      return
    }

    this.setData({
      draggingId: '',
      isDragging: false,
      dragDirty: false,
      dragStartY: 0,
      dragLastY: 0,
      dragOffsetY: 0,
      dragStyle: '',
      dragLastSwapAt: 0,
    })
  },

  buildCategoryPanels(cards: VaultCard[], activeCategory?: 'all' | VaultCategory, options?: { animate?: boolean }) {
    const targetCategory = typeof activeCategory === 'undefined' ? this.data.activeCategory : activeCategory
    const targetIndex = CATEGORY_SEQUENCE.indexOf(targetCategory)
    const safeIndex = targetIndex >= 0 ? targetIndex : 0
    const categoryPanels = buildPanelsByCategory(cards)
    const currentPanel = categoryPanels[safeIndex]
    const nextCompact = currentPanel && currentPanel.scrollable ? panelScrollTops[safeIndex] > HEADER_COLLAPSE_SCROLL_TOP : false
    const animate = !(options && options.animate === false)
    const nextData: Record<string, unknown> = {
      categoryPanels,
      activeCategory: CATEGORY_SEQUENCE[safeIndex],
      currentCategoryIndex: safeIndex,
      pillScrollIntoView: `pill-${CATEGORY_SEQUENCE[safeIndex]}`,
      compactHeader: nextCompact,
    }

    if (animate) {
      nextData.listFadeToken = this.data.listFadeToken + 1
    }

    this.setData(nextData)
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
    const safeArea = windowInfo.safeArea
    const safeInsetBottom = safeArea ? Math.max(0, windowInfo.windowHeight - safeArea.bottom) : 0

    // Align the brand row center with the native capsule row.
    const topPadding = menuRect ? menuRect.top : statusBarHeight + 8
    const navHeight = menuRect ? menuRect.height : 32

    const fabLift = clamp(windowInfo.windowHeight * 0.08, 58, 96)
    const fabBottom = safeInsetBottom + fabLift
    // Keep only a tiny visual seam above native tabbar.
    const pageBottom = 2

    this.setData({
      navHeightPx: Math.round(navHeight),
      pagePaddingTopPx: Math.round(topPadding),
      fabBottomPx: Math.round(fabBottom),
      pagePaddingBottomPx: Math.round(pageBottom),
    })
  },

  consumePendingCategory(): 'all' | VaultCategory | null {
    let raw: unknown
    try {
      raw = wx.getStorageSync(PENDING_CATEGORY_KEY)
      wx.removeStorageSync(PENDING_CATEGORY_KEY)
    } catch (_error) {
      return null
    }

    if (typeof raw !== 'string') {
      return null
    }

    if (raw === 'all' || CATEGORY_ORDER.includes(raw as VaultCategory)) {
      return raw as 'all' | VaultCategory
    }

    return null
  },
})

const toCard = (item: VaultItem, revealedId: string): VaultCard => {
  return {
    id: item.id,
    title: item.title,
    account: item.account,
    passwordMasked: maskPassword(item.password),
    passwordPlain: item.password,
    updatedText: formatRelativeTime(item.updatedAt),
    note: item.note,
    category: item.category,
    revealed: item.id === revealedId,
  }
}

const buildPanelsByCategory = (cards: VaultCard[]): CategoryPanel[] => {
  return CATEGORY_SEQUENCE.map((categoryKey) => {
    const sections = buildSectionsByCategory(cards, categoryKey)
    return {
      key: categoryKey,
      sections,
      scrollable: sections.length > 0,
    }
  })
}

const buildSectionsByCategory = (cards: VaultCard[], activeCategory: 'all' | VaultCategory): VaultSection[] => {
  if (activeCategory !== 'all') {
    const filtered = cards.filter((card) => card.category === activeCategory)
    if (filtered.length === 0) {
      return []
    }

    return [
      {
        key: activeCategory,
        label: CATEGORY_LABELS[activeCategory],
        count: filtered.length,
        cards: filtered,
      },
    ]
  }

  return CATEGORY_ORDER.map((categoryKey) => {
    const sectionCards = cards.filter((card) => card.category === categoryKey)
    return {
      key: categoryKey,
      label: CATEGORY_LABELS[categoryKey],
      count: sectionCards.length,
      cards: sectionCards,
    }
  }).filter((section) => section.count > 0)
}

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

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const pickTouchY = (event: WechatMiniprogram.BaseEvent): number | null => {
  const detail = event as unknown as {
    touches?: Array<{ clientY?: number }>
    changedTouches?: Array<{ clientY?: number }>
  }

  const touch =
    (detail.touches && detail.touches[0]) ||
    (detail.changedTouches && detail.changedTouches[0]) ||
    null

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
