import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR, { type KeyedMutator } from 'swr'
import useSWRInfinite from 'swr/infinite'
import { Button, Card, Chip, Link, Spinner, Tabs } from '@heroui/react'
import { ExternalLink } from 'lucide-react'
import Settings from './Settings'

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
  mutateCurrentTabBookmark?: KeyedMutator<Bookmark | null>,
): Promise<void> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) return

  setBookmarks(prev =>
    prev.map(b => (b.id === id ? { ...b, unread: newUnread } : b)),
  )
  if (mutateCurrentTabBookmark) {
    await mutateCurrentTabBookmark(
      prev => (prev && prev.id === id ? { ...prev, unread: newUnread } : prev),
      {
        revalidate: false,
      },
    )
  }

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
    if (mutateCurrentTabBookmark) {
      await mutateCurrentTabBookmark(
        prev =>
          prev && prev.id === id ? { ...prev, unread: !newUnread } : prev,
        {
          revalidate: false,
        },
      )
    }
  }
}

const PAGE_SIZE = 15

function normalizeUrlForMatch(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    const normalizedPath =
      parsed.pathname.endsWith('/') && parsed.pathname !== '/'
        ? parsed.pathname.slice(0, -1)
        : parsed.pathname
    return `${parsed.origin}${normalizedPath}${parsed.search}`
  } catch {
    return url
  }
}

function normalizeUrlWithoutSearch(url: string): string {
  try {
    const parsed = new URL(url)
    const normalizedPath =
      parsed.pathname.endsWith('/') && parsed.pathname !== '/'
        ? parsed.pathname.slice(0, -1)
        : parsed.pathname
    return `${parsed.origin}${normalizedPath}`
  } catch {
    return url
  }
}

type CurrentTabBookmarkKey = readonly ['current-tab-bookmark', string]

async function fetchCurrentTabBookmark([
  _type,
  url,
]: CurrentTabBookmarkKey): Promise<Bookmark | null> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) return null

  const fullUrl = `${server}/api/bookmarks/?q=${encodeURIComponent(url)}&limit=20`
  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url: fullUrl,
    options: {
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    },
  })

  if (!response.ok) return null

  const results = (response.data as BookmarksResponse).results
  const normalizedCurrentUrl = normalizeUrlForMatch(url)
  const exactMatch = results.find(
    bookmark => normalizeUrlForMatch(bookmark.url) === normalizedCurrentUrl,
  )

  if (exactMatch) return exactMatch

  const normalizedCurrentUrlWithoutSearch = normalizeUrlWithoutSearch(url)
  return (
    results.find(
      bookmark =>
        normalizeUrlWithoutSearch(bookmark.url) ===
        normalizedCurrentUrlWithoutSearch,
    ) || null
  )
}

type UnreadFilter = 'all' | 'unread' | 'read'
type BookmarksListVariant = 'default' | 'expanded'

interface BookmarksListProps {
  variant?: BookmarksListVariant
}

export default function BookmarksList({
  variant = 'default',
}: BookmarksListProps) {
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>('all')
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)
  const [displayedCurrentTabBookmark, setDisplayedCurrentTabBookmark] =
    useState<Bookmark | null>(null)

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

  const currentTabKey: CurrentTabBookmarkKey | null = currentTabUrl
    ? ['current-tab-bookmark', normalizeUrlForMatch(currentTabUrl)]
    : null
  const {
    data: currentTabBookmarkData,
    isLoading: isCurrentTabBookmarkLoading,
    isValidating: isCurrentTabBookmarkValidating,
    mutate: mutateCurrentTabBookmark,
  } = useSWR<Bookmark | null, Error, CurrentTabBookmarkKey | null>(
    currentTabKey,
    fetchCurrentTabBookmark,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 300000,
      refreshInterval: 300000,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      keepPreviousData: true,
    },
  )

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

  useEffect(() => {
    const syncCurrentTab = async () => {
      try {
        const tabs = await browser.tabs.query({
          currentWindow: true,
          active: true,
        })
        const activeTabUrl = tabs[0]?.url
        if (
          activeTabUrl?.startsWith('http://') ||
          activeTabUrl?.startsWith('https://')
        ) {
          setCurrentTabUrl(activeTabUrl)
          return
        }
      } catch {
        // Ignore tab lookup errors and hide the card.
      }
      setCurrentTabUrl(null)
    }

    const onActivated = () => {
      syncCurrentTab()
    }
    const onUpdated = (
      _tabId: number,
      changeInfo: { url?: string },
      tab: { active?: boolean },
    ) => {
      if (!tab.active) return
      if (!changeInfo.url) return
      if (
        changeInfo.url.startsWith('http://') ||
        changeInfo.url.startsWith('https://')
      ) {
        setCurrentTabUrl(changeInfo.url)
      } else {
        setCurrentTabUrl(null)
      }
    }
    syncCurrentTab()
    browser.tabs.onActivated.addListener(onActivated)
    browser.tabs.onUpdated.addListener(onUpdated)

    return () => {
      browser.tabs.onActivated.removeListener(onActivated)
      browser.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [])

  useEffect(() => {
    if (!currentTabBookmarkData) return
    const updatedBookmark = bookmarks.find(
      b => b.id === currentTabBookmarkData.id,
    )
    if (
      updatedBookmark &&
      updatedBookmark.unread !== currentTabBookmarkData.unread
    ) {
      mutateCurrentTabBookmark(updatedBookmark, {
        revalidate: false,
      })
    }
  }, [bookmarks, currentTabBookmarkData, mutateCurrentTabBookmark])

  useEffect(() => {
    if (currentTabBookmarkData) {
      setDisplayedCurrentTabBookmark(currentTabBookmarkData)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayedCurrentTabBookmark(null)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [currentTabBookmarkData])

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (unreadFilter === 'unread') return bookmark.unread
    if (unreadFilter === 'read') return !bookmark.unread
    return true
  })

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-danger">Error: {error.message}</p>
        <Button variant="secondary" size="sm" onPress={() => mutate()}>
          Retry
        </Button>
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
      <div className="flex justify-center py-8">
        <p className="text-muted text-sm">No bookmarks yet.</p>
      </div>
    )
  }

  return (
    <div className={`p-0 ${variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}`}>
      <div className="sticky top-0 left-0 right-0 z-10 px-2 py-2">
        <div className="flex items-center justify-between">
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
          {variant === 'default' && (
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              aria-label="Open in new tab"
              onPress={async () => {
                const url = browser.runtime.getURL(
                  '/home.html' as '/sidepanel.html',
                )
                await browser.tabs.create({ url })
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          {variant === 'expanded' && <Settings />}
        </div>
        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${
            currentTabBookmarkData
              ? 'mt-2 max-h-96 opacity-100 translate-y-0'
              : 'mt-0 max-h-0 opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          {displayedCurrentTabBookmark && (
            <Card
              variant={
                displayedCurrentTabBookmark.unread ? 'tertiary' : 'secondary'
              }
              className="border border-default-200 shadow-sm"
            >
              <Card.Header className="pb-1">
                <div className="flex items-center justify-between gap-2">
                  <Card.Description className="text-2xs uppercase tracking-wide">
                    Current page in Linkding
                  </Card.Description>
                  <div className="inline-flex items-center gap-1.5">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        displayedCurrentTabBookmark.unread
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-3xs text-muted uppercase tracking-wide">
                      {displayedCurrentTabBookmark.unread ? 'Unread' : 'Read'}
                    </span>
                  </div>
                </div>
                <Card.Title className="text-sm line-clamp-1">
                  {displayedCurrentTabBookmark.title ||
                    displayedCurrentTabBookmark.url}
                </Card.Title>
              </Card.Header>
              <Card.Content className="pt-0">
                <Link
                  href={displayedCurrentTabBookmark.url}
                  target="_blank"
                  className="text-2xs text-muted hover:text-primary transition-colors line-clamp-1"
                >
                  {displayedCurrentTabBookmark.url}
                </Link>
                {displayedCurrentTabBookmark.tag_names.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {displayedCurrentTabBookmark.tag_names.map(tag => (
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
              </Card.Content>
              <Card.Footer className="pt-2 flex items-center justify-between">
                <span className="text-2xs text-muted">
                  {formatDistanceToNow(
                    new Date(displayedCurrentTabBookmark.date_added),
                    {
                      addSuffix: true,
                    },
                  )}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={
                    !currentTabBookmarkData ||
                    isCurrentTabBookmarkLoading ||
                    isCurrentTabBookmarkValidating
                  }
                  onPress={() =>
                    toggleUnread(
                      displayedCurrentTabBookmark.id,
                      !displayedCurrentTabBookmark.unread,
                      setBookmarks,
                      mutateCurrentTabBookmark,
                    )
                  }
                >
                  {displayedCurrentTabBookmark.unread
                    ? 'Mark as read'
                    : 'Mark as unread'}
                </Button>
              </Card.Footer>
            </Card>
          )}
        </div>
      </div>
      {filteredBookmarks.length > 0 ? (
        <>
          {filteredBookmarks.map(bookmark => (
            <div
              key={bookmark.id}
              className={`flex items-start gap-1 py-2 px-2 hover:bg-default-100 transition-colors border-b border-default-200 last:border-b-0 ${unreadFilter === 'all' && !bookmark.unread ? 'opacity-50' : ''}`}
            >
              <button
                onClick={() =>
                  toggleUnread(
                    bookmark.id,
                    !bookmark.unread,
                    setBookmarks,
                    mutateCurrentTabBookmark,
                  )
                }
                className="group flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer p-2 -mt-0.5 -ml-1.5 -mr-0.5 rounded-full hover:bg-default-200 active:bg-default-300 transition-colors"
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
        <div className="flex justify-center py-8">
          <p className="text-muted text-sm">No {unreadFilter} bookmarks.</p>
        </div>
      )}
    </div>
  )
}
