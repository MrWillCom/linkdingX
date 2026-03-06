import { db } from '@/utils/db'
import { storage, defineBackground } from '#imports'
import { toast } from '@heroui/react'

interface Account {
  server: string
  apiToken: string
}

const accountStorage = storage.defineItem<Account>('local:account')

async function processSyncQueue() {
  console.log('Syncing starting...')
  const account = await accountStorage.getValue()
  if (!account?.server || !account?.apiToken) return

  const operations = await db.sync_queue.toArray()
  for (const op of operations) {
    try {
      let url = `${account.server}/api/bookmarks/${op.bookmark_id}/`
      let method = ''
      let body: string | undefined

      if (op.action === 'update') {
        method = 'PATCH'
        body = JSON.stringify(op.payload)
      } else if (op.action === 'delete') {
        method = 'DELETE'
      }

      if (method) {
        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Token ${account.apiToken}`,
            'Content-Type': 'application/json',
          },
          body,
        })

        const isDeletedOnServer =
          response.status === 404 || response.status === 410
        const isSuccess =
          response.ok || (op.action === 'delete' && isDeletedOnServer)

        if (isSuccess) {
          await db.sync_queue.delete(op.id!)
          if (op.action === 'update' && response.ok) {
            await db.bookmarks.update(op.bookmark_id, {
              _sync_status: 'synced',
            })
          }
        } else {
          console.error(
            `Sync failed for ${op.action} on bookmark ${op.bookmark_id}:`,
            {
              status: response.status,
              statusText: response.statusText,
              operation: op,
            },
          )

          toast.danger(`Failed to sync ${op.action}`, {
            description: `Server returned ${response.status}: ${response.statusText}`,
          })
        }
      }
    } catch (error) {
      console.error('Failed to sync operation:', op, error)
      toast.danger(`Network error during sync`, {
        description: error instanceof Error ? error.message : String(error),
      })
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
      fetch(url, options)
        .then(response => {
          return response.json().then(data => ({
            ok: response.ok,
            status: response.status,
            data,
          }))
        })
        .then(sendResponse)
        .catch(error => {
          sendResponse({ ok: false, error: error.message })
        })
      return true
    }
    if (message.type === 'api-patch') {
      const { url, data: patchData, options } = message
      const fetchOptions: RequestInit = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(patchData),
      }
      fetch(url, fetchOptions)
        .then(response => {
          return response.json().then(data => ({
            ok: response.ok,
            status: response.status,
            data,
          }))
        })
        .then(sendResponse)
        .catch(error => {
          sendResponse({ ok: false, error: error.message })
        })
      return true
    }
    if (message.type === 'api-post') {
      const { url, data: postData, options } = message
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(postData),
      }
      fetch(url, fetchOptions)
        .then(response => {
          return response.json().then(data => ({
            ok: response.ok,
            status: response.status,
            data,
          }))
        })
        .then(sendResponse)
        .catch(error => {
          sendResponse({ ok: false, error: error.message })
        })
      return true
    }
    if (message.type === 'api-delete') {
      const { url, options } = message
      const fetchOptions: RequestInit = {
        method: 'DELETE',
        ...options,
      }
      fetch(url, fetchOptions)
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
      return true
    }
  })
})
