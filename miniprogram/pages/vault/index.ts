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
  },

  onHide() {
    this.hideRevealedPassword()
    this.clearRevealTimer()
  },

  onPullDownRefresh() {
    this.loadData({ animate: false }).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  noop() {},

  onInputQuery(event: WechatMiniprogram.CustomEvent) {
    const rawValue = event.detail.value as string | undefined
    this.setData({
      query: typeof rawValue === 'string' ? rawValue : '',
    })

    this.loadCards()
  },

  onClearQuery() {
    this.setData({ query: '' })
    this.loadCards()
  },

  onTapCategory(event: WechatMiniprogram.BaseEvent) {
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

    const scrollTop = event.detail && typeof event.detail.scrollTop === 'number' ? event.detail.scrollTop : 0
    panelScrollTops[index] = scrollTop

    if (index !== this.data.currentCategoryIndex) {
      return
    }

    const nextCompact = scrollTop > HEADER_COLLAPSE_SCROLL_TOP
    if (nextCompact !== this.data.compactHeader) {
      this.setData({ compactHeader: nextCompact })
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
    const id = event.currentTarget.dataset.id as string
    if (!id) {
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
    const pageBottom = fabBottom + 112

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
