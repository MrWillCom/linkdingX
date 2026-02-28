import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { Button, Link, Chip, Spinner, Tabs } from '@heroui/react'

interface Bookmark {
  id: number
  url: string
  title: string
  description: string
  notes: string
  web_archive_snapshot_url: string
  favicon_url: string
  preview_image_url: string
  is_archived: boolean
  unread: boolean
  shared: boolean
  tag_names: string[]
  date_added: string
  date_modified: string
}

interface BookmarksResponse {
  count: number
  next: string | null
  previous: string | null
  results: Bookmark[]
}

const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

async function fetcher(key: string): Promise<BookmarksResponse> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) {
    throw new Error('Setup not complete')
  }

  const fullUrl = `${server}${key}`
  const options: RequestInit = {
    headers: {
      Authorization: `Token ${apiToken}`,
    },
  }

  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url: fullUrl,
    options,
  })

  if (!response.ok) {
    throw new Error(response.data?.detail || 'Failed to fetch bookmarks')
  }

  return response.data as BookmarksResponse
}

async function toggleUnread(
  id: number,
  newUnread: boolean,
  setBookmarks: React.Dispatch<React.SetStateAction<Bookmark[]>>,
): Promise<void> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) return

  setBookmarks(prev =>
    prev.map(b => (b.id === id ? { ...b, unread: newUnread } : b)),
  )

  const fullUrl = `${server}/api/bookmarks/${id}/`

  const response = await browser.runtime.sendMessage({
    type: 'api-patch',
    url: fullUrl,
    data: { unread: newUnread },
    options: {
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    },
  })

  if (!response.ok) {
    setBookmarks(prev =>
      prev.map(b => (b.id === id ? { ...b, unread: !newUnread } : b)),
    )
  }
}

const PAGE_SIZE = 15

type UnreadFilter = 'all' | 'unread' | 'read'

export default function BookmarksList() {
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>('all')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  const getKey = useCallback(
    (pageIndex: number, previousPageData: BookmarksResponse | null) => {
      if (previousPageData && !previousPageData.next) return null
      const offset = pageIndex * PAGE_SIZE
      return `/api/bookmarks/?limit=${PAGE_SIZE}&offset=${offset}`
    },
    [],
  )

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<BookmarksResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: true,
    })

  useEffect(() => {
    const interval = setInterval(() => {
      mutate()
    }, 60000)

    return () => clearInterval(interval)
  }, [mutate])

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const hasTriggeredLoadRef = useRef(false)
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore && !isValidating) {
          const hasMore = !data || data[data.length - 1]?.next !== null
          if (hasMore) {
            hasTriggeredLoadRef.current = true
            setSize(size + 1)
          }
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [isLoadingMore, isValidating, data, setSize, size])

  const hasMore = !data || data[data.length - 1]?.next !== null

  useEffect(() => {
    if (data) {
      setBookmarks(data.flatMap(page => page.results))
    }
  }, [data])

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (unreadFilter === 'unread') return bookmark.unread
    if (unreadFilter === 'read') return !bookmark.unread
    return true
  })

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-danger">Error: {error.message}</p>
        <Spinner onClick={() => mutate()} className="cursor-pointer" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (bookmarks.length === 0 && !isLoading) {
    return (
      <div className="p-4">
        <p>No bookmarks yet.</p>
      </div>
    )
  }

  return (
    <div className="p-0">
      <div className="sticky top-0 left-0 right-0 z-10 px-2 py-2 bg-background">
        <Tabs
          selectedKey={unreadFilter}
          onSelectionChange={key => setUnreadFilter(key as UnreadFilter)}
        >
          <Tabs.List>
            <Tabs.Tab id="all">
              All
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="unread">
              Unread
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="read">
              Read
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>
      {filteredBookmarks.length > 0 ? (
        <>
          {filteredBookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              className="flex items-start gap-1 py-2 px-2 hover:bg-default-100 transition-colors border-b border-default-200 last:border-b-0"
            >
              <button
                onClick={() =>
                  toggleUnread(bookmark.id, !bookmark.unread, setBookmarks)
                }
                className="group flex-shrink-0 focus:outline-none cursor-pointer p-2 -mt-0.5 -ml-1.5 -mr-0.5 rounded-full hover:bg-default-200 active:bg-default-300 transition-colors"
                aria-label={bookmark.unread ? 'Mark as read' : 'Mark as unread'}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    bookmark.unread
                      ? 'bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700'
                      : 'bg-gray-300 group-hover:bg-gray-400 group-active:bg-gray-500'
                  }`}
                />
              </button>
              <div className="flex-1 min-w-0">
                <Link
                  href={bookmark.url}
                  target="_blank"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {bookmark.title || bookmark.url}
                </Link>
                {bookmark.description && (
                  <p className="text-xs text-muted mt-0.5 line-clamp-2">
                    {bookmark.description}
                  </p>
                )}
                <div className="flex flex-col gap-1.5 mt-1.5">
                  {bookmark.tag_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {bookmark.tag_names.map(tag => (
                        <Chip
                          key={tag}
                          size="sm"
                          variant="soft"
                          className="text-2xs"
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  )}
                  <span className="text-2xs text-muted">
                    {formatDistanceToNow(new Date(bookmark.date_added), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isLoadingMore && <Spinner />}
            {!isLoadingMore && hasMore && !hasTriggeredLoadRef.current && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setSize(size + 1)}
              >
                Load more
              </Button>
            )}
            {!isLoadingMore && !hasMore && (
              <p className="text-muted text-sm">No more bookmarks</p>
            )}
          </div>
        </>
      ) : (
        <p>No {unreadFilter} bookmarks.</p>
      )}
    </div>
  )
}
