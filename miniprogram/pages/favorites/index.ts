import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { formatRelativeTime } from '../../utils/date'
import type { VaultItem } from '../../types/vault'

const app = getApp<IAppOption>()
const repository = getVaultRepository(app.globalData.storageMode)

interface FavoriteCard {
  id: string
  title: string
  account: string
  updatedText: string
}

Page({
  data: {
    cards: [] as FavoriteCard[],
  },

  onShow() {
    if (!ensureUnlocked('/pages/favorites/index')) {
      return
    }

    this.loadFavorites()
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

  async onToggleFavorite(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }

    await repository.toggleFavorite(id)
    wx.showToast({
      title: '已取消收藏',
      icon: 'none',
    })

    this.loadFavorites()
  },

  async loadFavorites() {
    const items = await repository.listFavorites()
    this.setData({
      cards: items.map(toCard),
    })
  },
})

const toCard = (item: VaultItem): FavoriteCard => {
  return {
    id: item.id,
    title: item.title,
    account: item.account,
    updatedText: formatRelativeTime(item.updatedAt),
  }
}
