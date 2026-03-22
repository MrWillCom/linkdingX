import { db } from '@/utils/db'
import { bookmarkService } from '@/utils/bookmarkService'
import { useEffect, useRef, useState } from 'react'
import { Button, Loader } from '@cloudflare/kumo'
import { storage } from '#imports'
import { useSetup } from '@/hooks/useSetup'
import { UnreadFilter } from '@/components/FilterTabs'
import { useBookmarksManager } from '@/hooks/useBookmarksManager'
import { useCurrentTabBookmark } from '@/hooks/useCurrentTabBookmark'
import { BookmarksHeader } from './BookmarksHeader'
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

type BookmarksListVariant = 'default' | 'expanded'

interface BookmarksListProps {
  variant?: BookmarksListVariant
}

export default function BookmarksList({
  variant = 'default',
}: BookmarksListProps) {
  const { fetchMetadataFromStorage, defaultUnreadStorage } = useSetup()
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

  useEffect(() => {
    const interval = setInterval(() => {
      mutateBookmarks()
    }, 60000)

    return () => clearInterval(interval)
  }, [mutateBookmarks])

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const hasTriggeredLoadRef = useRef(false)

  // Reset triggered flag when loading more finishes
  useEffect(() => {
    if (!isLoadingMore) {
      hasTriggeredLoadRef.current = false
    }
  }, [isLoadingMore])

  // Use refs to provide stable access to changing state/functions in the observer
  const stateRef = useRef({ isLoadingMore, hasMore, loadMore })
  useEffect(() => {
    stateRef.current = { isLoadingMore, hasMore, loadMore }
  }, [isLoadingMore, hasMore, loadMore])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 0)

    // Fallback: Check if we're near the bottom manually during scroll
    const { isLoadingMore, hasMore, loadMore } = stateRef.current
    if (hasMore && !isLoadingMore) {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 400) {
        hasTriggeredLoadRef.current = true
        loadMore()
      }
    }
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
      {
        rootMargin: '200px',
        threshold: 0,
      },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [])

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
    }
  }

  const handleDelete = async (id: number) => {
    await bookmarkService.deleteBookmark(id)
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-danger">Error: {error.message}</p>
        <Button variant="secondary" size="sm" onClick={() => mutateBookmarks()}>
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
