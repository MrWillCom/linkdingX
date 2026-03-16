import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { storage } from '#imports'
import { db, type SyncOperation } from '@/utils/db'
import type { Bookmark } from '@/components/BookmarksList'

type QueueStatus = 'synced' | 'pending' | 'error'

interface QueueItem {
  id: number
  action: SyncOperation['action']
  title: string
  url: string
  timestamp: number
}

interface SyncQueueStatus {
  status: QueueStatus
  count: number
  tooltip: string
  items: QueueItem[]
}

const syncErrorStorage = storage.defineItem<boolean>('local:syncError', {
  fallback: false,
})

function getQueueTitle(
  bookmark: Bookmark | undefined,
  payload: Partial<Bookmark>,
  bookmarkId: number,
): { title: string; url: string } {
  if (bookmark) {
    return { title: bookmark.title || bookmark.url, url: bookmark.url }
  }
  if (payload.title || payload.url) {
    return {
      title: payload.title || payload.url || `Bookmark ${bookmarkId}`,
      url: payload.url || '',
    }
  }
  return { title: `Bookmark ${bookmarkId}`, url: '' }
}

function getTooltipText(status: QueueStatus, count: number): string {
  if (status === 'synced') return 'Synced'
  if (status === 'error') return 'Sync error'
  return `${count} tasks remaining`
}

export function useSyncQueueStatus(): SyncQueueStatus {
  const [syncError, setSyncError] = useState(false)

  useEffect(() => {
    let isActive = true
    syncErrorStorage.getValue().then(value => {
      if (isActive) setSyncError(value)
    })
    const unwatch = syncErrorStorage.watch(value => {
      setSyncError(value)
    })
    return () => {
      isActive = false
      unwatch()
    }
  }, [])

  const queueItems =
    useLiveQuery(async () => {
      const operations = await db.sync_queue.toArray()
      if (operations.length === 0) return []
      const enriched = await Promise.all(
        operations.map(async op => {
          const bookmark = await db.bookmarks.get(op.bookmark_id)
          const { title, url } = getQueueTitle(
            bookmark,
            op.payload,
            op.bookmark_id,
          )
          return {
            id: op.id ?? op.bookmark_id,
            action: op.action,
            title,
            url,
            timestamp: op.timestamp,
          }
        }),
      )
      return enriched.sort((a, b) => b.timestamp - a.timestamp)
    }) || []

  const count = queueItems.length
  const status: QueueStatus =
    count === 0 ? 'synced' : syncError ? 'error' : 'pending'

  useEffect(() => {
    if (count === 0 && syncError) {
      syncErrorStorage.setValue(false)
    }
  }, [count, syncError])

  const tooltip = useMemo(() => getTooltipText(status, count), [status, count])

  return {
    status,
    count,
    tooltip,
    items: queueItems,
  }
}
