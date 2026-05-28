import { useState, useRef } from 'react'
import {
  Button,
  Popover,
  Tooltip,
  TooltipProvider,
  Text,
  Surface,
  Input,
  Loader,
} from '@cloudflare/kumo'
import {
  CloudCheckIcon,
  CloudSlashIcon,
  CloudArrowUpIcon,
  ArrowSquareOutIcon,
  GearIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react'
import { FilterTabs } from '@/components/FilterTabs'
import type { UnreadFilter } from '@/components/FilterTabs'
import { CurrentTabCard } from '@/components/CurrentTabCard'
import { useSyncQueueStatus } from '@/hooks/useSyncQueueStatus'
import type { Bookmark } from '@/utils/types'

const STATUS_CONFIG: Record<string, { dotClass: string; Icon: typeof CloudCheckIcon }> = {
  synced: { dotClass: 'bg-kumo-success', Icon: CloudCheckIcon },
  pending: { dotClass: 'bg-kumo-warning', Icon: CloudArrowUpIcon },
  error: { dotClass: 'bg-kumo-danger', Icon: CloudSlashIcon },
}

export interface BookmarkCheckResponse {
  bookmark: Bookmark | null
  metadata: {
    title: string
    description: string
    [key: string]: unknown
  }
}

interface BookmarksHeaderProps {
  unreadFilter: UnreadFilter
  onUnreadFilterChange: (filter: UnreadFilter) => void
  variant: 'default' | 'expanded'
  currentTabUrl: string | null
  currentTabBookmark: Bookmark | null | undefined
  currentTabServerBookmark: Bookmark | null | undefined
  currentTabMetadata:
    | {
        title: string
        description: string
        [key: string]: unknown
      }
    | undefined
  realtimeMetadata: {
    title: string
    favicon: string | null
  }
  isCurrentTabBookmarkLoading: boolean
  onToggleUnread: (id: number, current: boolean) => Promise<void>
  onAdd: (url: string, title: string, desc: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
  isScrolled: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onClearSearch?: () => void
  isSearching?: boolean
}

export function BookmarksHeader({
  unreadFilter,
  onUnreadFilterChange,
  variant,
  currentTabUrl,
  currentTabBookmark,
  currentTabServerBookmark,
  currentTabMetadata,
  realtimeMetadata,
  isCurrentTabBookmarkLoading,
  onToggleUnread,
  onAdd,
  onDelete,
  isScrolled,
  searchQuery,
  onSearchChange,
  onClearSearch,
  isSearching,
}: BookmarksHeaderProps) {
  const isVisible = !!currentTabUrl
  const { status, tooltip, items } = useSyncQueueStatus()
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.error
  const statusDotClass = config.dotClass
  const StatusIcon = config.Icon

  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSearchExpanded = isSearchFocused || !!searchQuery

  return (
    <div className="sticky top-0 z-20 bg-kumo-base px-2 py-2 border-x -mx-px border-b border-kumo-line rounded-b-xl">
      <div className="flex items-center h-9 gap-0.5 select-none">
        <FilterTabs selectedKey={unreadFilter} onSelectionChange={onUnreadFilterChange} />

        <div className="flex-1" />

        {variant === 'expanded' && (
          <div
            className={`relative h-9 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isSearchExpanded ? 'w-64' : 'w-9'
            }`}
          >
            <div
              className={`absolute inset-0 z-20 transition-opacity duration-200 ${
                isSearchExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <Button
                variant="ghost"
                shape="square"
                aria-label="Search bookmarks"
                onClick={() => {
                  setIsSearchFocused(true)
                  setTimeout(() => inputRef.current?.focus(), 50)
                }}
                className="w-full h-full"
              >
                <MagnifyingGlassIcon weight="bold" size={16} />
              </Button>
            </div>

            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                isSearchExpanded
                  ? 'opacity-100 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-kumo-subtle z-10">
                {isSearching ? (
                  <Loader size="sm" />
                ) : (
                  <MagnifyingGlassIcon weight="bold" size={16} />
                )}
              </div>
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search bookmarks..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') {
                    if (onClearSearch) {
                      onClearSearch()
                    } else {
                      onSearchChange('')
                    }
                    inputRef.current?.blur()
                  }
                }}
                className="w-full pl-9 bg-kumo-surface h-9"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
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
                window.close()
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
                serverBookmark={currentTabServerBookmark}
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
    </div>
  )
}
