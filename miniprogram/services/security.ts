import { getVaultRepository, type PasscodeVerifyResult } from './vault-repository'

const repository = getVaultRepository()

export const hasPin = async () => {
  return repository.isInitialized()
}

export const validatePinFormat = (pin: string) => {
  if (!/^\d{6}$/.test(pin)) {
    return '启动暗号必须是 6 位数字'
  }

  return ''
}

export const setPin = async (pin: string) => {
  await repository.initialize(pin)
}

export const verifyPin = async (pin: string): Promise<PasscodeVerifyResult> => {
  return repository.verifyPasscode(pin)
}

export const changePasscode = async (oldPasscode: string, newPasscode: string) => {
  return repository.changePasscode(oldPasscode, newPasscode)
}

export const clearSession = () => {
  repository.lockSession()
}

export const needsUnlock = () => {
  return repository.needsUnlock()
}

export const lockCountdownSeconds = () => {
  return repository.lockCountdownSeconds()
}

export const onAppHide = () => {
  repository.markAppHidden()
}

export const onAppShow = () => {
  repository.markAppVisible()
}

export const hardResetVault = async () => {
  await repository.resetVault()
}
