import { db } from './db'
import type { Bookmark } from '@/utils/types'

export const bookmarkService = {
  async toggleUnread(id: number, currentUnread: boolean) {
    const newUnread = !currentUnread
    await db.bookmarks.update(id, {
      unread: newUnread,
      _sync_status: 'pending',
      _local_modified_at: new Date().toISOString(),
    })
    await db.sync_queue.add({
      action: 'update',
      bookmark_id: id,
      payload: { unread: newUnread },
      timestamp: Date.now(),
    })
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async deleteBookmark(id: number) {
    await db.bookmarks.update(id, {
      _sync_status: 'pending',
      _local_modified_at: new Date().toISOString(),
    })
    await db.sync_queue.add({
      action: 'delete',
      bookmark_id: id,
      payload: {},
      timestamp: Date.now(),
    })
    await db.bookmarks.delete(id)
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async addBookmark(bookmark: Bookmark) {
    await db.bookmarks.add({ ...bookmark, _sync_status: 'synced' })
  },
}
