import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  flexRender,
} from '@tanstack/react-table'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookIcon, TrayArrowDownIcon, TrayArrowUpIcon, PlusIcon } from '@phosphor-icons/react'
import { Input, Button, Badge, Table, Loader } from '@cloudflare/kumo'
import { bookmarkService } from '@/utils/bookmarkService'
import { db, type SyncOperation } from '@/utils/db'
import type { Bookmark as BookmarkType } from '@/utils/types'
import { serverStorage, fetchLimitStorage } from '@/utils/storage'
import { ManagerToolbar } from './ManagerToolbar'
import { ManagerBulkActions } from './ManagerBulkActions'

type SaveMode = 'instant' | 'manual'

type DirtyState = {
  [id: number]: Partial<BookmarkType>
}

function ManagerTable() {
  const [saveMode, setSaveMode] = useState<SaveMode>('instant')
  const [dirtyRows, setDirtyRows] = useState<DirtyState>({})
  const [dateStamp, setDateStamp] = useState(Date.now())

  const columnHelper = createColumnHelper<BookmarkType>()

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: info => (
          <EditableCell
            value={info.getValue() || ''}
            onChange={value => handleCellChange(info.row.original.id, 'title', value)}
            onBlur={() => handleCellBlur(info.row.original.id, 'title')}
            dirty={'title' in (dirtyRows[info.row.original.id] || {})}
          />
        ),
      }),
      columnHelper.accessor('url', {
        header: 'URL',
        cell: info => (
          <EditableCell
            value={info.getValue() || ''}
            onChange={value => handleCellChange(info.row.original.id, 'url', value)}
            onBlur={() => handleCellBlur(info.row.original.id, 'url')}
            dirty={'url' in (dirtyRows[info.row.original.id] || {})}
          />
        ),
      }),
      columnHelper.accessor('tag_names', {
        header: 'Tags',
        cell: info => {
          const tags = info.getValue() || []
          return (
            <div className="flex flex-wrap gap-1">
              {tags.length > 0 ? (
                tags.map(tag => <Badge key={tag}>{tag}</Badge>)
              ) : (
                <span className="text-kumo-subtle text-xs">No tags</span>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('unread', {
        header: 'Unread',
        cell: info => (
          <Button
            variant={info.getValue() ? 'primary' : 'ghost'}
            shape="square"
            onClick={() => handleToggleUnread(info.row.original.id, info.getValue())}
            aria-label={info.getValue() ? 'Mark as read' : 'Mark as unread'}
          >
            <BookIcon weight="bold" />
          </Button>
        ),
      }),
      columnHelper.accessor('is_archived', {
        header: 'Archived',
        cell: info => (
          <Button
            variant={info.getValue() ? 'primary' : 'secondary'}
            shape="square"
            onClick={() => handleToggleArchive(info.row.original.id, info.getValue())}
            aria-label={info.getValue() ? 'Unarchive' : 'Archive'}
          >
            {info.getValue() ? (
              <TrayArrowUpIcon weight="bold" />
            ) : (
              <TrayArrowDownIcon weight="bold" />
            )}
          </Button>
        ),
      }),
      columnHelper.accessor('date_added', {
        header: 'Date Added',
        cell: info => (
          <span className="text-sm text-kumo-subtle">
            {new Date(info.getValue()).toISOString().split('T')[0]}
          </span>
        ),
      }),
    ],
    [dirtyRows],
  )

  const allBookmarks = useLiveQuery(
    () => db.bookmarks.orderBy('date_added').reverse().toArray(),
    [],
  )

  const pendingDeletions = useLiveQuery(
    () => db.sync_queue.where('action').equals('delete').toArray(),
    [],
  )

  const [syncQueueTimestamp, setSyncQueueTimestamp] = useState(Date.now())

  useEffect(() => {
    if (pendingDeletions && pendingDeletions.length > 0) {
      setSyncQueueTimestamp(Date.now())
    }
  }, [pendingDeletions])

  const bookmarks = useMemo(() => {
    if (!allBookmarks) return []
    const deletionIds = new Set((pendingDeletions || []).map(op => op.bookmark_id))
    return allBookmarks?.filter(b => !deletionIds.has(b.id)) || []
  }, [allBookmarks, pendingDeletions, dateStamp, syncQueueTimestamp])

  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  const selectedIds = useMemo(() => Object.keys(rowSelection).map(id => Number(id)), [rowSelection])

  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const handleLoadMore = useCallback(async () => {
    const server = await serverStorage.getValue()
    if (!server) return

    const fetchLimit = (await fetchLimitStorage.getValue()) ?? 50
    setIsLoadingMore(true)

    const currentBookmarks = await db.bookmarks.orderBy('date_added').reverse().toArray()
    const offset = currentBookmarks.filter(b => {
      return !(pendingDeletions || []).map(op => op.bookmark_id).includes(b.id)
    }).length

    try {
      const response = await browser.runtime.sendMessage({
        type: 'api-request',
        url: `${server}/api/bookmarks/?limit=${fetchLimit}&offset=${offset}`,
      })

      if (response.ok && response.data.results) {
        const newBookmarks = response.data.results as BookmarkType[]
        if (newBookmarks.length === 0 && offset > 0) {
          setHasMore(false)
        } else if (newBookmarks.length > 0) {
          await db.bookmarks.bulkPut(newBookmarks)
        }
      }
    } catch (error) {
      console.error('Failed to load more bookmarks:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [pendingDeletions])

  const table = useReactTable({
    data: bookmarks,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleCellChange = (id: number, field: string, value: string) => {
    setDirtyRows(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const handleCellBlur = (id: number, field: string) => {
    if (saveMode === 'instant') {
      const value = (dirtyRows[id] as Record<string, string>)?.[field]
      if (value !== undefined) {
        bookmarkService.updateBookmark(id, { [field]: value })
        setDirtyRows(prev => {
          const updated = { ...prev }
          delete updated[id]
          return updated
        })
      }
    }
  }

  const commitChanges = () => {
    Object.entries(dirtyRows).forEach(([id, changes]) => {
      bookmarkService.updateBookmark(Number(id), changes)
    })
    setDirtyRows({})
  }

  const handleToggleUnread = (id: number, currentUnread: boolean) => {
    bookmarkService.toggleUnread(id, currentUnread)
  }

  const handleToggleArchive = (id: number, currentArchived: boolean) => {
    bookmarkService.toggleArchive(id, currentArchived)
  }

  const mutate = () => {
    setDirtyRows({})
    setDateStamp(Date.now())
  }

  return (
    <div className="min-h-screen bg-kumo-base">
      <ManagerToolbar
        table={table}
        dirtyRowsCount={Object.keys(dirtyRows).length}
        saveMode={saveMode}
        setSaveMode={setSaveMode}
        onCommitChanges={commitChanges}
      />

      <Table>
        <Table.Header>
          {table.getHeaderGroups().map(headerGroup => (
            <Table.Row key={headerGroup.id}>
              <Table.Head className="w-12" />
              {headerGroup.headers.map(header => (
                <Table.Head key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Table.Head>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map(row => (
            <Table.Row key={row.id} variant={row.getIsSelected() ? 'selected' : 'default'}>
              <Table.CheckCell
                checked={row.getIsSelected()}
                onValueChange={row.getToggleSelectedHandler()}
                aria-label={`Select row ${row.index}`}
              />
              {row.getVisibleCells().map(cell => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <div className="py-4 flex flex-col items-center gap-4">
        {isLoadingMore && <Loader size="sm" />}
        {!isLoadingMore && hasMore && (
          <Button variant="ghost" onClick={handleLoadMore}>
            Load More
          </Button>
        )}
      </div>

      <ManagerBulkActions
        selectedIds={selectedIds}
        onClearSelection={() => table.resetRowSelection()}
        onMutate={mutate}
      />
    </div>
  )
}

function EditableCell({
  value,
  onChange,
  onBlur,
  dirty,
}: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  dirty: boolean
}) {
  const [localValue, setLocalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value)
    }
  }, [value, isFocused])

  return (
    <Input
      value={localValue}
      onChange={e => {
        setLocalValue(e.target.value)
        onChange(e.target.value)
      }}
      onBlur={() => {
        setIsFocused(false)
        onBlur()
      }}
      onFocus={() => setIsFocused(true)}
      className={`w-full ${dirty ? 'border-l-2 border-l-kumo-attention' : ''}`}
    />
  )
}

export default ManagerTable
