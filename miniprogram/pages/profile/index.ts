import { ensureUnlocked } from '../../utils/auth-guard'
import { loadUserProfile, saveUserProfile, type UserProfileState } from '../../services/user-profile'

const GENDER_OPTIONS = ['未设置', '男', '女', '其他']

Page({
  data: {
    avatarUrl: '/assets/mimama-logo.png',
    nickname: '瞬刻用户',
    numberId: 'numberID',
    gender: '未设置',
    motto: '',
    genderOptions: GENDER_OPTIONS,
    genderIndex: 0,
  },

  onShow() {
    if (!ensureUnlocked('/pages/profile/index')) {
      return
    }
    this.syncProfileFromStorage()
  },

  onChooseAvatar(event: WechatMiniprogram.CustomEvent) {
    const detail = event.detail as { avatarUrl?: string }
    if (!detail || !detail.avatarUrl) {
      return
    }
    this.setData({
      avatarUrl: detail.avatarUrl,
    })
  },

  onInputNickname(event: WechatMiniprogram.CustomEvent) {
    const value = ((event.detail && (event.detail as { value?: string }).value) || '').trim()
    this.setData({
      nickname: value,
    })
  },

  onGenderChange(event: WechatMiniprogram.CustomEvent) {
    const index = Number((event.detail as { value?: string }).value || 0)
    const safeIndex = Number.isFinite(index) && index >= 0 && index < GENDER_OPTIONS.length ? index : 0
    this.setData({
      genderIndex: safeIndex,
      gender: GENDER_OPTIONS[safeIndex],
    })
  },

  onInputMotto(event: WechatMiniprogram.CustomEvent) {
    const value = ((event.detail && (event.detail as { value?: string }).value) || '').slice(0, 60)
    this.setData({
      motto: value,
    })
  },

  onTapSave() {
    const current = loadUserProfile()
    const nickname = this.data.nickname.trim() || current.nickname
    const motto = this.data.motto.trim() || '把重要信息记在瞬刻里。'

    const next: UserProfileState = {
      ...current,
      authorized: true,
      avatarUrl: this.data.avatarUrl || current.avatarUrl,
      nickname,
      gender: this.data.gender || current.gender,
      motto,
      numberId: current.numberId || this.data.numberId,
    }

    saveUserProfile(next)
    wx.showToast({
      title: '已保存',
      icon: 'success',
    })
  },

  syncProfileFromStorage() {
    const profile = loadUserProfile()
    const idx = Math.max(0, GENDER_OPTIONS.indexOf(profile.gender))

    this.setData({
      avatarUrl: profile.avatarUrl,
      nickname: profile.nickname,
      numberId: profile.numberId || 'numberID',
      gender: profile.gender,
      motto: profile.motto,
      genderIndex: idx,
    })
  },
})
