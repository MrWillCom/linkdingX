import { db } from '@/utils/db'
import { bookmarkService } from '@/utils/bookmarkService'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Loader } from '@cloudflare/kumo'
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
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    resetSize,
    mutate: mutateBookmarks,
    error,
  } = useBookmarksManager(unreadFilter, debouncedSearchQuery)

  const resetSizeRef = useRef(resetSize)
  useEffect(() => {
    resetSizeRef.current = resetSize
  }, [resetSize])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(prev => {
        if (prev !== searchQuery) {
          resetSizeRef.current()
          return searchQuery
        }
        return prev
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleFilterChange = useCallback((filter: UnreadFilter) => {
    setUnreadFilter(filter)
    resetSizeRef.current()
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    resetSizeRef.current()
  }, [])

  const {
    bookmark: currentTabBookmark,
    serverBookmark: currentTabServerBookmark,
    serverMetadata: currentTabMetadata,
    realtimeMetadata,
    isLoading: isCurrentTabBookmarkLoading,
    currentTabUrl,
  } = useCurrentTabBookmark()

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const hasTriggeredLoadRef = useRef(false)

  useEffect(() => {
    if (!isLoadingMore) {
      hasTriggeredLoadRef.current = false
    }
  }, [isLoadingMore])

  const stateRef = useRef({ isLoadingMore, hasMore, loadMore })
  useEffect(() => {
    stateRef.current = { isLoadingMore, hasMore, loadMore }
  }, [isLoadingMore, hasMore, loadMore])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0)

    const { isLoadingMore, hasMore, loadMore } = stateRef.current
    if (hasMore && !isLoadingMore) {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 400) {
        hasTriggeredLoadRef.current = true
        loadMore()
      }
    }
  }, [])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return

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
      {
        rootMargin: '200px',
        threshold: 0,
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleToggleUnread = useCallback(async (id: number, currentUnread: boolean) => {
    await bookmarkService.toggleUnread(id, currentUnread)
  }, [])

  const handleAdd = useCallback(
    async (url: string, title: string, description: string) => {
      const [server, apiToken, fetchMetadataFrom, defaultUnread] = await Promise.all([
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
      })

      if (response.ok) {
        await bookmarkService.addBookmark(response.data as Bookmark)
        mutateBookmarks()
      }
    },
    [mutateBookmarks],
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
    <div onScroll={handleScroll} className="h-screen overflow-y-auto relative">
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
            hasTriggeredLoadRef={hasTriggeredLoadRef}
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
