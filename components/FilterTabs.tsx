import { Tabs } from '@cloudflare/kumo'

export type UnreadFilter = 'all' | 'unread' | 'read'

interface FilterTabsProps {
  selectedKey: UnreadFilter
  onSelectionChange: (key: UnreadFilter) => void
}

export function FilterTabs({ selectedKey, onSelectionChange }: FilterTabsProps) {
  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
  ]

  return (
    <Tabs
      value={selectedKey}
      onValueChange={value => onSelectionChange(value as UnreadFilter)}
      tabs={tabs}
    />
  )
}
