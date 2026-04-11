import { memo } from 'react'
import { Loader, Button } from '@cloudflare/kumo'
import { BookmarkItem } from '@/components/BookmarkItem'
import type { Bookmark } from '@/utils/types'
import type { UnreadFilter } from '@/components/FilterTabs'

interface BookmarksInfiniteListProps {
  filteredBookmarks: Bookmark[]
  unreadFilter: UnreadFilter
  searchQuery?: string
  isLoadingMore: boolean | undefined
  hasMore: boolean
  hasTriggeredLoadRef: React.RefObject<boolean | null>
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  loadMore: () => void
  onToggleUnread: (id: number, current: boolean) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onToggleArchive: (id: number, currentArchived: boolean) => Promise<void>
  onOpenInLinkding: (bookmark: Bookmark) => void
}

export const BookmarksInfiniteList = memo(function BookmarksInfiniteList({
  filteredBookmarks,
  unreadFilter,
  searchQuery,
  isLoadingMore,
  hasMore,
  hasTriggeredLoadRef,
  loadMoreRef,
  loadMore,
  onToggleUnread,
  onDelete,
  onToggleArchive,
  onOpenInLinkding,
}: BookmarksInfiniteListProps) {
  return (
    <div className="flex flex-col">
      <div
        className={`flex flex-col divide-y divide-kumo-line ${
          filteredBookmarks.length > 0 ? 'border-b border-kumo-line' : ''
        }`}
      >
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map(bookmark => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isDimmed={unreadFilter === 'all' && !bookmark.unread}
              onToggleUnread={onToggleUnread}
              onDelete={onDelete}
              onToggleArchive={onToggleArchive}
              onOpenInLinkding={onOpenInLinkding}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-kumo-subtle gap-4 border-b-0">
            {isLoadingMore ? (
              <div className="flex flex-col items-center gap-2">
                <Loader size="sm" />
                <p className="text-sm text-center text-balance">
                  {searchQuery ? `Searching for "${searchQuery}"...` : 'Loading bookmarks...'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-center text-balance">
                {searchQuery
                  ? `No bookmarks match "${searchQuery}".`
                  : unreadFilter === 'all'
                    ? 'No bookmarks found.'
                    : `No ${unreadFilter} bookmarks.`}
              </p>
            )}
          </div>
        )}
      </div>
      {filteredBookmarks.length > 0 && (
        <div ref={loadMoreRef} className="py-4 flex flex-col items-center gap-4">
          {isLoadingMore && <Loader size="sm" />}
          {!isLoadingMore && hasMore && !hasTriggeredLoadRef.current && (
            <Button variant="ghost" onClick={() => loadMore()}>
              Load More
            </Button>
          )}
          {!isLoadingMore && !hasMore && (
            <p className="text-kumo-subtle text-sm">No more bookmarks</p>
          )}
        </div>
      )}
    </div>
  )
})
