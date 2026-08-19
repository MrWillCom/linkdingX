import { apiRequest } from '@/utils/api'
import { process as processSyncQueue, expireStale } from '@/utils/sync-engine'
import { serverStorage } from '@/utils/storage'
import { defineBackground } from '#imports'

let syncInProgress = false
let needsResync = false

async function processQueueWithMutex() {
  if (syncInProgress) {
    needsResync = true
    return
  }
  syncInProgress = true
  try {
    do {
      needsResync = false
      await processSyncQueue()
    } while (needsResync)
  } finally {
    try {
      await expireStale()
    } catch (error) {
      console.warn('[background] expireStale error:', error)
    }
    syncInProgress = false
  }
}

export default defineBackground(() => {
  try {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  } catch {
    // sidePanel API not available (Firefox)
  }

  globalThis.addEventListener('online', () => {
    processQueueWithMutex().catch(error => {
      console.warn('[background] sync error:', error)
    })
  })

  browser.alarms.create('sync-retry', { periodInMinutes: 5 })
  browser.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'sync-retry') {
      processQueueWithMutex().catch(error => {
        console.warn('[background] sync error:', error)
      })
    }
  })

  browser.runtime.onMessage.addListener(
    (
      message: {
        type: string
        url?: string
        data?: unknown
        options?: { headers?: Record<string, string> }
      },
      _sender,
      sendResponse,
    ) => {
      const { type, url, data, options } = message

      if (type === 'get-server-url') {
        serverStorage.getValue().then(server => sendResponse({ ok: true, server }))
        return true
      }

      if (type === 'sync-request') {
        processQueueWithMutex()
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
        apiRequest(methodMap[type], url, data, options)
          .then(sendResponse)
          .catch(error =>
            sendResponse({
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          )
        return true
      }
    },
  )
})
