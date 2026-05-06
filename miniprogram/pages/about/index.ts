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

  onTapVersion() {
    wx.showModal({
      title: '版本信息',
      content: '当前版本：V 1.0\n定位：纯本地密码记录与加密备份。',
      showCancel: false,
      confirmText: '知道了',
    })
  },
})
