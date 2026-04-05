import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { useCurrentTabTracker } from '@/hooks/useCurrentTabTracker'

interface ServerCheckData {
  metadata: {
    title: string
    description: string
    [key: string]: unknown
  }
}

export function useCurrentTabBookmark() {
  const { currentTabUrl, realtimeMetadata } = useCurrentTabTracker()
  const [serverData, setServerData] = useState<ServerCheckData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const bookmark = useLiveQuery(
    () => (currentTabUrl ? db.bookmarks.where('url').equals(currentTabUrl).first() : undefined),
    [currentTabUrl],
  )

  useEffect(() => {
    let isCancelled = false

    if (!currentTabUrl || bookmark) {
      setServerData(null)
      setIsLoading(false)
      return
    }

    const checkServer = async () => {
      setIsLoading(true)
      try {
        const res = await browser.runtime.sendMessage({
          type: 'api-request',
          url: `/api/bookmarks/check/?url=${encodeURIComponent(currentTabUrl)}`,
        })

        if (!isCancelled) {
          if (res.ok) {
            setServerData(res.data)
          }
        }
      } catch (error) {
        console.warn('[useCurrentTabBookmark] Server check failed:', error)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    checkServer()

    return () => {
      isCancelled = true
    }
  }, [currentTabUrl, bookmark])

  return {
    bookmark,
    serverMetadata: serverData?.metadata,
    realtimeMetadata,
    isLoading,
    currentTabUrl,
  }
}
