import { useCallback, useMemo, useEffect, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { serverStorage, fetchLimitStorage } from '@/utils/storage'
import type { UnreadFilter } from '@/components/FilterTabs'
import type { Bookmark } from '@/utils/types'

interface BookmarksResponse {
  count: number
  next: string | null
  previous: string | null
  results: Bookmark[]
}

const DEFAULT_PAGE_SIZE = 15

async function fetcher(key: string): Promise<BookmarksResponse> {
  const server = await serverStorage.getValue()
  if (!server) throw new Error('Setup not complete')

  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url: `${server}${key}`,
  })

  if (!response.ok) throw new Error(response.data?.detail || 'Fetch failed')
  return response.data as BookmarksResponse
}

export function useBookmarksManager(unreadFilter: UnreadFilter) {
  const fetchLimit = useLiveQuery(() => fetchLimitStorage.getValue()) ?? DEFAULT_PAGE_SIZE

  const getKey = useCallback(
    (idx: number, prev: BookmarksResponse | null) => {
      if (prev && !prev.next) return null
      return `/api/bookmarks/?limit=${fetchLimit}&offset=${idx * fetchLimit}`
    },
    [fetchLimit],
  )

  const { data, size, setSize, isLoading, isValidating, mutate, error } =
    useSWRInfinite<BookmarksResponse>(getKey, fetcher, {
      revalidateFirstPage: true,
      revalidateOnFocus: true,
      refreshInterval: 60000,
      onSuccess: async data => {
        const all = data.flatMap(p => p.results)
        if (all.length === 0) return

        const pendingQueue = await db.sync_queue.toArray()
        const pendingIds = new Set(pendingQueue.map(op => op.bookmark_id))

        const localLocks = await db.bookmarks
          .where('_local_modified_at')
          .notEqual('')
          .or('_sync_status')
          .equals('pending')
          .toArray()
        const lockMap = new Map(localLocks.map(b => [b.id, b._local_modified_at!]))
        const pendingStatusIds = new Set(localLocks.map(b => b.id))

        const filtered = all.filter(serverBookmark => {
          if (pendingIds.has(serverBookmark.id)) return false
          if (pendingStatusIds.has(serverBookmark.id)) return false

          const localLockTime = lockMap.get(serverBookmark.id)
          if (localLockTime) {
            const serverTime = new Date(serverBookmark.date_modified).getTime()
            const lockTime = new Date(localLockTime).getTime()
            if (serverTime < lockTime) {
              return false
            }
          }
          return true
        })

        const existing = await db.bookmarks.orderBy('date_added').reverse().limit(1).toArray()

        if (
          existing.length > 0 &&
          existing[0].id === filtered[0]?.id &&
          existing[0].date_modified === filtered[0]?.date_modified &&
          filtered.length <= existing.length &&
          localLocks.length === 0
        ) {
          return
        }

        if (filtered.length > 0) {
          await db.bookmarks.bulkPut(filtered)
        }
      },
    })

  const bookmarks =
    useLiveQuery(async () => {
      const all = await db.bookmarks.orderBy('date_added').reverse().toArray()
      const pendingDeletions = await db.sync_queue.where('action').equals('delete').toArray()
      const deletionIds = new Set(pendingDeletions.map(op => op.bookmark_id))
      return all.filter(b => !deletionIds.has(b.id))
    }) || []

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => {
      if (unreadFilter === 'unread') return b.unread
      if (unreadFilter === 'read') return !b.unread
      return true
    })
  }, [bookmarks, unreadFilter])

  const stateRef = useRef({
    data,
    isLoading,
    isValidating,
    size,
    fetchLimit,
    setSize,
  })
  useEffect(() => {
    stateRef.current = {
      data,
      isLoading,
      isValidating,
      size,
      fetchLimit,
      setSize,
    }
  }, [data, isLoading, isValidating, size, fetchLimit, setSize])

  useEffect(() => {
    const { data, isLoading, isValidating, size, fetchLimit, setSize } = stateRef.current
    const hasMoreData = !data || data[data.length - 1]?.next !== null
    if (!isLoading && !isValidating && hasMoreData) {
      const threshold = (size * fetchLimit) / 2
      if (filteredBookmarks.length < threshold) {
        const timer = setTimeout(() => {
          setSize(s => s + 1)
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [filteredBookmarks.length])

  return {
    filteredBookmarks,
    isLoading,
    isValidating,
    isLoadingMore: isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'),
    hasMore: !data || data[data.length - 1]?.next !== null,
    loadMore: () => setSize(s => s + 1),
    mutate,
    error,
  }
}
