import {
  FloppyDiskIcon,
  CloudCheckIcon,
  CloudArrowUpIcon,
  CloudSlashIcon,
  ListChecksIcon,
  ArrowClockwiseIcon,
} from '@phosphor-icons/react'
import {
  Button,
  Input,
  Tabs,
  Tooltip,
  TooltipProvider,
  Popover,
  Loader,
  Checkbox,
} from '@cloudflare/kumo'
import { useSyncQueueStatus } from '@/hooks/useSyncQueueStatus'
import { useDataSyncStatus } from '@/hooks/useDataSyncStatus'
import type { Table, Column } from '@tanstack/react-table'

const STATUS_CONFIG: Record<string, { dotClass: string; Icon: typeof CloudCheckIcon }> = {
  synced: { dotClass: 'bg-kumo-success', Icon: CloudCheckIcon },
  pending: { dotClass: 'bg-kumo-warning', Icon: CloudArrowUpIcon },
  error: { dotClass: 'bg-kumo-danger', Icon: CloudSlashIcon },
}

interface ManagerToolbarProps<TData> {
  table: Table<TData>
  dirtyRowsCount: number
  saveMode: 'instant' | 'manual'
  setSaveMode: (mode: 'instant' | 'manual') => void
  onCommitChanges: () => void
}

export function ManagerToolbar<TData>({
  table,
  dirtyRowsCount,
  saveMode,
  setSaveMode,
  onCommitChanges,
}: ManagerToolbarProps<TData>) {
  const { status, tooltip, items } = useSyncQueueStatus()
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.error
  const statusDotClass = config.dotClass
  const StatusIcon = config.Icon

  const { formattedLastSync, refresh, isLoading } = useDataSyncStatus()

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b border-kumo-line bg-kumo-base">
      <Input
        type="text"
        placeholder="Filter bookmarks..."
        value={(table.getState().globalFilter as string | undefined) ?? ''}
        onChange={event => table.setGlobalFilter(event.target.value)}
        className="max-w-sm"
      />

      <div className="flex items-center gap-0.5">
        {dirtyRowsCount > 0 && saveMode === 'manual' && (
          <Button onClick={onCommitChanges} variant="primary">
            <div className="flex items-center gap-2">
              <FloppyDiskIcon className="w-4 h-4" />
              Save {dirtyRowsCount}
            </div>
          </Button>
        )}

        <span className="relative inline-flex">
          <Popover>
            <TooltipProvider>
              <Tooltip content={tooltip} asChild>
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

        <TooltipProvider>
          <Tooltip content={`Refresh · ${formattedLastSync}`} asChild>
            <Button
              variant="ghost"
              shape="square"
              aria-label="Refresh bookmarks from server"
              onClick={refresh}
            >
              {isLoading ? (
                <Loader size="sm" />
              ) : (
                <ArrowClockwiseIcon weight="bold" className="w-4 h-4" aria-hidden="true" />
              )}
            </Button>
          </Tooltip>
        </TooltipProvider>

        <Popover>
          <Popover.Trigger asChild>
            <Button variant="ghost" shape="square" aria-label="Choose columns">
              <ListChecksIcon weight="bold" className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Popover.Trigger>
          <Popover.Content className="w-48 p-3" side="bottom">
            <Popover.Title className="text-sm font-semibold">Columns</Popover.Title>
            <Checkbox.Group legend="" className="mt-2">
              {table.getAllLeafColumns().map((column: Column<TData, unknown>) => (
                <Checkbox.Item
                  key={column.id}
                  value={column.id}
                  label={column.id.replace('_', ' ')}
                  checked={column.getIsVisible()}
                  onCheckedChange={() => column.toggleVisibility()}
                />
              ))}
            </Checkbox.Group>
          </Popover.Content>
        </Popover>

        <Tabs
          tabs={[
            { value: 'instant', label: 'Instant' },
            { value: 'manual', label: 'Manual' },
          ]}
          selectedValue={saveMode}
          onValueChange={v => setSaveMode(v as 'instant' | 'manual')}
        />
      </div>
    </div>
  )
}
