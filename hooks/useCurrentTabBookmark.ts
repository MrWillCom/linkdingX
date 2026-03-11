import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { useCurrentTabTracker } from '@/hooks/useCurrentTabTracker'

interface ServerCheckData {
  metadata: {
    title: string
    description: string
    [key: string]: any
  }
}

export function useCurrentTabBookmark() {
  const { currentTabUrl, realtimeMetadata } = useCurrentTabTracker()
  const [serverData, setServerData] = useState<ServerCheckData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 1. Watch local DB (The Truth)
  const bookmark = useLiveQuery(
    () =>
      currentTabUrl
        ? db.bookmarks.where('url').equals(currentTabUrl).first()
        : undefined,
    [currentTabUrl],
  )

  // 2. Background Sync (Enhancement)
  useEffect(() => {
    let isCancelled = false

    // Clear state on URL change or when bookmark is found locally
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
          } else {
            console.error(
              '[useCurrentTabBookmark] Server check failed:',
              res.error,
            )
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[useCurrentTabBookmark] API request error:', err)
        }
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
  }, [currentTabUrl, !!bookmark])

  return {
    bookmark,
    serverMetadata: serverData?.metadata,
    realtimeMetadata,
    isLoading,
    currentTabUrl,
  }
}
