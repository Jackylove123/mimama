import { STORAGE_MODE } from './services/runtime-config'
import { getVaultRepository } from './services/vault-repository'

App<IAppOption>({
  globalData: {
    storageMode: STORAGE_MODE,
  },

  onLaunch() {
    const repository = getVaultRepository(STORAGE_MODE)
    repository.ensureSeedData().catch((error) => {
      console.error('Failed to initialize seed data:', error)
    })
  },
})
