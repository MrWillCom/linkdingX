import { useState, useEffect } from 'react'
import { serverStorage, apiTokenStorage } from '@/utils/storage'

export function useSetup() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkSetup() {
      const server = await serverStorage.getValue()
      const apiToken = await apiTokenStorage.getValue()
      setIsSetupComplete(server !== '' && apiToken !== '')
      setIsLoading(false)
    }
    checkSetup()

    const unwatchServer = serverStorage.watch(() => checkSetup())
    const unwatchApiToken = apiTokenStorage.watch(() => checkSetup())

    return () => {
      unwatchServer()
      unwatchApiToken()
    }
  }, [])

  return {
    isSetupComplete,
    isLoading,
  }
}
