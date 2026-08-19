import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { Button, Link, Tooltip, TooltipProvider } from '@cloudflare/kumo'
import {
  TrayArrowDownIcon,
  TrayArrowUpIcon,
  ArrowSquareOutIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { BookmarkContent } from './BookmarkContent'
import type { Bookmark } from '@/utils/types'
import styles from './BookmarkItem.module.css'

interface BookmarkItemProps {
  bookmark: Bookmark
  isDimmed: boolean
  onToggleUnread: (id: number, currentUnread: boolean) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onToggleArchive: (id: number, currentArchived: boolean) => Promise<void>
  onOpenInLinkding: (bookmark: Bookmark) => void
}

export const BookmarkItem = memo(function BookmarkItem({
  bookmark,
  isDimmed,
  onToggleUnread,
  onDelete,
  onToggleArchive,
  onOpenInLinkding,
}: BookmarkItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleDeletePress = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (isConfirmingDelete) {
      onDelete(bookmark.id)
      setIsConfirmingDelete(false)
    } else {
      setIsConfirmingDelete(true)
      timerRef.current = setTimeout(() => {
        setIsConfirmingDelete(false)
      }, 5000)
    }
  }, [isConfirmingDelete, onDelete, bookmark.id])

  return (
    <div
      data-dimmed={isDimmed}
      data-archived={bookmark.is_archived}
      className={`group relative flex items-start gap-1 py-2 px-2 hover:bg-kumo-elevated rounded-xl transition-colors ${styles.bookmarkItem}`}
      style={{ contentVisibility: 'auto' }}
    >
      <button
        onClick={e => {
          e.stopPropagation()
          onToggleUnread(bookmark.id, bookmark.unread)
        }}
        className={`relative z-10 group/button shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kumo-ring p-2 -mt-0.5 -ml-1.5 -mr-0.5 rounded-full hover:bg-kumo-recessed active:bg-kumo-tint transition-colors ${styles.dimAsset}`}
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
        variant="current"
        className="absolute inset-0 z-[5]"
        tabIndex={-1}
        aria-hidden="true"
      />
      <BookmarkContent
        bookmark={bookmark}
        titleHref={bookmark.url}
        titleClassName={styles.dimText}
        descriptionClassName={`line-clamp-2 ${styles.dimText}`}
        dateClassName={styles.dimAsset}
        tagClassName={styles.dimAsset}
        previewClassName={styles.dimAsset}
      />
      <div className="absolute bottom-1 right-2 z-10 flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity select-none">
        <TooltipProvider>
          <Tooltip
            content={bookmark.is_archived ? 'Unarchive' : 'Archive'}
            side="top"
            render={
              <Button
                variant="ghost"
                shape="square"
                icon={
                  bookmark.is_archived ? (
                    <TrayArrowUpIcon weight="bold" />
                  ) : (
                    <TrayArrowDownIcon weight="bold" />
                  )
                }
                aria-label={bookmark.is_archived ? 'Unarchive' : 'Archive'}
                onClick={e => {
                  e.stopPropagation()
                  onToggleArchive(bookmark.id, bookmark.is_archived)
                }}
              />
            }
          />
          <Tooltip
            content="Show in Linkding"
            side="top"
            render={
              <Button
                variant="ghost"
                shape="square"
                icon={<ArrowSquareOutIcon weight="bold" />}
                aria-label="Show in Linkding"
                onClick={e => {
                  e.stopPropagation()
                  onOpenInLinkding(bookmark)
                }}
              />
            }
          />
          <Tooltip
            content={isConfirmingDelete ? 'Click again to confirm' : 'Delete'}
            disabled={!isConfirmingDelete}
            side="top"
            render={
              <Button
                variant={isConfirmingDelete ? 'destructive' : 'ghost'}
                shape="square"
                icon={<TrashIcon weight="bold" />}
                aria-label={isConfirmingDelete ? 'Confirm delete bookmark' : 'Delete bookmark'}
                onClick={e => {
                  e.stopPropagation()
                  handleDeletePress()
                }}
              />
            }
          />
        </TooltipProvider>
      </div>
    </div>
  )
})
