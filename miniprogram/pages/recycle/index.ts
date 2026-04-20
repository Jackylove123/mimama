import { getVaultRepository } from '../../services/vault-repository'
import { ensureUnlocked } from '../../utils/auth-guard'

interface RecycleCard {
  id: string
  title: string
  account: string
  deletedAtText: string
  remainDaysText: string
}

type DialogState = {
  visible: boolean
  title: string
  content: string
  showCancel: boolean
  cancelText: string
  confirmText: string
  danger: boolean
}

const RECYCLE_RETENTION_DAYS = 30
const RECYCLE_RETENTION_MS = RECYCLE_RETENTION_DAYS * 24 * 60 * 60 * 1000
const repository = getVaultRepository()

let dialogResolver: ((confirmed: boolean) => void) | undefined

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
    cards: [] as RecycleCard[],
    loading: false,
    dialog: createDialogState(),
  },

  onShow() {
    if (!ensureUnlocked('/pages/recycle/index')) {
      return
    }

    this.loadRecycleCards()
  },

  onUnload() {
    if (dialogResolver) {
      dialogResolver(false)
      dialogResolver = undefined
    }
  },

  async onTapRestore(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }

    const restored = await repository.restoreRecycleItem(id)
    if (!restored) {
      wx.showToast({
        title: '记录不存在',
        icon: 'none',
      })
      return
    }

    wx.showToast({
      title: '已恢复到密麻麻',
      icon: 'none',
    })
    this.loadRecycleCards()
  },

  async onTapDeleteNow(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string
    if (!id) {
      return
    }

    const confirmed = await this.openDialog({
      title: '彻底删除',
      content: '删除后无法恢复，确认继续吗？',
      confirmText: '确认删除',
      danger: true,
    })
    if (!confirmed) {
      return
    }

    const removed = await repository.removeRecycleItem(id)
    if (!removed) {
      wx.showToast({
        title: '记录不存在',
        icon: 'none',
      })
      return
    }

    wx.showToast({
      title: '已彻底删除',
      icon: 'none',
    })
    this.loadRecycleCards()
  },

  async onTapClearAll() {
    if (this.data.cards.length === 0) {
      return
    }

    const confirmed = await this.openDialog({
      title: '清空回收站',
      content: '将彻底删除回收站所有记录，且无法恢复。',
      confirmText: '确认清空',
      danger: true,
    })
    if (!confirmed) {
      return
    }

    const removedCount = await repository.clearRecycleItems()
    wx.showToast({
      title: removedCount > 0 ? '回收站已清空' : '回收站为空',
      icon: 'none',
    })
    this.loadRecycleCards()
  },

  async loadRecycleCards() {
    this.setData({ loading: true })
    const items = await repository.listRecycleItems()
    const now = Date.now()
    const cards = items.map((item) =>
      toRecycleCard(
        item.id,
        item.title,
        item.account,
        typeof item.deletedAt === 'number' ? item.deletedAt : now,
      ),
    )
    this.setData({
      cards,
      loading: false,
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

const toRecycleCard = (id: string, title: string, account: string, deletedAt: number): RecycleCard => {
  const now = Date.now()
  const remainMs = Math.max(0, deletedAt + RECYCLE_RETENTION_MS - now)
  const remainDays = Math.max(1, Math.ceil(remainMs / (24 * 60 * 60 * 1000)))
  return {
    id,
    title,
    account,
    deletedAtText: formatDate(deletedAt),
    remainDaysText: `${remainDays} 天后自动清理`,
  }
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
