import { useState, useEffect } from 'react'
import { storage } from '#imports'

export type MetadataSource = 'browser' | 'server'

const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

const fetchMetadataFromStorage = storage.defineItem<MetadataSource>(
  'local:fetchMetadataFrom',
  {
    fallback: 'browser',
  },
)

const defaultUnreadStorage = storage.defineItem<boolean>(
  'local:defaultUnread',
  {
    fallback: true,
  },
)

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
    serverStorage,
    apiTokenStorage,
    fetchMetadataFromStorage,
    defaultUnreadStorage,
  }
}
