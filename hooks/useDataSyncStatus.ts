import { useEffect, useState } from 'react'
import { lastSyncTimestampStorage } from '@/utils/storage'

export function useDataSyncStatus() {
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadState = async () => {
      const timestamp = await lastSyncTimestampStorage.getValue()

      if (isActive) {
        setLastSyncTimestamp(timestamp || 0)
        setIsLoading(false)
      }
    }

    loadState()

    const unwatchTimestamp = lastSyncTimestampStorage.watch(value => {
      if (isActive) setLastSyncTimestamp(value)
    })

    return () => {
      isActive = false
      unwatchTimestamp()
    }
  }, [])

  const refresh = async () => {
    setIsLoading(true)
    try {
      await browser.runtime.sendMessage({ type: 'check-updates' })
      setIsLoading(false)
    } catch (error) {
      console.warn('[useDataSyncStatus] Failed to check for updates:', error)
      setIsLoading(false)
    }
  }

  const formatLastSync = (timestamp: number): string => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60 * 1000) return 'Just now'
    if (diff < 2 * 60 * 1000) return '1 min ago'
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} min ago`
    if (diff < 2 * 60 * 60 * 1000) return '1 hour ago'
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} hours ago`

    return new Date(timestamp).toLocaleDateString()
  }

  return {
    lastSyncTimestamp,
    isLoading,
    formattedLastSync: formatLastSync(lastSyncTimestamp),
    refresh,
  }
}
