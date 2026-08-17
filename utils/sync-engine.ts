import { db, type SyncOperation } from '@/utils/db'
import { serverStorage, apiTokenStorage, syncErrorStorage } from '@/utils/storage'
import { apiRequest } from '@/utils/api'

export interface SyncResult {
  processed: number
  succeeded: number
  failed: number
  errors: string[]
}

const EMPTY_RESULT: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] }

async function notifyUI(
  type: 'success' | 'danger' | 'warning',
  message: string,
  description?: string,
) {
  try {
    await browser.runtime.sendMessage({
      type: 'sync-notification',
      payload: { type, message, description },
    })
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Could not establish connection')) {
      console.warn('[sync-engine] notifyUI error:', error.message)
    }
  }
}

function dedupOps(operations: SyncOperation[]): Map<number, SyncOperation> {
  const latestOps = new Map<number, SyncOperation>()
  const sorted = [...operations].sort((a, b) => a.timestamp - b.timestamp)

  for (const op of sorted) {
    const existing = latestOps.get(op.bookmark_id)
    if (!existing) {
      latestOps.set(op.bookmark_id, { ...op, payload: { ...op.payload } })
      continue
    }

    if (op.action === 'delete' || existing.action === 'delete') {
      latestOps.set(op.bookmark_id, { ...op, payload: { ...op.payload } })
      continue
    }

    latestOps.set(op.bookmark_id, {
      ...op,
      payload: { ...existing.payload, ...op.payload },
    })
  }

  return latestOps
}

export async function process(): Promise<SyncResult> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) {
    await syncErrorStorage.setValue(true)
    return { ...EMPTY_RESULT, errors: ['Missing server or API token'] }
  }

  const operations = await db.sync_queue.toArray()
  if (operations.length === 0) return EMPTY_RESULT

  const latestOps = dedupOps(operations)
  const processedIds = new Set<number>()
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, errors: [] }

  for (const op of latestOps.values()) {
    result.processed++

    if (op.action === 'update') {
      const response = await apiRequest(
        'PATCH',
        `${server}/api/bookmarks/${op.bookmark_id}/`,
        op.payload,
      )

      if (response.ok) {
        await db.bookmarks.update(op.bookmark_id, {
          _sync_status: 'synced',
          _local_modified_at: '',
        })
        processedIds.add(op.bookmark_id)
        result.succeeded++
      } else {
        await db.bookmarks.update(op.bookmark_id, { _sync_status: 'error' })
        const detail =
          (response.data as Record<string, string> | undefined)?.detail ||
          response.error ||
          'Unknown error'
        const errorMsg = response.status ? `Server returned ${response.status}: ${detail}` : detail
        result.failed++
        result.errors.push(errorMsg)
        await notifyUI('danger', `Failed to sync ${op.action}`, errorMsg)
      }
    } else if (op.action === 'delete') {
      const response = await apiRequest('DELETE', `${server}/api/bookmarks/${op.bookmark_id}/`)

      const isDeletedOnServer = response.status === 404 || response.status === 410
      const isSuccess = response.ok || isDeletedOnServer

      if (isSuccess) {
        await db.bookmarks.delete(op.bookmark_id)
        processedIds.add(op.bookmark_id)
        result.succeeded++
      } else {
        await db.bookmarks.update(op.bookmark_id, { _sync_status: 'error' })
        const detail =
          (response.data as Record<string, string> | undefined)?.detail ||
          response.error ||
          'Unknown error'
        const errorMsg = response.status ? `Server returned ${response.status}: ${detail}` : detail
        result.failed++
        result.errors.push(errorMsg)
        await notifyUI('danger', `Failed to sync ${op.action}`, errorMsg)
      }
    }
  }

  for (const op of operations) {
    if (processedIds.has(op.bookmark_id)) {
      await db.sync_queue.delete(op.id!)
    }
  }

  if (result.failed > 0) {
    await syncErrorStorage.setValue(true)
  } else {
    const remaining = await db.sync_queue.count()
    if (remaining === 0) {
      await syncErrorStorage.setValue(false)
    }
  }

  return result
}

export async function expireStale(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = Date.now() - maxAgeMs
  const stale = await db.sync_queue.where('timestamp').below(cutoff).toArray()
  for (const op of stale) {
    await db.bookmarks.update(op.bookmark_id, { _sync_status: 'error' })
    await db.sync_queue.delete(op.id!)
  }
  if (stale.length > 0) {
    await notifyUI(
      'warning',
      `${stale.length} sync operation${stale.length > 1 ? 's' : ''} expired`,
      'These changes could not be synced within 24 hours.',
    )
  }
  return stale.length
}
