import { TrashIcon, TrayArrowDownIcon, BookIcon, BookOpenIcon, XIcon } from '@phosphor-icons/react'
import { Button, Surface, Tooltip, TooltipProvider } from '@cloudflare/kumo'
import { bookmarkService } from '@/utils/bookmarkService'
import { useState, useRef, useEffect } from 'react'

interface ManagerBulkActionsProps {
  selectedIds: number[]
  onClearSelection: () => void
  onMutate: () => void
}

export function ManagerBulkActions({
  selectedIds,
  onClearSelection,
  onMutate,
}: ManagerBulkActionsProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousSelectedIdsRef = useRef<number[]>([])

  useEffect(() => {
    const previousIds = previousSelectedIdsRef.current
    if (isConfirmingDelete && JSON.stringify(previousIds) !== JSON.stringify(selectedIds)) {
      setIsConfirmingDelete(false)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    previousSelectedIdsRef.current = selectedIds
  }, [selectedIds, isConfirmingDelete])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const handleDelete = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (isConfirmingDelete) {
      try {
        await bookmarkService.bulkDeleteBookmarks(selectedIds)
        setIsConfirmingDelete(false)
        onMutate()
        onClearSelection()
      } catch (error) {
        console.error('Failed to delete bookmarks:', error)
      }
    } else {
      setIsConfirmingDelete(true)
      timerRef.current = setTimeout(() => {
        setIsConfirmingDelete(false)
      }, 5000)
    }
  }

  const handleMarkAsRead = async () => {
    try {
      await bookmarkService.bulkUpdateBookmarks(selectedIds, { unread: false })
      onMutate()
      onClearSelection()
    } catch (error) {
      console.error('Failed to mark bookmarks as read:', error)
    }
  }

  const handleMarkAsUnread = async () => {
    try {
      await bookmarkService.bulkUpdateBookmarks(selectedIds, { unread: true })
      onMutate()
      onClearSelection()
    } catch (error) {
      console.error('Failed to mark bookmarks as unread:', error)
    }
  }

  const handleArchive = async () => {
    try {
      await bookmarkService.bulkUpdateBookmarks(selectedIds, {
        is_archived: true,
      })
      onMutate()
      onClearSelection()
    } catch (error) {
      console.error('Failed to archive bookmarks:', error)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <TooltipProvider>
      <Surface className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 shadow-lg border border-kumo-line rounded-lg z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-kumo-default">
            {selectedIds.length} selected
          </span>

          <div className="flex items-center gap-2">
            <Tooltip content="Mark as read" asChild>
              <Button
                onClick={handleMarkAsRead}
                variant="secondary"
                shape="square"
                aria-label="Mark as read"
              >
                <BookOpenIcon weight="bold" />
              </Button>
            </Tooltip>
            <Tooltip content="Mark as unread" asChild>
              <Button
                onClick={handleMarkAsUnread}
                variant="secondary"
                shape="square"
                aria-label="Mark as unread"
              >
                <BookIcon weight="bold" />
              </Button>
            </Tooltip>
            <Tooltip content="Archive" asChild>
              <Button
                onClick={handleArchive}
                variant="secondary"
                shape="square"
                aria-label="Archive"
              >
                <TrayArrowDownIcon weight="bold" />
              </Button>
            </Tooltip>
            <Tooltip
              content={isConfirmingDelete ? 'Click again to confirm' : 'Delete'}
              disabled={!isConfirmingDelete}
              asChild
            >
              <Button
                onClick={handleDelete}
                variant={isConfirmingDelete ? 'destructive' : 'secondary'}
                shape="square"
                aria-label={isConfirmingDelete ? 'Confirm delete bookmarks' : 'Delete bookmarks'}
              >
                <TrashIcon weight="bold" />
              </Button>
            </Tooltip>
          </div>

          <Tooltip content="Clear selection" asChild>
            <Button
              onClick={onClearSelection}
              variant="ghost"
              shape="square"
              aria-label="Clear selection"
            >
              <XIcon weight="bold" />
            </Button>
          </Tooltip>
        </div>
      </Surface>
    </TooltipProvider>
  )
}
