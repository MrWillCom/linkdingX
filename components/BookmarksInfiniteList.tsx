import { Spinner, Button } from '@heroui/react'
import { BookmarkItem } from '@/components/BookmarkItem'
import { Bookmark } from './BookmarksList'
import { UnreadFilter } from '@/components/FilterTabs'

interface BookmarksInfiniteListProps {
  filteredBookmarks: Bookmark[]
  unreadFilter: UnreadFilter
  isLoadingMore: boolean
  hasMore: boolean
  hasTriggeredLoadRef: React.RefObject<boolean | null>
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  loadMore: () => void
  onToggleUnread: (id: number, current: boolean) => Promise<void>
}

export function BookmarksInfiniteList({
  filteredBookmarks,
  unreadFilter,
  isLoadingMore,
  hasMore,
  hasTriggeredLoadRef,
  loadMoreRef,
  loadMore,
  onToggleUnread,
}: BookmarksInfiniteListProps) {
  return (
    <div className="pt-2">
      {filteredBookmarks.length > 0 ? (
        <>
          {filteredBookmarks.map(bookmark => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isDimmed={unreadFilter === 'all' && !bookmark.unread}
              onToggleUnread={onToggleUnread}
            />
          ))}
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isLoadingMore && <Spinner />}
            {!isLoadingMore &&
              hasMore &&
              !hasTriggeredLoadRef.current?.valueOf() && (
                <Button size="sm" variant="ghost" onPress={() => loadMore()}>
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
