export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  })
})
