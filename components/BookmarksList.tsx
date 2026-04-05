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
  const {
    filteredBookmarks,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    mutate: mutateBookmarks,
    error,
  } = useBookmarksManager(unreadFilter)

  const {
    bookmark: currentTabBookmark,
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

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-danger">Error: {error.message}</p>
        <Button variant="secondary" onClick={() => mutateBookmarks()}>
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader />
      </div>
    )
  }

  return (
    <div onScroll={handleScroll} className="h-screen overflow-y-auto relative">
      <div className={variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}>
        <BookmarksHeader
          unreadFilter={unreadFilter}
          onUnreadFilterChange={setUnreadFilter}
          variant={variant}
          currentTabUrl={currentTabUrl}
          currentTabBookmark={currentTabBookmark}
          currentTabMetadata={currentTabMetadata}
          realtimeMetadata={realtimeMetadata}
          isCurrentTabBookmarkLoading={isCurrentTabBookmarkLoading}
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
    </div>
  )
}
