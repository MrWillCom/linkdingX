import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { useCurrentTabTracker } from '@/hooks/useCurrentTabTracker'

export function useCurrentTabBookmark() {
  const { currentTabUrl, realtimeMetadata } = useCurrentTabTracker()
  const [serverData, setServerData] = useState<any>(null)
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
    if (!currentTabUrl || bookmark) {
      setServerData(null)
      return
    }

    setIsLoading(true)
    browser.runtime
      .sendMessage({
        type: 'api-request',
        url: `/api/bookmarks/check/?url=${encodeURIComponent(currentTabUrl)}`,
      })
      .then(res => {
        if (res.ok) {
          setServerData(res.data)
        }
      })
      .catch(err =>
        console.error('[useCurrentTabBookmark] Background sync failed:', err),
      )
      .finally(() => setIsLoading(false))
  }, [currentTabUrl, !!bookmark])

  return {
    bookmark,
    serverMetadata: serverData?.metadata,
    realtimeMetadata,
    isLoading,
    currentTabUrl,
  }
}
