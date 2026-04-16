import { useCallback, useEffect, useMemo } from 'react'
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

export function useBookmarksManager(unreadFilter: UnreadFilter, searchQuery: string = '') {
  const fetchLimit = useLiveQuery(() => fetchLimitStorage.getValue()) ?? DEFAULT_PAGE_SIZE

  const getKey = useCallback(
    (idx: number, prev: BookmarksResponse | null) => {
      if (prev && !prev.next) return null
      let url = `/api/bookmarks/?limit=${fetchLimit}&offset=${idx * fetchLimit}`

      if (unreadFilter === 'unread') {
        url += `&unread=yes`
      } else if (unreadFilter === 'read') {
        url += `&unread=no`
      }

      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`
      }
      return url
    },
    [fetchLimit, unreadFilter, searchQuery],
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
    const q = searchQuery ? searchQuery.toLowerCase() : ''
    return bookmarks.filter(b => {
      let matchesUnread = true
      if (unreadFilter === 'unread') matchesUnread = b.unread
      if (unreadFilter === 'read') matchesUnread = !b.unread

      if (searchQuery) {
        return (
          matchesUnread &&
          ((b.title?.toLowerCase() || '').includes(q) ||
            (b.url?.toLowerCase() || '').includes(q) ||
            (b.description?.toLowerCase() || '').includes(q) ||
            b.tag_names?.some(t => t.toLowerCase().includes(q)) ||
            false)
        )
      }
      return matchesUnread
    })
  }, [bookmarks, unreadFilter, searchQuery])

  const hasMore = !data || data[data.length - 1]?.next !== null

  useEffect(() => {
    if (!isLoading && !isValidating && hasMore) {
      const threshold = (size * fetchLimit) / 2
      if (filteredBookmarks.length < threshold) {
        const timer = setTimeout(() => setSize(s => s + 1), 100)
        return () => clearTimeout(timer)
      }
    }
  }, [filteredBookmarks.length, size, isLoading, isValidating, hasMore, fetchLimit, setSize])

  return {
    filteredBookmarks,
    isLoading,
    isValidating,
    isLoadingMore: isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'),
    hasMore,
    loadMore: useCallback(() => setSize(s => s + 1), [setSize]),
    resetSize: useCallback(() => setSize(1), [setSize]),
    mutate,
    error,
  }
}
