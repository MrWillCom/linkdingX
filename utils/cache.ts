import { db } from '@/utils/db'
import type { Bookmark } from '@/utils/types'

export async function hydrateBookmarks(serverBookmarks: Bookmark[]): Promise<void> {
  if (serverBookmarks.length === 0) return

  const pendingQueue = await db.sync_queue.toArray()
  const pendingIds = new Set(pendingQueue.map(op => op.bookmark_id))

  const localLocks = await db.bookmarks
    .where('_local_modified_at')
    .notEqual('')
    .or('_sync_status')
    .equals('pending')
    .toArray()
  const lockMap = new Map(localLocks.map(b => [b.id, b._local_modified_at!]))
  const pendingStatusIds = new Set(localLocks.map(b => b.id))

  const localKeys = await db.bookmarks.toCollection().primaryKeys()
  const existingIds = new Set(localKeys)

  const filtered = serverBookmarks.filter(serverBookmark => {
    if (!existingIds.has(serverBookmark.id)) {
      return true
    }

    if (pendingIds.has(serverBookmark.id)) return false
    if (pendingStatusIds.has(serverBookmark.id)) return false

    const localLockTime = lockMap.get(serverBookmark.id)
    if (localLockTime) {
      const serverTime = new Date(serverBookmark.date_modified).getTime()
      const lockTime = new Date(localLockTime).getTime()
      if (serverTime < lockTime) {
        return false
      }
    }
    return true
  })

  if (filtered.length === 0) return

  const toWrite = filtered.map(b => ({ ...b, _local_modified_at: '' as const }))
  await db.bookmarks.bulkPut(toWrite)
}

export async function clearBookmarks(): Promise<void> {
  await db.bookmarks.clear()
}

export async function clearSyncQueue(): Promise<void> {
  await db.sync_queue.clear()
  await db.bookmarks.where('_sync_status').equals('pending_delete').delete()
}

export async function clearAll(): Promise<void> {
  await db.bookmarks.clear()
  await db.sync_queue.clear()
}

export async function triggerRefetch(): Promise<void> {
  try {
    await browser.runtime.sendMessage({ type: 'refetch-request' })
  } catch {
    // No listeners (e.g., sidepanel closed)
  }
}
