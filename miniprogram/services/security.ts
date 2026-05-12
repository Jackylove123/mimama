import { getVaultRepository, type PasscodeVerifyResult } from './vault-repository'

const repository = getVaultRepository()

export const hasPin = async () => {
  return repository.isPasscodeEnabled()
}

export const validatePinFormat = (pin: string) => {
  if (!/^\d{6}$/.test(pin)) {
    return '启动暗号必须是 6 位数字'
  }

  return ''
}

export const setPin = async (pin: string) => {
  await repository.enablePasscode(pin)
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

export const isPasscodeEnabled = async () => {
  return repository.isPasscodeEnabled()
}

export const isPasscodeEnabledSync = () => {
  return repository.isPasscodeEnabledSync()
}

export const ensureVaultReady = () => {
  repository.ensureInitializedWithoutPasscodeSync()
}

export const enablePasscode = async (pin: string) => {
  return repository.enablePasscode(pin)
}

export const disablePasscode = async (pin: string) => {
  return repository.disablePasscode(pin)
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
