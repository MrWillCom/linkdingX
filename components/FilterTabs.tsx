import { Tabs } from '@cloudflare/kumo'

const TABS = [
  { value: 'all' as const, label: 'All' },
  { value: 'unread' as const, label: 'Unread' },
  { value: 'read' as const, label: 'Read' },
]

export type UnreadFilter = 'all' | 'unread' | 'read'

interface FilterTabsProps {
  selectedKey: UnreadFilter
  onSelectionChange: (key: UnreadFilter) => void
}

export function FilterTabs({ selectedKey, onSelectionChange }: FilterTabsProps) {
  return (
    <Tabs
      value={selectedKey}
      onValueChange={value => onSelectionChange(value as UnreadFilter)}
      tabs={TABS}
    />
  )
}
