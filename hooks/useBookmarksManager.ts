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
      onSuccess: data => {
        const all = data.flatMap(p => p.results)
        if (all.length) db.bookmarks.bulkPut(all)
      },
    })

  const bookmarks =
    useLiveQuery(() =>
      db.bookmarks.orderBy('date_added').reverse().toArray(),
    ) || []

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
    isLoadingMore: isLoading || (size > 0 && data && !data[size - 1]),
    hasMore: !data || data[data.length - 1]?.next !== null,
    loadMore: () => setSize(s => s + 1),
    mutate,
    error,
  }
}
