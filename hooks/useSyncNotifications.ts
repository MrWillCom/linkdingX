import { useEffect } from 'react'
import { useKumoToastManager } from '@cloudflare/kumo'

export function useSyncNotifications() {
  const toastManager = useKumoToastManager()

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'sync-notification') {
        const { type, message: title, description } = message.payload

        let variant: 'success' | 'error' | 'warning' | 'info' | 'default' =
          'default'
        if (type === 'danger') variant = 'error'
        else if (type === 'success') variant = 'success'
        else if (type === 'warning') variant = 'warning'
        else if (type === 'info') variant = 'info'

        toastManager.add({
          title,
          description,
          variant,
        })
      }
    }

    browser.runtime.onMessage.addListener(handleMessage)
    return () => browser.runtime.onMessage.removeListener(handleMessage)
  }, [toastManager])
}
