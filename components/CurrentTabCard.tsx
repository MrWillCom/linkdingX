import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { LayerCard, Link, Badge, Button, Tooltip, Text } from '@cloudflare/kumo'
import { Trash, Plus } from '@phosphor-icons/react'
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
    <LayerCard>
      <div className="min-h-0">
        {!isBookmarked ? (
          <div key="add">
            <LayerCard.Secondary className="pb-1">
              <div className="uppercase tracking-wide">
                <Text variant="secondary" size="xs">
                  Not in Linkding
                </Text>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 mt-1">
                <BookmarkFavicon url={favicon} />
                <div className="line-clamp-1">
                  <Text variant="body" size="sm" bold>
                    {title}
                  </Text>
                </div>
              </div>
            </LayerCard.Secondary>
            <LayerCard.Primary className="pt-2 pb-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={url}
                    target="_blank"
                    className="text-xs text-kumo-subtle hover:text-kumo-brand transition-colors line-clamp-1"
                  >
                    {url}
                  </Link>
                  {description && (
                    <div className="mt-1.5 line-clamp-2">
                      <Text variant="secondary" size="xs">
                        {description}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-kumo-subtle" />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={isLoading}
                  onClick={() => onAdd?.(url, title, description)}
                >
                  <Plus weight="bold" className="size-4" />
                </Button>
              </div>
            </LayerCard.Primary>
          </div>
        ) : (
          <div key="manage">
            <LayerCard.Secondary className="pb-1">
              <div className="flex items-center justify-between gap-2">
                <div className="uppercase tracking-wide">
                  <Text variant="secondary" size="xs">
                    Current page in Linkding
                  </Text>
                </div>
                <Badge
                  variant={bookmark.unread ? 'primary' : 'secondary'}
                  className="h-5 px-1.5 uppercase tracking-wide font-medium text-[8px]"
                >
                  {bookmark.unread ? 'Unread' : 'Read'}
                </Badge>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 mt-1">
                <BookmarkFavicon url={favicon} />
                <div className="line-clamp-1">
                  <Text variant="body" size="sm" bold>
                    {title}
                  </Text>
                </div>
              </div>
            </LayerCard.Secondary>
            <LayerCard.Primary className="pt-2 pb-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={bookmark.url}
                    target="_blank"
                    className="text-xs text-kumo-subtle hover:text-kumo-brand transition-colors line-clamp-1"
                  >
                    {bookmark.url}
                  </Link>
                  {description && (
                    <div className="mt-1.5 line-clamp-2">
                      <Text variant="secondary" size="xs">
                        {description}
                      </Text>
                    </div>
                  )}
                  {bookmark.tag_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {bookmark.tag_names.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {tag}
                        </Badge>
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
              <div className="pt-4 flex items-center justify-between">
                <Text variant="secondary" size="xs">
                  {formatDistanceToNow(new Date(bookmark.date_added), {
                    addSuffix: true,
                  })}
                </Text>
                <div className="flex items-center gap-2">
                  <Tooltip
                    content="Click again to confirm delete"
                    disabled={!isConfirmingDelete}
                  >
                    <Button
                      size="sm"
                      variant={isConfirmingDelete ? 'destructive' : 'ghost'}
                      shape="square"
                      className={
                        !isConfirmingDelete
                          ? 'text-kumo-danger hover:bg-kumo-tint'
                          : ''
                      }
                      aria-label={
                        isConfirmingDelete
                          ? 'Confirm delete bookmark'
                          : 'Delete bookmark'
                      }
                      disabled={isLoading}
                      onClick={handleDeletePress}
                    >
                      <Trash weight="bold" className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-36"
                    disabled={isLoading}
                    onClick={() => onToggleUnread(bookmark.id, bookmark.unread)}
                  >
                    {bookmark.unread ? 'Mark as read' : 'Mark as unread'}
                  </Button>
                </div>
              </div>
            </LayerCard.Primary>
          </div>
        )}
      </div>
    </LayerCard>
  )
}
