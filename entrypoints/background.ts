import { db } from '@/utils/db'

async function processSyncQueue() {
  const operations = await db.sync_queue.toArray()
  const server = await storage.getItem<string>('local:server')
  const apiToken = await storage.getItem<string>('local:apiToken')

  if (!server || !apiToken) return

  for (const op of operations) {
    try {
      let response
      if (op.action === 'update') {
        response = await fetch(`${server}/api/bookmarks/${op.bookmark_id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${apiToken}`,
          },
          body: JSON.stringify(op.payload),
        })
      } else if (op.action === 'delete') {
        response = await fetch(`${server}/api/bookmarks/${op.bookmark_id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${apiToken}`,
          },
        })
      }

      if (response && response.ok) {
        if (op.id !== undefined) {
          await db.sync_queue.delete(op.id)
        }
        await db.bookmarks.update(op.bookmark_id, { _sync_status: 'synced' })
      }
    } catch (error) {
      console.error('Sync failed for operation:', op, error)
    }
  }
}

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'sync-request') {
      processSyncQueue()
      return false
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
