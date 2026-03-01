import { formatDistanceToNow } from 'date-fns'
import { Card, Link, Chip, Button } from '@heroui/react'
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

interface CurrentTabCardProps {
  bookmark: Bookmark
  isLoading: boolean
  isValidating: boolean
  onToggleUnread: (id: number, currentUnread: boolean) => void
}

export function CurrentTabCard({
  bookmark,
  isLoading,
  isValidating,
  onToggleUnread,
}: CurrentTabCardProps) {
  return (
    <Card
      variant={bookmark.unread ? 'tertiary' : 'secondary'}
      className="border border-default-200 shadow-sm"
    >
      <Card.Header className="pb-1">
        <div className="flex items-center justify-between gap-2">
          <Card.Description className="text-2xs uppercase tracking-wide">
            Current page in Linkding
          </Card.Description>
          <div className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                bookmark.unread ? 'bg-blue-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-3xs text-muted uppercase tracking-wide">
              {bookmark.unread ? 'Unread' : 'Read'}
            </span>
          </div>
        </div>
        <Card.Title className="text-sm line-clamp-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <BookmarkFavicon url={bookmark.favicon_url} />
            <span className="line-clamp-1">
              {bookmark.title || bookmark.url}
            </span>
          </span>
        </Card.Title>
      </Card.Header>
      <Card.Content className="pt-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={bookmark.url}
              target="_blank"
              className="text-2xs text-muted hover:text-primary transition-colors line-clamp-1"
            >
              {bookmark.url}
            </Link>
            {bookmark.tag_names.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {bookmark.tag_names.map(tag => (
                  <Chip key={tag} size="sm" variant="soft" className="text-2xs">
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
          </div>
          <BookmarkPreview
            url={bookmark.preview_image_url}
            alt={bookmark.title || bookmark.url}
            className="h-14 w-20 flex-shrink-0"
          />
        </div>
      </Card.Content>
      <Card.Footer className="pt-2 flex items-center justify-between">
        <span className="text-2xs text-muted">
          {formatDistanceToNow(new Date(bookmark.date_added), {
            addSuffix: true,
          })}
        </span>
        <Button
          size="sm"
          variant={bookmark.unread ? 'primary' : 'ghost'}
          isDisabled={isLoading || isValidating}
          onPress={() => onToggleUnread(bookmark.id, bookmark.unread)}
        >
          {bookmark.unread ? 'Mark as read' : 'Mark as unread'}
        </Button>
      </Card.Footer>
    </Card>
  )
}
