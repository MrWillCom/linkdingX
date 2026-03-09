import { useEffect } from 'react'
import { toast } from '@heroui/react'

export function useSyncNotifications() {
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'sync-notification') {
        const { type, message: title, description } = message.payload

        if (type === 'danger') {
          toast.danger(title, { description })
        } else if (type === 'success') {
          toast.success(title, { description })
        } else if (type === 'warning') {
          toast.warning(title, { description })
        }
      }
    }

    browser.runtime.onMessage.addListener(handleMessage)
    return () => browser.runtime.onMessage.removeListener(handleMessage)
  }, [])
}
