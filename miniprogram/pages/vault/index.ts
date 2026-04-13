import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { formatRelativeTime } from '../../utils/date'
import { maskPassword } from '../../utils/password'
import type { VaultItem } from '../../types/vault'

const app = getApp<IAppOption>()
const repository = getVaultRepository(app.globalData.storageMode)

interface VaultCard {
  id: string
  title: string
  account: string
  maskedPassword: string
  relativeUpdatedAt: string
  isFavorite: boolean
}

Page({
  data: {
    filterTab: 'recent',
    cards: [] as VaultCard[],
    loading: false,
    emptyText: '暂无数据，点击右下角添加第一条记录。',
  },

  onShow() {
    if (!ensureUnlocked('/pages/vault/index')) {
      return
    }

    this.loadCards()
  },

  onPullDownRefresh() {
    this.loadCards().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onTapSearch() {
    wx.switchTab({
      url: '/pages/search/index',
    })
  },

  onChangeFilter(event: WechatMiniprogram.BaseEvent) {
    const tab = event.currentTarget.dataset.tab as string
    if (tab !== 'recent' && tab !== 'favorite') {
      return
    }

    this.setData({
      filterTab: tab,
    })

    this.loadCards()
  },

  onOpenDetail(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }

    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`,
    })
  },

  onTapCreate() {
    wx.navigateTo({
      url: '/pages/edit/index',
    })
  },

  async loadCards() {
    this.setData({ loading: true })

    const items = this.data.filterTab === 'favorite' ? await repository.listFavorites() : await repository.listRecent(50)

    this.setData({
      cards: items.map(toCard),
      loading: false,
      emptyText:
        this.data.filterTab === 'favorite'
          ? '还没有收藏项，去详情页点亮星标吧。'
          : '暂无数据，点击右下角添加第一条记录。',
    })
  },
})

const toCard = (item: VaultItem): VaultCard => {
  return {
    id: item.id,
    title: item.title,
    account: item.account,
    maskedPassword: maskPassword(item.password),
    relativeUpdatedAt: formatRelativeTime(item.updatedAt),
    isFavorite: item.isFavorite,
  }
}
