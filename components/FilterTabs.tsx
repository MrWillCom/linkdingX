import { Tabs } from '@heroui/react'

export type UnreadFilter = 'all' | 'unread' | 'read'

interface FilterTabsProps {
  selectedKey: UnreadFilter
  onSelectionChange: (key: UnreadFilter) => void
}

export function FilterTabs({
  selectedKey,
  onSelectionChange,
}: FilterTabsProps) {
  return (
    <Tabs
      selectedKey={selectedKey}
      onSelectionChange={key => onSelectionChange(key as UnreadFilter)}
    >
      <Tabs.List>
        <Tabs.Tab id="all">
          All
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="unread">
          Unread
          <Tabs.Indicator />
        </Tabs.Tab>
        <Tabs.Tab id="read">
          Read
          <Tabs.Indicator />
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  )
}
