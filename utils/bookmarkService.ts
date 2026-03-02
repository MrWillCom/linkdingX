import { db } from './db'
import type { Bookmark } from '@/components/BookmarksList'

export const bookmarkService = {
  async toggleUnread(id: number, currentUnread: boolean) {
    const newUnread = !currentUnread
    await db.bookmarks.update(id, {
      unread: newUnread,
      _sync_status: 'pending',
    })
    await db.sync_queue.add({
      action: 'update',
      bookmark_id: id,
      payload: { unread: newUnread },
      timestamp: Date.now(),
    })
    // Trigger background sync
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async deleteBookmark(id: number) {
    await db.bookmarks.delete(id)
    await db.sync_queue.add({
      action: 'delete',
      bookmark_id: id,
      payload: {},
      timestamp: Date.now(),
    })
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async addBookmark(bookmark: Bookmark) {
    await db.bookmarks.add({ ...bookmark, _sync_status: 'synced' })
  },
}
