import { Button } from '@heroui/react'
import { ExternalLink, Settings as SettingsIcon } from 'lucide-react'
import { FilterTabs, UnreadFilter } from '@/components/FilterTabs'
import { CurrentTabCard } from '@/components/CurrentTabCard'
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

  return (
    <div className="sticky top-0 z-30 bg-background px-2 py-2">
      <div className="flex items-center justify-between h-9">
        <FilterTabs
          selectedKey={unreadFilter}
          onSelectionChange={onUnreadFilterChange}
        />
        {variant === 'default' && (
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            aria-label="Open in new tab"
            onPress={async () => {
              const url = browser.runtime.getURL('/home.html')
              await browser.tabs.create({ url })
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
