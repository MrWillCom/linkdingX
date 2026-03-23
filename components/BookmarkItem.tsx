import { formatDistanceToNow } from 'date-fns'
import { Link, Badge } from '@cloudflare/kumo'
import { BookmarkFavicon } from './BookmarkFavicon'
import { BookmarkPreview } from './BookmarkPreview'

import { Bookmark } from './BookmarksList'

interface BookmarkItemProps {
  bookmark: Bookmark
  isDimmed: boolean
  onToggleUnread: (id: number, currentUnread: boolean) => void
}

export function BookmarkItem({
  bookmark,
  isDimmed,
  onToggleUnread,
}: BookmarkItemProps) {
  return (
    <div
      className={`flex items-start gap-1 py-2 px-2 hover:bg-kumo-elevated transition-colors ${isDimmed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onToggleUnread(bookmark.id, bookmark.unread)}
        className="group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring cursor-pointer p-2 -mt-0.5 -ml-1.5 -mr-0.5 rounded-full hover:bg-kumo-recessed active:bg-kumo-tint transition-colors"
        aria-label={bookmark.unread ? 'Mark as read' : 'Mark as unread'}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            bookmark.unread ? 'bg-kumo-brand' : 'bg-kumo-line'
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <Link
          href={bookmark.url}
          target="_blank"
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-kumo-default hover:text-kumo-brand transition-colors"
        >
          <BookmarkFavicon url={bookmark.favicon_url} />
          <span className="line-clamp-1">{bookmark.title || bookmark.url}</span>
        </Link>
        {bookmark.description && (
          <p className="text-xs text-kumo-strong mt-0.5 line-clamp-2">
            {bookmark.description}
          </p>
        )}
        <div className="flex flex-col gap-1.5 mt-1.5">
          {bookmark.tag_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tag_names.map(tag => (
                <Badge key={tag} variant="secondary" className="text-2xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <span className="text-2xs text-kumo-strong">
            {formatDistanceToNow(new Date(bookmark.date_added), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
      <BookmarkPreview
        url={bookmark.preview_image_url}
        alt={bookmark.title || bookmark.url}
        className="h-12 w-16 shrink-0 mt-0.5"
      />
    </div>
  )
}
