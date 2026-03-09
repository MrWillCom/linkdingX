import { db } from '@/utils/db'
import { bookmarkService } from '@/utils/bookmarkService'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { Button, Spinner } from '@heroui/react'
import { storage } from '#imports'
import { useSetup } from '@/hooks/useSetup'
import { UnreadFilter } from '@/components/FilterTabs'
import { useCurrentTabTracker } from '@/hooks/useCurrentTabTracker'
import { useBookmarksManager } from '@/hooks/useBookmarksManager'
import { BookmarksHeader, BookmarkCheckResponse } from './BookmarksHeader'
import { BookmarksInfiniteList } from './BookmarksInfiniteList'

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

const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

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

type CurrentTabBookmarkKey = readonly ['current-tab-bookmark', string]

async function fetchCurrentTabBookmark([
  _type,
  url,
]: CurrentTabBookmarkKey): Promise<BookmarkCheckResponse | null> {
  const [server, apiToken] = await Promise.all([
    serverStorage.getValue(),
    apiTokenStorage.getValue(),
  ])

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
  const { currentTabUrl, realtimeMetadata } = useCurrentTabTracker()
  const {
    filteredBookmarks,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    mutate: mutateBookmarks,
    error,
  } = useBookmarksManager(unreadFilter)

  const [isPollingMetadata, setIsPollingMetadata] = useState(false)

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
      mutateBookmarks()
    }, 60000)

    return () => clearInterval(interval)
  }, [mutateBookmarks])

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const hasTriggeredLoadRef = useRef(false)

  // Use refs to provide stable access to changing state/functions in the observer
  const stateRef = useRef({ isLoadingMore, hasMore, loadMore })
  useEffect(() => {
    stateRef.current = { isLoadingMore, hasMore, loadMore }
  }, [isLoadingMore, hasMore, loadMore])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0)
  }

  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      entries => {
        const { isLoadingMore, hasMore, loadMore } = stateRef.current
        if (entries[0].isIntersecting && !isLoadingMore) {
          if (hasMore) {
            hasTriggeredLoadRef.current = true
            loadMore()
          }
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!currentTabCheckData?.bookmark) return
    const updatedBookmark = filteredBookmarks.find(
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
  }, [filteredBookmarks, currentTabCheckData, mutateCurrentTabBookmark])

  const handleToggleUnread = async (id: number, currentUnread: boolean) => {
    await bookmarkService.toggleUnread(id, currentUnread)
  }

  const handleAdd = async (url: string, title: string, description: string) => {
    const [server, apiToken, fetchMetadataFrom, defaultUnread] =
      await Promise.all([
        serverStorage.getValue(),
        apiTokenStorage.getValue(),
        fetchMetadataFromStorage.getValue(),
        defaultUnreadStorage.getValue(),
      ])

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
      mutateBookmarks()
      mutateCurrentTabBookmark()

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
    mutateCurrentTabBookmark(
      prev => (prev ? { ...prev, bookmark: null } : null),
      { revalidate: false },
    )
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-danger">Error: {error.message}</p>
        <Button variant="secondary" size="sm" onPress={() => mutateBookmarks()}>
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

  return (
    <div
      onScroll={handleScroll}
      className={`h-screen overflow-y-auto relative ${variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}`}
    >
      <BookmarksHeader
        unreadFilter={unreadFilter}
        onUnreadFilterChange={setUnreadFilter}
        variant={variant}
        currentTabUrl={currentTabUrl}
        currentTabCheckData={currentTabCheckData ?? null}
        realtimeMetadata={realtimeMetadata}
        isCurrentTabBookmarkLoading={isCurrentTabBookmarkLoading ?? false}
        isCurrentTabBookmarkValidating={isCurrentTabBookmarkValidating ?? false}
        isPollingMetadata={isPollingMetadata ?? false}
        onToggleUnread={handleToggleUnread}
        onAdd={handleAdd}
        onDelete={handleDelete}
        isScrolled={isScrolled}
      />

      <BookmarksInfiniteList
        filteredBookmarks={filteredBookmarks}
        unreadFilter={unreadFilter}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        hasTriggeredLoadRef={hasTriggeredLoadRef}
        loadMoreRef={loadMoreRef}
        loadMore={loadMore}
        onToggleUnread={handleToggleUnread}
      />
    </div>
  )
}
