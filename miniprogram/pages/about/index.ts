import { ensureUnlocked } from '../../utils/auth-guard'

Page({
  onShow() {
    ensureUnlocked('/pages/about/index')
  },

  onTapPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/index',
    })
  },
})
