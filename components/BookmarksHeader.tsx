import { Button } from '@heroui/react'
import { ExternalLink, Settings as SettingsIcon } from 'lucide-react'
import { FilterTabs, UnreadFilter } from '@/components/FilterTabs'
import { CurrentTabCard } from '@/components/CurrentTabCard'
import { Bookmark } from './BookmarksList'

interface BookmarksHeaderProps {
  unreadFilter: UnreadFilter
  onUnreadFilterChange: (filter: UnreadFilter) => void
  variant: 'default' | 'expanded'
  currentTabUrl: string | null
  currentTabCheckData: any
  realtimeMetadata: any
  isCurrentTabBookmarkLoading: boolean | undefined
  isCurrentTabBookmarkValidating: boolean | undefined
  isPollingMetadata: boolean | undefined
  onToggleUnread: (id: number, current: boolean) => Promise<void>
  onAdd: (url: string, title: string, desc: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function BookmarksHeader({
  unreadFilter,
  onUnreadFilterChange,
  variant,
  currentTabUrl,
  currentTabCheckData,
  realtimeMetadata,
  isCurrentTabBookmarkLoading,
  isCurrentTabBookmarkValidating,
  isPollingMetadata,
  onToggleUnread,
  onAdd,
  onDelete,
}: BookmarksHeaderProps) {
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
            <ExternalLink className="w-4 h-4" />
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
            <SettingsIcon size={18} />
          </Button>
        )}
      </div>
      <div
        className="grid grid-rows-[0fr] animate-none data-[open=true]:grid-rows-[1fr] origin-top"
        style={{ overflow: 'hidden' }}
        data-open={!!currentTabCheckData}
      >
        <div className="overflow-hidden min-h-0">
          {currentTabCheckData && (
            <div className="mt-2">
              <CurrentTabCard
                url={currentTabUrl || ''}
                bookmark={currentTabCheckData.bookmark}
                metadata={currentTabCheckData.metadata}
                realtimeMetadata={realtimeMetadata}
                isLoading={!!isCurrentTabBookmarkLoading}
                isValidating={
                  !!isCurrentTabBookmarkValidating && !isPollingMetadata
                }
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
