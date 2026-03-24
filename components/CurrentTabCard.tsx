import { useState, useEffect, useRef } from 'react'
import { LayerCard, Button, Tooltip } from '@cloudflare/kumo'
import { TrashIcon, PlusIcon } from '@phosphor-icons/react'
import { BookmarkContent } from './BookmarkContent'
import type { Bookmark } from '@/utils/types'

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
  onToggleUnread: (id: number, currentUnread: boolean) => Promise<void>
  onAdd?: (url: string, title: string, description: string) => Promise<void>
  onDelete?: (id: number) => Promise<void>
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
              <div className="flex items-start gap-1">
                <BookmarkContent
                  bookmark={{
                    url,
                    title,
                    description,
                    favicon_url: favicon,
                    preview_image_url: null,
                    tag_names: [],
                    date_added: new Date().toISOString(),
                  }}
                  showDate={false}
                />
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-kumo-subtle" />
                <Button
                  variant="primary"
                  shape="square"
                  icon={<PlusIcon weight="bold" className="size-4" />}
                  aria-label="Add"
                  disabled={isLoading}
                  onClick={() => onAdd?.(url, title, description)}
                />
              </div>
            </LayerCard.Primary>
          </div>
        ) : (
          <div key="manage">
            <LayerCard.Secondary>{bookmark.unread ? 'Unread' : 'Read'}</LayerCard.Secondary>
            <LayerCard.Primary>
              <div className="flex items-start gap-1">
                <BookmarkContent bookmark={bookmark} />
              </div>
              <div className="pt-4 flex items-center justify-between">
                <div className="text-xs text-kumo-subtle" />
                <div className="flex items-center gap-1">
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
                    variant={bookmark.unread ? 'primary' : 'secondary'}
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
