import { Button, Popover, Tooltip } from '@heroui/react'
import {
  CloudAlert,
  CloudCheck,
  CloudSync,
  ExternalLink,
  Settings as SettingsIcon,
} from 'lucide-react'
import { FilterTabs, UnreadFilter } from '@/components/FilterTabs'
import { CurrentTabCard } from '@/components/CurrentTabCard'
import { useSyncQueueStatus } from '@/hooks/useSyncQueueStatus'
import { Bookmark } from './BookmarksList'

export interface BookmarkCheckResponse {
  bookmark: Bookmark | null
  metadata: {
    title: string
    description: string
    [key: string]: any
  }
}

interface BookmarksHeaderProps {
  unreadFilter: UnreadFilter
  onUnreadFilterChange: (filter: UnreadFilter) => void
  variant: 'default' | 'expanded'
  currentTabUrl: string | null
  currentTabBookmark: Bookmark | null | undefined
  currentTabMetadata: any
  realtimeMetadata: {
    title: string
    favicon: string | null
  }
  isCurrentTabBookmarkLoading: boolean
  onToggleUnread: (id: number, current: boolean) => Promise<void>
  onAdd: (url: string, title: string, desc: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  isScrolled: boolean
}

export function BookmarksHeader({
  unreadFilter,
  onUnreadFilterChange,
  variant,
  currentTabUrl,
  currentTabBookmark,
  currentTabMetadata,
  realtimeMetadata,
  isCurrentTabBookmarkLoading,
  onToggleUnread,
  onAdd,
  onDelete,
  isScrolled,
}: BookmarksHeaderProps) {
  const isVisible = !!currentTabUrl
  const { status, count, tooltip, items } = useSyncQueueStatus()
  const statusDotClass =
    status === 'synced'
      ? 'bg-success'
      : status === 'pending'
        ? 'bg-warning'
        : 'bg-danger'
  const StatusIcon =
    status === 'synced'
      ? CloudCheck
      : status === 'pending'
        ? CloudSync
        : CloudAlert

  return (
    <div className="sticky top-0 z-30 bg-background px-2 py-2">
      <div className="flex items-center justify-between h-9">
        <FilterTabs
          selectedKey={unreadFilter}
          onSelectionChange={onUnreadFilterChange}
        />
        <div className="flex items-center gap-2">
          <span className="relative inline-flex">
            <Popover>
              <Popover.Trigger>
                <Tooltip delay={0} closeDelay={0}>
                  <Tooltip.Trigger>
                    <Button
                      variant="tertiary"
                      size="sm"
                      isIconOnly
                      aria-label="View sync queue"
                    >
                      <StatusIcon className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content placement="bottom">
                    {tooltip}
                  </Tooltip.Content>
                </Tooltip>
              </Popover.Trigger>
              <Popover.Content className="w-64">
                <Popover.Dialog className="p-3">
                  <Popover.Heading className="text-sm font-semibold">
                    Sync Queue
                  </Popover.Heading>
                  <div className="mt-2">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted">No pending tasks</p>
                    ) : (
                      <ul className="text-sm text-foreground space-y-1">
                        {items.map(item => (
                          <li key={item.id} className="flex gap-2">
                            <span className="text-muted uppercase text-2xs">
                              {item.action}
                            </span>
                            <span className="truncate" title={item.title}>
                              {item.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-background ${statusDotClass}`}
              aria-hidden="true"
            />
          </span>
          {variant === 'default' && (
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              aria-label="Open in new tab"
              onPress={async () => {
                const url = browser.runtime.getURL('/home.html')
                await browser.tabs.create({ url })
                window.close() // Close the side panel
              }}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
          {variant === 'expanded' && (
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              aria-label="Open settings"
              onPress={() => browser.runtime.openOptionsPage()}
            >
              <SettingsIcon size={18} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      <div
        className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-in-out data-[open=true]:grid-rows-[1fr] origin-top"
        data-open={isVisible}
      >
        <div className="min-h-0">
          {isVisible && (
            <div className="mt-2">
              <CurrentTabCard
                url={currentTabUrl || ''}
                bookmark={currentTabBookmark}
                metadata={currentTabMetadata}
                realtimeMetadata={realtimeMetadata}
                isLoading={isCurrentTabBookmarkLoading}
                onToggleUnread={onToggleUnread}
                onAdd={onAdd}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>
      </div>
      <div
        className={`absolute top-full left-0 right-0 h-8 bg-linear-to-b from-background to-transparent pointer-events-none z-10 transition-opacity duration-200 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
