import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, Link, Chip, Button, Popover } from '@heroui/react'
import { Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
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
  bookmark: Bookmark | null
  metadata?: {
    title: string
    description: string
    [key: string]: any
  }
  isLoading: boolean
  isValidating: boolean
  onToggleUnread: (id: number, currentUnread: boolean) => void
  onAdd?: (url: string, title: string, description: string) => void
  onDelete?: (id: number) => void
}

export function CurrentTabCard({
  url: currentTabUrl,
  bookmark,
  metadata,
  isLoading,
  isValidating,
  onToggleUnread,
  onAdd,
  onDelete,
}: CurrentTabCardProps) {
  const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
  const isBookmarked = !!bookmark
  const title = bookmark?.title || metadata?.title || currentTabUrl || ''
  const url = bookmark?.url || currentTabUrl || ''
  const description = bookmark?.description || metadata?.description || ''

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {!isBookmarked ? (
        <Card
          variant="secondary"
          className="border border-default-200 shadow-sm"
        >
          <Card.Header className="pb-1">
            <Card.Description className="text-2xs uppercase tracking-wide">
              Not in Linkding
            </Card.Description>
            <Card.Title className="text-sm line-clamp-1">
              <span className="flex min-w-0 items-center gap-1.5">
                <BookmarkFavicon url={null} />
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
              isDisabled={isLoading || isValidating}
              onPress={() => onAdd?.(url, title, description)}
            >
              Add to Linkding
            </Button>
          </Card.Footer>
        </Card>
      ) : (
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
              <Popover
                isOpen={isDeletePopoverOpen}
                onOpenChange={open => setIsDeletePopoverOpen(open)}
              >
                <Popover.Trigger>
                  <Button
                    size="sm"
                    variant="ghost"
                    isIconOnly
                    className="text-danger hover:bg-danger-50"
                    aria-label="Delete bookmark"
                    isDisabled={isLoading || isValidating}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Popover.Trigger>
                <Popover.Content placement="bottom end">
                  <Popover.Arrow />
                  <Popover.Dialog className="p-3">
                    <Popover.Heading className="text-sm font-medium mb-3">
                      Delete this bookmark?
                    </Popover.Heading>
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => setIsDeletePopoverOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onPress={() => {
                          onDelete?.(bookmark.id)
                          setIsDeletePopoverOpen(false)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
              <Button
                size="sm"
                variant={bookmark.unread ? 'primary' : 'ghost'}
                isDisabled={isLoading || isValidating}
                onPress={() => onToggleUnread(bookmark.id, bookmark.unread)}
              >
                {bookmark.unread ? 'Mark as read' : 'Mark as unread'}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      )}
    </motion.div>
  )
}
