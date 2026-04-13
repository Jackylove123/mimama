const PIN_HASH_KEY = 'mimama.security.pinHash'
const PIN_FAIL_COUNT_KEY = 'mimama.security.pinFailCount'
const PIN_LOCK_UNTIL_KEY = 'mimama.security.pinLockUntil'
const SENSITIVE_VERIFIED_AT_KEY = 'mimama.security.sensitiveVerifiedAt'

const UNLOCK_WINDOW_MS = 12 * 60 * 60 * 1000
const SENSITIVE_WINDOW_MS = 5 * 60 * 1000
const COOLDOWN_MS = 30 * 1000
const MAX_FAIL_BEFORE_RESET = 8

let sessionUnlockedAt = 0

export type PinVerifyCode = 'OK' | 'INVALID' | 'LOCKED' | 'PAIRING_REQUIRED'

export interface PinVerifyResult {
  ok: boolean
  code: PinVerifyCode
  remainingAttempts: number
  lockUntil?: number
}

export const hasPin = () => typeof wx.getStorageSync(PIN_HASH_KEY) === 'string' && wx.getStorageSync(PIN_HASH_KEY).length > 0

export const validatePinFormat = (pin: string) => {
  if (!/^\d{6}$/.test(pin)) {
    return 'PIN 必须是 6 位数字'
  }

  if (isWeakPin(pin)) {
    return 'PIN 过于简单，请避免顺序号和重复数字'
  }

  return ''
}

export const setPin = (pin: string) => {
  const hash = hashPin(pin)
  wx.setStorageSync(PIN_HASH_KEY, hash)
  wx.setStorageSync(PIN_FAIL_COUNT_KEY, 0)
  wx.setStorageSync(PIN_LOCK_UNTIL_KEY, 0)
  markUnlocked()
  markSensitiveVerified()
}

export const verifyPin = (pin: string): PinVerifyResult => {
  const now = Date.now()
  const lockUntilRaw = wx.getStorageSync(PIN_LOCK_UNTIL_KEY)
  const lockUntil = typeof lockUntilRaw === 'number' ? lockUntilRaw : 0

  if (lockUntil > now) {
    return {
      ok: false,
      code: 'LOCKED',
      remainingAttempts: remainingAttempts(),
      lockUntil,
    }
  }

  const stored = wx.getStorageSync(PIN_HASH_KEY)
  if (typeof stored !== 'string' || stored.length === 0) {
    return {
      ok: false,
      code: 'PAIRING_REQUIRED',
      remainingAttempts: 0,
    }
  }

  if (stored === hashPin(pin)) {
    wx.setStorageSync(PIN_FAIL_COUNT_KEY, 0)
    wx.setStorageSync(PIN_LOCK_UNTIL_KEY, 0)
    markUnlocked()
    markSensitiveVerified()

    return {
      ok: true,
      code: 'OK',
      remainingAttempts: MAX_FAIL_BEFORE_RESET,
    }
  }

  const nextFail = currentFailCount() + 1
  wx.setStorageSync(PIN_FAIL_COUNT_KEY, nextFail)

  if (nextFail >= MAX_FAIL_BEFORE_RESET) {
    wx.removeStorageSync(PIN_HASH_KEY)
    wx.removeStorageSync(SENSITIVE_VERIFIED_AT_KEY)
    sessionUnlockedAt = 0

    return {
      ok: false,
      code: 'PAIRING_REQUIRED',
      remainingAttempts: 0,
    }
  }

  if (nextFail >= 5) {
    const nextLockUntil = now + COOLDOWN_MS
    wx.setStorageSync(PIN_LOCK_UNTIL_KEY, nextLockUntil)

    return {
      ok: false,
      code: 'LOCKED',
      remainingAttempts: MAX_FAIL_BEFORE_RESET - nextFail,
      lockUntil: nextLockUntil,
    }
  }

  return {
    ok: false,
    code: 'INVALID',
    remainingAttempts: MAX_FAIL_BEFORE_RESET - nextFail,
  }
}

export const clearSession = () => {
  sessionUnlockedAt = 0
}

export const markUnlocked = () => {
  sessionUnlockedAt = Date.now()
}

export const needsUnlock = () => {
  if (!sessionUnlockedAt) {
    return true
  }

  return Date.now() - sessionUnlockedAt > UNLOCK_WINDOW_MS
}

export const markSensitiveVerified = () => {
  wx.setStorageSync(SENSITIVE_VERIFIED_AT_KEY, Date.now())
}

export const needsSensitiveVerification = () => {
  if (needsUnlock()) {
    return true
  }

  const raw = wx.getStorageSync(SENSITIVE_VERIFIED_AT_KEY)
  if (typeof raw !== 'number') {
    return true
  }

  return Date.now() - raw > SENSITIVE_WINDOW_MS
}

export const lockCountdownSeconds = () => {
  const raw = wx.getStorageSync(PIN_LOCK_UNTIL_KEY)
  if (typeof raw !== 'number') {
    return 0
  }

  const left = raw - Date.now()
  return left > 0 ? Math.ceil(left / 1000) : 0
}

const remainingAttempts = () => MAX_FAIL_BEFORE_RESET - currentFailCount()

const currentFailCount = () => {
  const raw = wx.getStorageSync(PIN_FAIL_COUNT_KEY)
  return typeof raw === 'number' ? raw : 0
}

const isWeakPin = (pin: string) => {
  if (pin === '123456' || pin === '654321' || pin === '111111') {
    return true
  }

  if (/^(\d)\1{5}$/.test(pin)) {
    return true
  }

  const digits = pin.split('').map((char) => Number(char))
  const ascending = digits.every((value, index) => index === 0 || value === digits[index - 1] + 1)
  const descending = digits.every((value, index) => index === 0 || value === digits[index - 1] - 1)

  return ascending || descending
}

const hashPin = (pin: string) => {
  const salted = `mimama:v0.1:${pin}`
  let hash = 2166136261

  for (let index = 0; index < salted.length; index += 1) {
    hash ^= salted.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `v1_${hash.toString(16)}`
}
