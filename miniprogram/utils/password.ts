const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%_.'

export const generatePassword = (length = 16) => {
  const targetLength = Math.max(8, Math.min(length, 64))
  let password = ''

  for (let index = 0; index < targetLength; index += 1) {
    const random = Math.floor(Math.random() * CHARSET.length)
    password += CHARSET[random]
  }

  return password
}

export const maskPassword = (password: string) => '•'.repeat(Math.max(8, Math.min(password.length, 16)))
