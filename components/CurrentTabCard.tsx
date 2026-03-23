import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { LayerCard, Link, Badge, Button, Tooltip, Text } from '@cloudflare/kumo'
import { TrashIcon, PlusIcon } from '@phosphor-icons/react'
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

  const title = bookmark?.title || realtimeMetadata?.title || metadata?.title || currentTabUrl || ''
  const url = bookmark?.url || currentTabUrl || ''
  const description = bookmark?.description || metadata?.description || ''
  const favicon = bookmark?.favicon_url || realtimeMetadata?.favicon || null

  return (
    <LayerCard>
      <div className="min-h-0 overflow-hidden">
        {!isBookmarked ? (
          <div key="add">
            <LayerCard.Secondary>Current Tab</LayerCard.Secondary>
            <LayerCard.Primary>
              <div className="flex min-w-0 items-center gap-1.5 mb-2">
                <BookmarkFavicon url={favicon} />
                <div className="line-clamp-1 text-sm font-bold">{title}</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="min-w-0">
                  <Link
                    href={url}
                    target="_blank"
                    className="text-xs text-kumo-subtle hover:text-kumo-brand transition-colors line-clamp-1"
                  >
                    {url}
                  </Link>
                  {description && (
                    <div className="mt-1 line-clamp-2 text-xs text-kumo-subtle">{description}</div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-kumo-subtle" />
                <Button
                  variant="primary"
                  disabled={isLoading}
                  onClick={() => onAdd?.(url, title, description)}
                >
                  <PlusIcon weight="bold" className="size-4" />
                </Button>
              </div>
            </LayerCard.Primary>
          </div>
        ) : (
          <div key="manage">
            <LayerCard.Secondary>{bookmark.unread ? 'Unread' : 'Read'}</LayerCard.Secondary>
            <LayerCard.Primary>
              <div className="flex min-w-0 items-center gap-1.5 mb-2">
                <BookmarkFavicon url={favicon} />
                <div className="line-clamp-1 text-sm text-kumo-default">{title}</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <Link
                    href={bookmark.url}
                    target="_blank"
                    className="text-xs text-kumo-subtle hover:text-kumo-brand transition-colors line-clamp-1 underline decoration-kumo-line"
                  >
                    {bookmark.url}
                  </Link>
                  {description && (
                    <div className="line-clamp-2 text-xs text-kumo-subtle">{description}</div>
                  )}
                  {bookmark.tag_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {bookmark.tag_names.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <BookmarkPreview
                  url={bookmark.preview_image_url}
                  alt={bookmark.title || bookmark.url}
                  className="h-14 w-20 shrink-0"
                />
              </div>
              <div className="pt-4 flex items-center justify-between">
                <div className="text-xs text-kumo-subtle">
                  {formatDistanceToNow(new Date(bookmark.date_added), {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip content="Click again to confirm delete" disabled={!isConfirmingDelete}>
                    <Button
                      variant={isConfirmingDelete ? 'destructive' : 'ghost'}
                      shape="square"
                      className={!isConfirmingDelete ? 'text-kumo-danger hover:bg-kumo-tint' : ''}
                      aria-label={
                        isConfirmingDelete ? 'Confirm delete bookmark' : 'Delete bookmark'
                      }
                      disabled={isLoading}
                      onClick={handleDeletePress}
                    >
                      <TrashIcon weight="bold" className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Button
                    variant="primary"
                    className="w-32 justify-center"
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
