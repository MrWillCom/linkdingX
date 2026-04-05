import { db } from '@/utils/db'
import { serverStorage, apiTokenStorage, syncErrorStorage } from '@/utils/storage'
import { defineBackground } from '#imports'

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
      console.warn('[notifyUI] Unexpected error:', error.message)
    }
  }
}

async function processSyncQueue() {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) return

  const operations = await db.sync_queue.toArray()
  if (operations.length === 0) return

  await Promise.all(
    operations.map(async op => {
      const url = `${server}/api/bookmarks/${op.bookmark_id}/`
      let method = ''
      let body: string | undefined

      if (op.action === 'update') {
        method = 'PATCH'
        body = JSON.stringify(op.payload)
      } else if (op.action === 'delete') {
        method = 'DELETE'
      }

      if (!method) return null

      try {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Token ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body,
        })

        const isDeletedOnServer = response.status === 404 || response.status === 410
        const isSuccess = response.ok || (op.action === 'delete' && isDeletedOnServer)

        if (isSuccess) {
          await db.sync_queue.delete(op.id!)
          if (op.action === 'update' && response.ok) {
            await db.bookmarks.update(op.bookmark_id, {
              _sync_status: 'synced',
            })
          }
          if (op.action === 'delete') {
            await db.bookmarks.delete(op.bookmark_id)
          }
        } else {
          await syncErrorStorage.setValue(true)
          let errorDetail = response.statusText
          try {
            const errorData = await response.json()
            if (errorData?.detail) errorDetail = errorData.detail
          } catch {
            // Response body may not be JSON
          }
          await notifyUI(
            'danger',
            `Failed to sync ${op.action}`,
            `Server returned ${response.status}: ${errorDetail}`,
          )
        }
      } catch (error) {
        await syncErrorStorage.setValue(true)
        await notifyUI(
          'danger',
          `Network error during sync`,
          error instanceof Error ? error.message : String(error),
        )
      }
    }),
  )

  const remaining = await db.sync_queue.count()
  if (remaining === 0) {
    await syncErrorStorage.setValue(false)
  }
}

type MessageType = 'sync-request' | 'api-request' | 'api-patch' | 'api-post' | 'api-delete'

interface ApiMessage {
  type: MessageType
  url?: string
  data?: unknown
  options?: RequestInit & { headers?: Record<string, string> }
}

async function handleApiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: RequestInit & { headers?: Record<string, string> },
) {
  const [server, apiToken] = await Promise.all([
    serverStorage.getValue(),
    apiTokenStorage.getValue(),
  ])

  if (!server || !apiToken) {
    return { ok: false, error: 'Missing server or API token' }
  }

  const fullUrl = url.startsWith('http') ? url : `${server}${url}`
  const fetchOptions: RequestInit = {
    method,
    ...options,
    headers: {
      Authorization: `Token ${apiToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  }

  try {
    const response = await fetch(fullUrl, fetchOptions)
    let responseData: unknown
    try {
      responseData = await response.json()
    } catch {
      responseData = {}
    }
    return { ok: response.ok, status: response.status, data: responseData }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

  browser.runtime.onMessage.addListener((message: ApiMessage, _sender, sendResponse) => {
    const { type, url, data, options } = message

    if (type === 'sync-request') {
      processSyncQueue()
        .then(() => sendResponse({ ok: true }))
        .catch(error =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        )
      return true
    }

    const methodMap: Record<string, string> = {
      'api-request': 'GET',
      'api-patch': 'PATCH',
      'api-post': 'POST',
      'api-delete': 'DELETE',
    }

    if (methodMap[type] && url) {
      handleApiRequest(methodMap[type], url, data, options)
        .then(sendResponse)
        .catch(error =>
          sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        )
      return true
    }
  })
})
