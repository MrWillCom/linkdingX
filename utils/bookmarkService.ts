import { db } from './db'
import type { Bookmark } from '@/utils/types'

export const bookmarkService = {
  async toggleUnread(id: number, currentUnread: boolean) {
    const newUnread = !currentUnread
    const timestamp = Date.now()
    await db.transaction('rw', [db.bookmarks, db.sync_queue], async () => {
      await db.bookmarks.update(id, {
        unread: newUnread,
        _sync_status: 'pending',
        _local_modified_at: new Date().toISOString(),
      })
      await db.sync_queue.add({
        action: 'update',
        bookmark_id: id,
        payload: { unread: newUnread },
        timestamp,
      })
    })
    browser.runtime.sendMessage({ type: 'sync-request' }).catch(() => {})
  },

  async deleteBookmark(id: number) {
    const timestamp = Date.now()
    await db.transaction('rw', [db.bookmarks, db.sync_queue], async () => {
      await db.bookmarks.update(id, {
        _sync_status: 'pending_delete',
        _local_modified_at: new Date().toISOString(),
      })
      await db.sync_queue.add({
        action: 'delete',
        bookmark_id: id,
        payload: {},
        timestamp,
      })
    })
    browser.runtime.sendMessage({ type: 'sync-request' }).catch(() => {})
  },

  async addBookmark(bookmark: Bookmark) {
    await db.bookmarks.put({ ...bookmark, _sync_status: 'synced', _local_modified_at: '' })
  },

  async toggleArchive(id: number, currentArchived: boolean) {
    const newArchived = !currentArchived
    const timestamp = Date.now()
    await db.transaction('rw', [db.bookmarks, db.sync_queue], async () => {
      await db.bookmarks.update(id, {
        is_archived: newArchived,
        _sync_status: 'pending',
        _local_modified_at: new Date().toISOString(),
      })
      await db.sync_queue.add({
        action: 'update',
        bookmark_id: id,
        payload: { is_archived: newArchived },
        timestamp,
      })
    })
    browser.runtime.sendMessage({ type: 'sync-request' }).catch(() => {})
  },
}
