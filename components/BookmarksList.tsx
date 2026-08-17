import { bookmarkService } from '@/utils/bookmarkService'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, useKumoToastManager } from '@cloudflare/kumo'
import {
  serverStorage,
  apiTokenStorage,
  fetchMetadataFromStorage,
  defaultUnreadStorage,
} from '@/utils/storage'
import type { UnreadFilter } from '@/components/FilterTabs'
import { useBookmarksManager } from '@/hooks/useBookmarksManager'
import { useCurrentTabBookmark } from '@/hooks/useCurrentTabBookmark'
import { BookmarksHeader } from './BookmarksHeader'
import { BookmarksInfiniteList } from './BookmarksInfiniteList'
import type { Bookmark } from '@/utils/types'

type BookmarksListVariant = 'default' | 'expanded'

interface BookmarksListProps {
  variant?: BookmarksListVariant
}

export default function BookmarksList({ variant = 'default' }: BookmarksListProps) {
  const [unreadFilter, setUnreadFilter] = useState<UnreadFilter>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')

  const {
    filteredBookmarks,
    isLoadingMore,
    hasMore,
    loadMore,
    resetSize,
    mutate: mutateBookmarks,
    error,
  } = useBookmarksManager(unreadFilter, debouncedSearchQuery)

  const toastManager = useKumoToastManager()
  const resetSizeRef = useRef(resetSize)
  const [showLoadMoreFallback, setShowLoadMoreFallback] = useState(true)

  useEffect(() => {
    resetSizeRef.current = resetSize
  }, [resetSize])

  const resetPagination = useCallback(() => {
    resetSizeRef.current()
    setShowLoadMoreFallback(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(prev => {
        if (prev !== searchQuery) {
          resetPagination()
          return searchQuery
        }
        return prev
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, resetPagination])

  const handleFilterChange = useCallback(
    (filter: UnreadFilter) => {
      setUnreadFilter(filter)
      resetPagination()
    },
    [resetPagination],
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    resetPagination()
  }, [resetPagination])

  const {
    bookmark: currentTabBookmark,
    serverBookmark: currentTabServerBookmark,
    serverMetadata: currentTabMetadata,
    realtimeMetadata,
    isLoading: isCurrentTabBookmarkLoading,
    currentTabUrl,
  } = useCurrentTabBookmark()

  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  const stateRef = useRef({ isLoadingMore, hasMore, loadMore, setShowLoadMoreFallback })
  useEffect(() => {
    stateRef.current = { isLoadingMore, hasMore, loadMore, setShowLoadMoreFallback }
  }, [isLoadingMore, hasMore, loadMore])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    setIsScrolled(el.scrollTop > 0)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (node) {
      const observer = new IntersectionObserver(
        entries => {
          const { isLoadingMore, hasMore, loadMore, setShowLoadMoreFallback } = stateRef.current
          const entry = entries[0]
          if (entry?.isIntersecting && !isLoadingMore && hasMore) {
            setShowLoadMoreFallback(false)
            loadMore()
          }
        },
        {
          rootMargin: '200px',
          threshold: 0,
        },
      )
      observer.observe(node)
      observerRef.current = observer
    }
  }, [])

  const handleToggleUnread = useCallback(async (id: number, currentUnread: boolean) => {
    await bookmarkService.toggleUnread(id, currentUnread)
  }, [])

  const handleAdd = useCallback(
    async (url: string, title: string, description: string) => {
      try {
        const [server, apiToken, fetchMetadataFrom, defaultUnread] = await Promise.all([
          serverStorage.getValue(),
          apiTokenStorage.getValue(),
          fetchMetadataFromStorage.getValue(),
          defaultUnreadStorage.getValue(),
        ])

        if (!server || !apiToken) {
          toastManager.add({
            title: 'Cannot add bookmark',
            description: 'Server or API token is not configured.',
            variant: 'error',
          })
          return
        }

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
        })

        if (!response.ok) {
          const detail =
            (response.data as Record<string, string> | undefined)?.detail ||
            response.error ||
            'Unknown error'
          toastManager.add({
            title: 'Failed to add bookmark',
            description: detail,
            variant: 'error',
          })
          return
        }

        await bookmarkService.addBookmark(response.data as Bookmark)
        mutateBookmarks()
      } catch (error) {
        toastManager.add({
          title: 'Failed to add bookmark',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'error',
        })
      }
    },
    [mutateBookmarks, toastManager],
  )

  const handleDelete = useCallback(async (id: number) => {
    await bookmarkService.deleteBookmark(id)
  }, [])

  const handleToggleArchive = useCallback(async (id: number, currentArchived: boolean) => {
    await bookmarkService.toggleArchive(id, currentArchived)
  }, [])

  const handleOpenInLinkding = useCallback(async (bookmark: Bookmark) => {
    const response = await browser.runtime.sendMessage({
      type: 'get-server-url',
    })
    if (!response.ok || !response.server) return
    await browser.tabs.create({
      url: `${response.server}/bookmarks?details=${bookmark.id}`,
    })
  }, [])

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto relative">
      <div className={variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}>
        <BookmarksHeader
          unreadFilter={unreadFilter}
          onUnreadFilterChange={handleFilterChange}
          variant={variant}
          currentTabUrl={currentTabUrl}
          currentTabBookmark={currentTabBookmark}
          currentTabServerBookmark={currentTabServerBookmark}
          currentTabMetadata={currentTabMetadata}
          realtimeMetadata={realtimeMetadata}
          isCurrentTabBookmarkLoading={isCurrentTabBookmarkLoading}
          onToggleUnread={handleToggleUnread}
          onAdd={handleAdd}
          onDelete={handleDelete}
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={handleClearSearch}
          isSearching={!!debouncedSearchQuery && isLoadingMore}
        />

        {error ? (
          <div className="p-4 flex flex-col items-center gap-4">
            <p className="text-kumo-danger">Failed to load bookmarks: {error.message}</p>
            <Button variant="secondary" onClick={() => mutateBookmarks()}>
              Retry
            </Button>
          </div>
        ) : (
          <BookmarksInfiniteList
            filteredBookmarks={filteredBookmarks}
            unreadFilter={unreadFilter}
            searchQuery={debouncedSearchQuery}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            showLoadMoreFallback={showLoadMoreFallback}
            loadMoreRef={loadMoreRef}
            loadMore={loadMore}
            onToggleUnread={handleToggleUnread}
            onDelete={handleDelete}
            onToggleArchive={handleToggleArchive}
            onOpenInLinkding={handleOpenInLinkding}
          />
        )}
      </div>
    </div>
  )
}
