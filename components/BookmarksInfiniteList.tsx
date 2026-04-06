import { memo } from 'react'
import { Loader, Button } from '@cloudflare/kumo'
import { BookmarkItem } from '@/components/BookmarkItem'
import type { Bookmark } from '@/utils/types'
import type { UnreadFilter } from '@/components/FilterTabs'

interface BookmarksInfiniteListProps {
  filteredBookmarks: Bookmark[]
  unreadFilter: UnreadFilter
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
    <div className="flex flex-col divide-y divide-kumo-line border-b border-kumo-line">
      {filteredBookmarks.length > 0 ? (
        <>
          {filteredBookmarks.map(bookmark => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isDimmed={unreadFilter === 'all' && !bookmark.unread}
              onToggleUnread={onToggleUnread}
              onDelete={onDelete}
              onToggleArchive={onToggleArchive}
              onOpenInLinkding={onOpenInLinkding}
            />
          ))}
          <div ref={loadMoreRef} className="py-4 flex flex-col items-center gap-4">
            {isLoadingMore && <Loader size="sm" />}
            {!isLoadingMore && hasMore && !hasTriggeredLoadRef.current && (
              <Button variant="ghost" onClick={() => loadMore()}>
                Load More
              </Button>
            )}
            {!isLoadingMore && !hasMore && filteredBookmarks.length > 0 && (
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
})
