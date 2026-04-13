import { db } from './db'
import type { Bookmark, UpdatePayload } from '@/utils/types'

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
      _sync_status: 'pending_delete',
      _local_modified_at: new Date().toISOString(),
    })
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

  async toggleArchive(id: number, currentArchived: boolean) {
    const newArchived = !currentArchived
    await db.bookmarks.update(id, {
      is_archived: newArchived,
      _sync_status: 'pending',
      _local_modified_at: new Date().toISOString(),
    })
    await db.sync_queue.add({
      action: 'update',
      bookmark_id: id,
      payload: { is_archived: newArchived },
      timestamp: Date.now(),
    })
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async updateBookmark(id: number, payload: UpdatePayload) {
    const { _sync_status: _1, _local_modified_at: _2, ...cleanPayload } = payload
    await db.bookmarks.update(id, {
      ...cleanPayload,
      _sync_status: 'pending',
      _local_modified_at: new Date().toISOString(),
    })
    await db.sync_queue.add({
      action: 'update',
      bookmark_id: id,
      payload: cleanPayload,
      timestamp: Date.now(),
    })
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async bulkUpdateBookmarks(ids: number[], payload: UpdatePayload) {
    const existingBookmarks = await db.bookmarks.where('id').anyOf(ids).toArray()
    const filteredPayload: Partial<Record<string, unknown>> = {}
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) filteredPayload[key] = value
    })
    const updates = existingBookmarks.map(bookmark => ({
      ...bookmark,
      ...filteredPayload,
      _sync_status: 'pending' as const,
      _local_modified_at: new Date().toISOString(),
    }))
    await db.bookmarks.bulkPut(updates)
    const queueItems = updates.map(update => ({
      action: 'update' as const,
      bookmark_id: update.id,
      payload: filteredPayload,
      timestamp: Date.now(),
    }))
    await db.sync_queue.bulkAdd(queueItems)
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async bulkDeleteBookmarks(ids: number[]) {
    const existingBookmarks = await db.bookmarks.where('id').anyOf(ids).toArray()
    const foundIds = new Set(existingBookmarks.map(bookmark => bookmark.id))
    const notFoundIds = ids.filter(id => !foundIds.has(id))
    if (notFoundIds.length > 0) {
      console.warn(`bulkDeleteBookmarks: IDs not found:`, notFoundIds)
    }
    const updates = existingBookmarks.map(bookmark => ({
      ...bookmark,
      _sync_status: 'pending_delete' as const,
      _local_modified_at: new Date().toISOString(),
    }))
    await db.bookmarks.bulkPut(updates)
    const queueItems = updates.map(update => ({
      action: 'delete' as const,
      bookmark_id: update.id,
      payload: {},
      timestamp: Date.now(),
    }))
    await db.sync_queue.bulkAdd(queueItems)
    browser.runtime.sendMessage({ type: 'sync-request' })
  },
}
