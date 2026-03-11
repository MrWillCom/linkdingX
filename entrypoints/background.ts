import { db } from '@/utils/db'
import { storage, defineBackground } from '#imports'

const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

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
  } catch (e) {
    // UI might not be open, which is fine
    console.debug('Could not send notification to UI (likely closed):', e)
  }
}

async function processSyncQueue() {
  console.log('Syncing starting...')
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) {
    console.warn('Sync skipped: Missing server or API token', {
      server: !!server,
      apiToken: !!apiToken,
    })
    return
  }

  const operations = await db.sync_queue.toArray()
  if (operations.length === 0) {
    console.log('Sync skipped: Queue is empty')
    return
  }

  for (const op of operations) {
    try {
      let url = `${server}/api/bookmarks/${op.bookmark_id}/`
      let method = ''
      let body: string | undefined

      if (op.action === 'update') {
        method = 'PATCH'
        body = JSON.stringify(op.payload)
      } else if (op.action === 'delete') {
        method = 'DELETE'
      }

      if (method) {
        console.log(`Executing ${op.action} for bookmark ${op.bookmark_id}...`)
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Token ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body,
        })

        const isDeletedOnServer =
          response.status === 404 || response.status === 410
        const isSuccess =
          response.ok || (op.action === 'delete' && isDeletedOnServer)

        if (isSuccess) {
          console.log(`Successfully synced ${op.action} for ${op.bookmark_id}`)
          await db.sync_queue.delete(op.id!)
          if (op.action === 'update' && response.ok) {
            await db.bookmarks.update(op.bookmark_id, {
              _sync_status: 'synced',
            })
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.detail || response.statusText
          console.error(
            `Sync failed for ${op.action} on bookmark ${op.bookmark_id}:`,
            {
              status: response.status,
              statusText: response.statusText,
              detail: errorMessage,
              operation: op,
            },
          )

          await notifyUI(
            'danger',
            `Failed to sync ${op.action}`,
            `Server returned ${response.status}: ${errorMessage}`,
          )
        }
      }
    } catch (error) {
      console.error('Failed to sync operation:', op, error)
      await notifyUI(
        'danger',
        `Network error during sync`,
        error instanceof Error ? error.message : String(error),
      )
    }
  }
}

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'sync-request') {
      processSyncQueue()
        .then(() => sendResponse({ ok: true }))
        .catch(error => sendResponse({ ok: false, error: error.message }))
      return true
    }
    if (message.type === 'api-request') {
      const { url, options } = message
      Promise.all([serverStorage.getValue(), apiTokenStorage.getValue()]).then(
        ([server, apiToken]) => {
          if (!server || !apiToken) {
            sendResponse({ ok: false, error: 'Missing server or API token' })
            return
          }

          const fullUrl = url.startsWith('http') ? url : `${server}${url}`
          const fetchOptions: RequestInit = {
            ...options,
            headers: {
              Authorization: `Token ${apiToken}`,
              'Content-Type': 'application/json',
              ...options?.headers,
            },
          }

          fetch(fullUrl, fetchOptions)
            .then(response => {
              return response
                .json()
                .catch(() => ({}))
                .then(data => ({
                  ok: response.ok,
                  status: response.status,
                  data,
                }))
            })
            .then(sendResponse)
            .catch(error => {
              sendResponse({ ok: false, error: error.message })
            })
        },
      )
      return true
    }
    if (message.type === 'api-patch') {
      const { url, data: patchData, options } = message
      Promise.all([serverStorage.getValue(), apiTokenStorage.getValue()]).then(
        ([server, apiToken]) => {
          if (!server || !apiToken) {
            sendResponse({ ok: false, error: 'Missing server or API token' })
            return
          }

          const fullUrl = url.startsWith('http') ? url : `${server}${url}`
          const fetchOptions: RequestInit = {
            method: 'PATCH',
            ...options,
            headers: {
              Authorization: `Token ${apiToken}`,
              'Content-Type': 'application/json',
              ...options?.headers,
            },
            body: JSON.stringify(patchData),
          }

          fetch(fullUrl, fetchOptions)
            .then(response => {
              return response
                .json()
                .catch(() => ({}))
                .then(data => ({
                  ok: response.ok,
                  status: response.status,
                  data,
                }))
            })
            .then(sendResponse)
            .catch(error => {
              sendResponse({ ok: false, error: error.message })
            })
        },
      )
      return true
    }
    if (message.type === 'api-post') {
      const { url, data: postData, options } = message
      Promise.all([serverStorage.getValue(), apiTokenStorage.getValue()]).then(
        ([server, apiToken]) => {
          if (!server || !apiToken) {
            sendResponse({ ok: false, error: 'Missing server or API token' })
            return
          }

          const fullUrl = url.startsWith('http') ? url : `${server}${url}`
          const fetchOptions: RequestInit = {
            method: 'POST',
            ...options,
            headers: {
              Authorization: `Token ${apiToken}`,
              'Content-Type': 'application/json',
              ...options?.headers,
            },
            body: JSON.stringify(postData),
          }

          fetch(fullUrl, fetchOptions)
            .then(response => {
              return response
                .json()
                .catch(() => ({}))
                .then(data => ({
                  ok: response.ok,
                  status: response.status,
                  data,
                }))
            })
            .then(sendResponse)
            .catch(error => {
              sendResponse({ ok: false, error: error.message })
            })
        },
      )
      return true
    }
    if (message.type === 'api-delete') {
      const { url, options } = message
      Promise.all([serverStorage.getValue(), apiTokenStorage.getValue()]).then(
        ([server, apiToken]) => {
          if (!server || !apiToken) {
            sendResponse({ ok: false, error: 'Missing server or API token' })
            return
          }

          const fullUrl = url.startsWith('http') ? url : `${server}${url}`
          const fetchOptions: RequestInit = {
            method: 'DELETE',
            ...options,
            headers: {
              Authorization: `Token ${apiToken}`,
              'Content-Type': 'application/json',
              ...options?.headers,
            },
          }

          fetch(fullUrl, fetchOptions)
            .then(response => {
              return response
                .json()
                .catch(() => ({}))
                .then(data => ({
                  ok: response.ok,
                  status: response.status,
                  data,
                }))
            })
            .then(sendResponse)
            .catch(error => {
              sendResponse({ ok: false, error: error.message })
            })
        },
      )
      return true
    }
  })
})
