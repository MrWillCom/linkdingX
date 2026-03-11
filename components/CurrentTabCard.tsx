import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, Link, Chip, Button, Tooltip } from '@heroui/react'
import { Trash2, PlusIcon } from 'lucide-react'
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
  url: string
  bookmark: Bookmark | null | undefined
  metadata?: {
    title: string
    description: string
    [key: string]: any
  }
  realtimeMetadata?: {
    title: string
    favicon: string | null
  }
  isLoading: boolean
  onToggleUnread: (id: number, currentUnread: boolean) => void
  onAdd?: (url: string, title: string, description: string) => void
  onDelete?: (id: number) => void
}

export function CurrentTabCard({
  url: currentTabUrl,
  bookmark,
  metadata,
  realtimeMetadata,
  isLoading,
  onToggleUnread,
  onAdd,
  onDelete,
}: CurrentTabCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isBookmarked = !!bookmark
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleDeletePress = () => {
    if (isConfirmingDelete) {
      if (timerRef.current) clearTimeout(timerRef.current)
      onDelete?.(bookmark!.id)
      setIsConfirmingDelete(false)
    } else {
      setIsConfirmingDelete(true)
      timerRef.current = setTimeout(() => {
        setIsConfirmingDelete(false)
      }, 5000)
    }
  }

  const title =
    bookmark?.title ||
    realtimeMetadata?.title ||
    metadata?.title ||
    currentTabUrl ||
    ''
  const url = bookmark?.url || currentTabUrl || ''
  const description = bookmark?.description || metadata?.description || ''
  const favicon = bookmark?.favicon_url || realtimeMetadata?.favicon || null

  return (
    <Card
      variant={
        !isBookmarked ? 'secondary' : bookmark.unread ? 'tertiary' : 'secondary'
      }
    >
      <div className="min-h-0">
        {!isBookmarked ? (
          <div key="add">
            <Card.Header className="pb-1">
              <Card.Description className="text-2xs uppercase tracking-wide">
                Not in Linkding
              </Card.Description>
              <Card.Title className="text-sm line-clamp-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <BookmarkFavicon url={favicon} />
                  <span className="line-clamp-1">{title}</span>
                </span>
              </Card.Title>
            </Card.Header>
            <Card.Footer className="pt-1 flex items-center justify-between">
              <Link
                href={url}
                target="_blank"
                className="text-2xs text-muted hover:text-primary transition-colors line-clamp-1 flex-1 mr-2"
              >
                {url}
              </Link>
              <Button
                size="sm"
                variant="primary"
                isDisabled={isLoading}
                onPress={() => onAdd?.(url, title, description)}
              >
                <PlusIcon className="size-4" />
              </Button>
            </Card.Footer>
          </div>
        ) : (
          <div key="manage">
            <Card.Header className="pb-1">
              <div className="flex items-center justify-between gap-2">
                <Card.Description className="text-2xs uppercase tracking-wide">
                  Current page in Linkding
                </Card.Description>
                <Chip
                  size="sm"
                  variant={bookmark.unread ? 'primary' : 'soft'}
                  color={bookmark.unread ? 'accent' : 'default'}
                  className="h-5 px-1.5"
                >
                  <Chip.Label className="text-3xs uppercase tracking-wide font-medium">
                    {bookmark.unread ? 'Unread' : 'Read'}
                  </Chip.Label>
                </Chip>
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
                        <Chip
                          key={tag}
                          size="sm"
                          variant="soft"
                          className="text-2xs"
                        >
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
              <div className="flex items-center gap-2">
                <Tooltip
                  delay={0}
                  closeDelay={0}
                  isDisabled={!isConfirmingDelete}
                >
                  <Tooltip.Trigger>
                    <Button
                      size="sm"
                      variant={isConfirmingDelete ? 'danger' : 'ghost'}
                      isIconOnly
                      className={
                        !isConfirmingDelete
                          ? 'text-danger hover:bg-danger-50'
                          : 'bg-danger text-white'
                      }
                      aria-label={
                        isConfirmingDelete
                          ? 'Confirm delete bookmark'
                          : 'Delete bookmark'
                      }
                      isDisabled={isLoading}
                      onPress={handleDeletePress}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content placement="bottom" showArrow>
                    Click again to confirm delete
                  </Tooltip.Content>
                </Tooltip>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-36"
                  isDisabled={isLoading}
                  onPress={() => onToggleUnread(bookmark.id, bookmark.unread)}
                >
                  {bookmark.unread ? 'Mark as read' : 'Mark as unread'}
                </Button>
              </div>
            </Card.Footer>
          </div>
        )}
      </div>
    </Card>
  )
}
