import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { bookmarkService } from '@/utils/bookmarkService'
import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { Button, Spinner } from '@heroui/react'
import { ExternalLink, Settings as SettingsIcon } from 'lucide-react'
import { storage } from '#imports'
import { useSetup } from '@/hooks/useSetup'
import { UnreadFilter } from '@/components/FilterTabs'

export interface Bookmark {
  id: number
  url: string
  title: string
  description: string
  notes: string
  web_archive_snapshot_url: string
  favicon_url: string | null
  preview_image_url: string | null
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

interface BookmarkCheckResponse {
  bookmark: Bookmark | null
  metadata: {
    title: string
    description: string
    [key: string]: any
  }
}

async function fetchCurrentTabBookmark([
  _type,
  url,
]: CurrentTabBookmarkKey): Promise<BookmarkCheckResponse | null> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) return null

  const fullUrl = `${server}/api/bookmarks/check/?url=${encodeURIComponent(url)}`
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

  return response.data as BookmarkCheckResponse
}

type BookmarksListVariant = 'default' | 'expanded'

interface BookmarksListProps {
  variant?: BookmarksListVariant
}

export default function BookmarksList({
  variant = 'default',
}: BookmarksListProps) {
  const { fetchMetadataFromStorage, defaultUnreadStorage } = useSetup()
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>('all')
  const [currentTabUrl, setCurrentTabUrl] = useState<string | null>(null)
  const [realtimeMetadata, setRealtimeMetadata] = useState<{
    title: string
    favicon: string | null
  }>({ title: '', favicon: null })
  const [displayedCurrentTabBookmark, setDisplayedCurrentTabBookmark] =
    useState<Bookmark | null>(null)
  const [isPollingMetadata, setIsPollingMetadata] = useState(false)

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
      revalidateFirstPage: true,
      revalidateOnFocus: true,
      onSuccess: data => {
        const allResults = data.flatMap(page => page.results)
        if (allResults.length > 0) {
          db.bookmarks.bulkPut(allResults)
        }
      },
    })

  const bookmarks =
    useLiveQuery(() =>
      db.bookmarks.orderBy('date_added').reverse().toArray(),
    ) || []

  const currentTabKey: CurrentTabBookmarkKey | null = currentTabUrl
    ? ['current-tab-bookmark', normalizeUrlForMatch(currentTabUrl)]
    : null
  const {
    data: currentTabCheckData,
    isLoading: isCurrentTabBookmarkLoading,
    isValidating: isCurrentTabBookmarkValidating,
    mutate: mutateCurrentTabBookmark,
  } = useSWR<BookmarkCheckResponse | null, Error, CurrentTabBookmarkKey | null>(
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
  const [isScrolled, setIsScrolled] = useState(false)
  const hasTriggeredLoadRef = useRef(false)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0)
  }

  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore && !isValidating) {
          const hasMore = !data || data[data.length - 1]?.next !== null
          if (hasMore) {
            hasTriggeredLoadRef.current = true
            setSize(prev => prev + 1)
          }
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [isLoadingMore, isValidating, data, setSize])

  const hasMore = !data || data[data.length - 1]?.next !== null

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
          setRealtimeMetadata({
            title: tabs[0]?.title || '',
            favicon: tabs[0]?.favIconUrl || null,
          })
          return
        }
      } catch {
        // Ignore tab lookup errors and hide the card.
      }
      setCurrentTabUrl(null)
      setRealtimeMetadata({ title: '', favicon: null })
    }

    const onActivated = () => {
      syncCurrentTab()
    }
    const onUpdated = (
      _tabId: number,
      changeInfo: { url?: string; title?: string; favIconUrl?: string },
      tab: { active?: boolean; title?: string; favIconUrl?: string },
    ) => {
      if (!tab.active) return

      if (changeInfo.title || changeInfo.favIconUrl) {
        setRealtimeMetadata(prev => ({
          title: changeInfo.title ?? tab.title ?? prev.title,
          favicon: changeInfo.favIconUrl ?? tab.favIconUrl ?? prev.favicon,
        }))
      }

      if (changeInfo.url) {
        if (
          changeInfo.url.startsWith('http://') ||
          changeInfo.url.startsWith('https://')
        ) {
          setCurrentTabUrl(changeInfo.url)
          setRealtimeMetadata({
            title: tab.title || '',
            favicon: tab.favIconUrl || null,
          })
        } else {
          setCurrentTabUrl(null)
          setRealtimeMetadata({ title: '', favicon: null })
        }
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
    if (!currentTabCheckData?.bookmark) return
    const updatedBookmark = bookmarks.find(
      b => b.id === currentTabCheckData.bookmark?.id,
    )
    if (
      updatedBookmark &&
      updatedBookmark.unread !== currentTabCheckData.bookmark.unread
    ) {
      mutateCurrentTabBookmark(
        { ...currentTabCheckData, bookmark: updatedBookmark },
        {
          revalidate: false,
        },
      )
    }
  }, [bookmarks, currentTabCheckData, mutateCurrentTabBookmark])

  useEffect(() => {
    if (currentTabCheckData) {
      setDisplayedCurrentTabBookmark(currentTabCheckData.bookmark)
      return
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayedCurrentTabBookmark(null)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [currentTabCheckData])

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(bookmark => {
      if (unreadFilter === 'unread') return bookmark.unread
      if (unreadFilter === 'read') return !bookmark.unread
      return true
    })
  }, [bookmarks, unreadFilter])

  const handleToggleUnread = async (id: number, currentUnread: boolean) => {
    await bookmarkService.toggleUnread(id, currentUnread)
  }

  const handleAdd = async (url: string, title: string, description: string) => {
    const server = await serverStorage.getValue()
    const apiToken = await apiTokenStorage.getValue()
    const fetchMetadataFrom = await fetchMetadataFromStorage.getValue()
    const defaultUnread = await defaultUnreadStorage.getValue()

    if (!server || !apiToken) return

    const payload = {
      url,
      title: fetchMetadataFrom === 'server' ? '' : title,
      description: fetchMetadataFrom === 'server' ? '' : description,
      unread: defaultUnread,
    }

    const response = await browser.runtime.sendMessage({
      type: 'api-post',
      url: `${server}/api/bookmarks/`,
      data: payload,
      options: {
        headers: {
          Authorization: `Token ${apiToken}`,
        },
      },
    })

    if (response.ok) {
      await bookmarkService.addBookmark(response.data as Bookmark)
      mutate()
      mutateCurrentTabBookmark()

      // Start polling for server-side metadata updates
      let attempts = 0
      const maxAttempts = 5
      const pollInterval = setInterval(async () => {
        attempts++
        setIsPollingMetadata(true)
        try {
          const result = await mutateCurrentTabBookmark()
          const bookmark = result?.bookmark

          if (bookmark) {
            await db.bookmarks.put(bookmark)
          }

          const hasArchive = !!bookmark?.web_archive_snapshot_url
          const hasPreview = !!bookmark?.preview_image_url
          const hasFavicon = !!bookmark?.favicon_url

          if (
            (hasArchive && hasPreview && hasFavicon) ||
            attempts >= maxAttempts
          ) {
            clearInterval(pollInterval)
          }
        } finally {
          setIsPollingMetadata(false)
        }
      }, 2000)
    }
  }

  const handleDelete = async (id: number) => {
    await bookmarkService.deleteBookmark(id)
    mutateCurrentTabBookmark(null, { revalidate: false })
  }

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
    <div
      onScroll={handleScroll}
      className={`h-screen overflow-y-auto relative ${variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}`}
    >
      <div className="sticky top-0 z-30 bg-background px-2 py-2">
        <div className="flex items-center justify-between h-9">
          <FilterTabs
            selectedKey={unreadFilter}
            onSelectionChange={setUnreadFilter}
          />
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
          {variant === 'expanded' && (
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              aria-label="Open settings"
              onPress={() => browser.runtime.openOptionsPage()}
            >
              <SettingsIcon size={18} />
            </Button>
          )}
        </div>
        <div
          className="grid grid-rows-[0fr] animate-none data-[open=true]:grid-rows-[1fr] origin-top"
          style={{
            overflow: 'hidden',
          }}
          data-open={!!currentTabCheckData}
        >
          <div className="overflow-hidden min-h-0">
            {currentTabCheckData && (
              <div className="mt-2">
                <CurrentTabCard
                  url={currentTabUrl || ''}
                  bookmark={currentTabCheckData.bookmark}
                  metadata={currentTabCheckData.metadata}
                  realtimeMetadata={realtimeMetadata}
                  isLoading={isCurrentTabBookmarkLoading}
                  isValidating={
                    isCurrentTabBookmarkValidating && !isPollingMetadata
                  }
                  onToggleUnread={handleToggleUnread}
                  onAdd={handleAdd}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
        </div>
        {/* Dynamic Gradient Mask - Attached to the bottom of the sticky area */}
        <div
          className={`absolute top-full left-0 right-0 h-8 bg-linear-to-b from-background to-transparent pointer-events-none z-10 transition-opacity duration-200 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      <div className="pt-2">
        {filteredBookmarks.length > 0 ? (
          <>
            {filteredBookmarks.map(bookmark => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                isDimmed={unreadFilter === 'all' && !bookmark.unread}
                onToggleUnread={handleToggleUnread}
              />
            ))}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isLoadingMore && <Spinner />}
              {!isLoadingMore && hasMore && !hasTriggeredLoadRef.current && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setSize(prev => prev + 1)}
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
    </div>
  )
}
