import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'
import { formatRelativeTime } from '../../utils/date'
import { maskPassword } from '../../utils/password'
import type { VaultItem } from '../../types/vault'

const app = getApp<IAppOption>()
const repository = getVaultRepository(app.globalData.storageMode)

interface SearchCard {
  id: string
  title: string
  account: string
  maskedPassword: string
  updatedText: string
}

Page({
  data: {
    query: '',
    cards: [] as SearchCard[],
    loading: false,
  },

  onShow() {
    if (!ensureUnlocked('/pages/search/index')) {
      return
    }

    this.runSearch(this.data.query)
  },

  onInput(event: WechatMiniprogram.CustomEvent) {
    const query = event.detail.value as string
    this.setData({ query })
    this.runSearch(query)
  },

  onClear() {
    this.setData({ query: '' })
    this.runSearch('')
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

  async runSearch(query: string) {
    this.setData({ loading: true })
    const items = await repository.search(query)
    this.setData({
      cards: items.map(toCard),
      loading: false,
    })
  },
})

const toCard = (item: VaultItem): SearchCard => {
  return {
    id: item.id,
    title: item.title,
    account: item.account,
    maskedPassword: maskPassword(item.password),
    updatedText: formatRelativeTime(item.updatedAt),
  }
}
