import { ensureUnlocked } from '../../utils/auth-guard'

Page({
  onShow() {
    ensureUnlocked('/pages/about/index')
  },
})
