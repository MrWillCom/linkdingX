import { useState, useRef, useEffect, useMemo } from 'react'
import { LayerCard, Button, Tooltip } from '@cloudflare/kumo'
import { TrashIcon, PlusIcon } from '@phosphor-icons/react'
import { BookmarkContent } from './BookmarkContent'
import type { Bookmark } from '@/utils/types'

interface CurrentTabCardProps {
  url: string
  bookmark: Bookmark | null | undefined
  serverBookmark: Bookmark | null | undefined
  metadata?: {
    title: string
    description: string
    [key: string]: unknown
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
  serverBookmark,
  metadata,
  realtimeMetadata,
  isLoading,
  onToggleUnread,
  onAdd,
  onDelete,
}: CurrentTabCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const effectiveBookmark = bookmark || serverBookmark
  const isBookmarked = !!effectiveBookmark

  const handleDeletePress = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isConfirmingDelete) {
      onDelete?.(effectiveBookmark!.id)
      setIsConfirmingDelete(false)
    } else {
      setIsConfirmingDelete(true)
      timerRef.current = setTimeout(() => {
        setIsConfirmingDelete(false)
      }, 5000)
    }
  }

  const title =
    effectiveBookmark?.title || realtimeMetadata?.title || metadata?.title || currentTabUrl || ''
  const url = effectiveBookmark?.url || currentTabUrl || ''
  const description = effectiveBookmark?.description || metadata?.description || ''
  const favicon = effectiveBookmark?.favicon_url || realtimeMetadata?.favicon || null

  const stableDateAdded = useMemo(() => new Date().toISOString(), [])

  const fallbackBookmark = useMemo(
    () => ({
      url,
      title,
      description,
      favicon_url: favicon,
      preview_image_url: null,
      tag_names: [],
      date_added: stableDateAdded,
    }),
    [url, title, description, favicon, stableDateAdded],
  )

  return (
    <LayerCard>
      <div className="min-h-0 overflow-hidden">
        {!isBookmarked ? (
          <div key="add">
            <LayerCard.Secondary>Current Tab</LayerCard.Secondary>
            <LayerCard.Primary>
              <div className="flex items-start gap-1">
                <BookmarkContent bookmark={fallbackBookmark} showDate={false} />
              </div>
              <div className="pt-4 flex items-center justify-between select-none">
                <span className="text-xs text-kumo-subtle" aria-hidden="true" />
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
            <LayerCard.Secondary>
              {effectiveBookmark.unread ? 'Unread' : 'Read'}
            </LayerCard.Secondary>
            <LayerCard.Primary>
              <div className="flex items-start gap-1">
                <BookmarkContent bookmark={effectiveBookmark} />
              </div>
              <div className="pt-4 flex items-center justify-between select-none">
                <div className="text-xs text-kumo-subtle" aria-hidden="true" />
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
                      <TrashIcon weight="bold" className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Tooltip>
                  <Button
                    variant={effectiveBookmark.unread ? 'primary' : 'secondary'}
                    className="w-32 justify-center"
                    disabled={isLoading}
                    onClick={() => onToggleUnread(effectiveBookmark.id, effectiveBookmark.unread)}
                  >
                    {effectiveBookmark.unread ? 'Mark as read' : 'Mark as unread'}
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
