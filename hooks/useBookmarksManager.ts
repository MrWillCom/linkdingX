import { useCallback, useMemo } from 'react'
import useSWRInfinite from 'swr/infinite'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { storage } from '#imports'
import { UnreadFilter } from '@/components/FilterTabs'
import type { Bookmark } from '@/components/BookmarksList'

interface BookmarksResponse {
  count: number
  next: string | null
  previous: string | null
  results: Bookmark[]
}

const PAGE_SIZE = 15
const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})
const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

async function fetcher(key: string): Promise<BookmarksResponse> {
  const [server, apiToken] = await Promise.all([
    serverStorage.getValue(),
    apiTokenStorage.getValue(),
  ])
  if (!server || !apiToken) throw new Error('Setup not complete')

  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url: `${server}${key}`,
    options: { headers: { Authorization: `Token ${apiToken}` } },
  })

  if (!response.ok) throw new Error(response.data?.detail || 'Fetch failed')
  return response.data as BookmarksResponse
}

export function useBookmarksManager(unreadFilter: UnreadFilter) {
  const getKey = useCallback((idx: number, prev: BookmarksResponse | null) => {
    if (prev && !prev.next) return null
    return `/api/bookmarks/?limit=${PAGE_SIZE}&offset=${idx * PAGE_SIZE}`
  }, [])

  const { data, size, setSize, isLoading, isValidating, mutate, error } =
    useSWRInfinite<BookmarksResponse>(getKey, fetcher, {
      revalidateFirstPage: true,
      revalidateOnFocus: true,
      onSuccess: async data => {
        const all = data.flatMap(p => p.results)
        if (all.length === 0) return

        // 1. Get IDs of bookmarks that are currently pending deletion
        const pendingDeletions = await db.sync_queue
          .where('action')
          .equals('delete')
          .toArray()
        const deletionIds = new Set(pendingDeletions.map(op => op.bookmark_id))

        // 2. Double-Locking: Get bookmarks with local modifications
        const localLocks = await db.bookmarks
          .where('_local_modified_at')
          .notEqual('')
          .toArray()
        const lockMap = new Map(
          localLocks.map(b => [b.id, b._local_modified_at!]),
        )

        // 3. Filter server results
        const filtered = all.filter(serverBookmark => {
          // Skip if pending deletion
          if (deletionIds.has(serverBookmark.id)) return false

          // Check for stale data against local lock
          const localLockTime = lockMap.get(serverBookmark.id)
          if (localLockTime) {
            const serverTime = new Date(serverBookmark.date_modified).getTime()
            const lockTime = new Date(localLockTime).getTime()
            if (serverTime < lockTime) {
              // Server data is stale, keep local version
              return false
            }
          }
          return true
        })

        // Basic optimization: compare lengths or some heuristic to avoid always writing
        const existing = await db.bookmarks
          .orderBy('date_added')
          .reverse()
          .limit(1)
          .toArray()

        if (
          existing.length > 0 &&
          existing[0].id === filtered[0]?.id &&
          existing[0].date_modified === filtered[0]?.date_modified &&
          filtered.length <= existing.length &&
          localLocks.length === 0
        ) {
          return
        }

        // Put only the bookmarks that aren't pending deletion or stale
        if (filtered.length > 0) {
          await db.bookmarks.bulkPut(filtered)
        }
      },
    })

  const bookmarks =
    useLiveQuery(async () => {
      const all = await db.bookmarks.orderBy('date_added').reverse().toArray()
      const pendingDeletions = await db.sync_queue
        .where('action')
        .equals('delete')
        .toArray()
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

  return {
    filteredBookmarks,
    isLoading,
    isValidating,
    isLoadingMore:
      isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined'),
    hasMore: !data || data[data.length - 1]?.next !== null,
    loadMore: () => setSize(s => s + 1),
    mutate,
    error,
  }
}
