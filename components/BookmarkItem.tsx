import { Link } from '@cloudflare/kumo'
import { BookmarkContent } from './BookmarkContent'
import type { Bookmark } from '@/utils/types'
import styles from './BookmarkItem.module.css'

interface BookmarkItemProps {
  bookmark: Bookmark
  isDimmed: boolean
  onToggleUnread: (id: number, currentUnread: boolean) => Promise<void>
}

export function BookmarkItem({ bookmark, isDimmed, onToggleUnread }: BookmarkItemProps) {
  return (
    <div
      data-dimmed={isDimmed}
      className={`group relative flex items-start gap-1 py-2 px-2 hover:bg-kumo-elevated transition-colors ${styles.bookmarkItem}`}
    >
      <button
        onClick={e => {
          e.stopPropagation()
          onToggleUnread(bookmark.id, bookmark.unread)
        }}
        className={`relative z-10 group/button shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring cursor-pointer p-2 -mt-0.5 -ml-1.5 -mr-0.5 rounded-full hover:bg-kumo-recessed active:bg-kumo-tint transition-colors ${styles.dimAsset}`}
        aria-label={bookmark.unread ? 'Mark as read' : 'Mark as unread'}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            bookmark.unread ? 'bg-kumo-brand' : 'bg-kumo-line'
          }`}
        />
      </button>
      <Link
        href={bookmark.url}
        target="_blank"
        variant="plain"
        className="absolute inset-0 z-[5]"
        tabIndex={-1}
        aria-hidden="true"
      />
      <BookmarkContent
        bookmark={bookmark}
        titleClassName={styles.dimText}
        descriptionClassName={`line-clamp-2 ${styles.dimText}`}
        dateClassName={styles.dimAsset}
        tagClassName={styles.dimAsset}
        previewClassName={styles.dimAsset}
      />
    </div>
  )
}
