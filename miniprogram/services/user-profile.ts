export interface UserProfileState {
  authorized: boolean
  avatarUrl: string
  nickname: string
  numberId: string
  gender: string
  motto: string
}

const USER_PROFILE_KEY = 'mimama.user.profile.v1'
const DEFAULT_AVATAR = '/assets/mimama-logo.png'
const DEFAULT_NICKNAME = '点击微信授权登录'
const DEFAULT_GENDER = '未设置'
const DEFAULT_MOTTO = '把重要信息记在密麻麻里。'

const createNumberId = () => {
  const now = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `numberID-${now}${random}`
}

const getDefaultProfile = (): UserProfileState => {
  return {
    authorized: false,
    avatarUrl: DEFAULT_AVATAR,
    nickname: DEFAULT_NICKNAME,
    numberId: createNumberId(),
    gender: DEFAULT_GENDER,
    motto: DEFAULT_MOTTO,
  }
}

const normalize = (raw: Partial<UserProfileState> | null | undefined): UserProfileState => {
  const base = getDefaultProfile()
  if (!raw || typeof raw !== 'object') {
    return base
  }

  const avatarUrl = raw.avatarUrl || base.avatarUrl
  const nickname = raw.nickname || base.nickname

  const hasCustomAvatar = avatarUrl !== DEFAULT_AVATAR
  const hasCustomNickname = nickname !== DEFAULT_NICKNAME && nickname.trim() !== ''
  const inferredAuthorized = !!raw.authorized || hasCustomAvatar || hasCustomNickname

  return {
    authorized: inferredAuthorized,
    avatarUrl,
    nickname,
    numberId: raw.numberId || base.numberId,
    gender: raw.gender || base.gender,
    motto: raw.motto || base.motto,
  }
}

export const loadUserProfile = (): UserProfileState => {
  try {
    const stored = wx.getStorageSync(USER_PROFILE_KEY)
    const parsed = typeof stored === 'string' ? (JSON.parse(stored) as Partial<UserProfileState>) : (stored as Partial<UserProfileState>)
    const normalized = normalize(parsed)

    if (!parsed || parsed.authorized !== normalized.authorized) {
      saveUserProfile(normalized)
    }

    return normalized
  } catch (_error) {
    return getDefaultProfile()
  }
}

export const saveUserProfile = (profile: UserProfileState) => {
  wx.setStorageSync(USER_PROFILE_KEY, JSON.stringify(profile))
}

export const updateUserProfile = (patch: Partial<UserProfileState>) => {
  const next = {
    ...loadUserProfile(),
    ...patch,
  }
  saveUserProfile(next)
  return next
}
