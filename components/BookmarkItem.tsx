import { formatDistanceToNow } from 'date-fns'
import { Link, Chip } from '@heroui/react'
import { BookmarkFavicon } from './BookmarkFavicon'
import { BookmarkPreview } from './BookmarkPreview'

interface Bookmark {
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
      className={`flex items-start gap-1 py-2 px-2 hover:bg-default-100 transition-colors border-b border-default-200 last:border-b-0 ${isDimmed ? 'opacity-50' : ''}`}
    >
      <button
        onClick={() => onToggleUnread(bookmark.id, bookmark.unread)}
        className="group flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer p-2 -mt-0.5 -ml-1.5 -mr-0.5 rounded-full hover:bg-default-200 active:bg-default-300 transition-colors"
        aria-label={bookmark.unread ? 'Mark as read' : 'Mark as unread'}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            bookmark.unread
              ? 'bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700'
              : 'bg-gray-300 group-hover:bg-gray-400 group-active:bg-gray-500'
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <Link
          href={bookmark.url}
          target="_blank"
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <BookmarkFavicon url={bookmark.favicon_url} />
          <span className="line-clamp-1">{bookmark.title || bookmark.url}</span>
        </Link>
        {bookmark.description && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">
            {bookmark.description}
          </p>
        )}
        <div className="flex flex-col gap-1.5 mt-1.5">
          {bookmark.tag_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tag_names.map(tag => (
                <Chip key={tag} size="sm" variant="soft" className="text-2xs">
                  {tag}
                </Chip>
              ))}
            </div>
          )}
          <span className="text-2xs text-muted">
            {formatDistanceToNow(new Date(bookmark.date_added), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
      <BookmarkPreview
        url={bookmark.preview_image_url}
        alt={bookmark.title || bookmark.url}
        className="h-12 w-16 flex-shrink-0 mt-0.5"
      />
    </div>
  )
}
