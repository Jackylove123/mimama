import { needsUnlock } from '../services/security'

export const ensureUnlocked = (redirectPath: string) => {
  if (!needsUnlock()) {
    return true
  }

  wx.navigateTo({
    url: `/pages/pin/index?redirect=${encodeURIComponent(redirectPath)}`,
  })

  return false
}
