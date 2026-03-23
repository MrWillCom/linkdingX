import Dexie, { type EntityTable } from 'dexie'
import type { Bookmark } from '@/components/BookmarksList'

export interface SyncOperation {
  id?: number
  action: 'create' | 'update' | 'delete'
  bookmark_id: number
  payload: Partial<Bookmark>
  timestamp: number
}

const db = new Dexie('LinkdingDB') as Dexie & {
  bookmarks: EntityTable<Bookmark & { _sync_status?: string; _local_modified_at?: string }, 'id'>
  sync_queue: EntityTable<SyncOperation, 'id'>
}

db.version(1).stores({
  bookmarks: 'id, url, unread, date_added, _sync_status, _local_modified_at',
  sync_queue: '++id, bookmark_id, action',
})

export { db }
