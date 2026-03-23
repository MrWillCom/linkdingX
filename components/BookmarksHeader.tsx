import { Button, Popover, Tooltip, TooltipProvider, Text, Surface } from '@cloudflare/kumo'
import {
  CloudCheckIcon,
  CloudSlashIcon,
  CloudArrowUpIcon,
  ArrowSquareOutIcon,
  GearIcon,
} from '@phosphor-icons/react'
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
      ? 'bg-kumo-success'
      : status === 'pending'
        ? 'bg-kumo-warning'
        : 'bg-kumo-danger'
  const StatusIcon =
    status === 'synced' ? CloudCheckIcon : status === 'pending' ? CloudArrowUpIcon : CloudSlashIcon

  return (
    <div className="sticky top-0 z-30 bg-kumo-base px-2 py-2 border-b border-kumo-line">
      <div className="flex items-center justify-between h-9">
        <FilterTabs selectedKey={unreadFilter} onSelectionChange={onUnreadFilterChange} />
        <div className="flex items-center">
          <span className="relative inline-flex">
            <Popover>
              <TooltipProvider>
                <Tooltip content={tooltip} asChild side="bottom">
                  <Popover.Trigger asChild>
                    <Button variant="ghost" shape="square" aria-label="View sync queue">
                      <StatusIcon weight="bold" className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </Popover.Trigger>
                </Tooltip>
              </TooltipProvider>
              <Popover.Content className="w-64 p-3" side="bottom">
                <Popover.Title className="text-sm font-semibold">Sync Queue</Popover.Title>
                <div className="mt-2">
                  {items.length === 0 ? (
                    <Popover.Description>No pending tasks</Popover.Description>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {items.map(item => (
                        <li key={item.id} className="flex gap-2">
                          <div className="uppercase text-[10px] text-kumo-subtle shrink-0">
                            {item.action}
                          </div>
                          <span className="truncate text-kumo-default" title={item.title}>
                            {item.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Popover.Content>
            </Popover>
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-kumo-base ${statusDotClass}`}
              aria-hidden="true"
            />
          </span>
          {variant === 'default' && (
            <Button
              variant="ghost"
              shape="square"
              aria-label="Open in new tab"
              onClick={async () => {
                const url = browser.runtime.getURL('/home.html')
                await browser.tabs.create({ url })
                window.close() // Close the side panel
              }}
            >
              <ArrowSquareOutIcon weight="bold" className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
          {variant === 'expanded' && (
            <Button
              variant="ghost"
              shape="square"
              aria-label="Open settings"
              onClick={() => browser.runtime.openOptionsPage()}
            >
              <GearIcon weight="bold" size={18} aria-hidden="true" />
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
