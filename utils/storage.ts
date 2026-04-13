import { storage } from '#imports'

export type MetadataSource = 'browser' | 'server'

export const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

export const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

export const syncErrorStorage = storage.defineItem<boolean>('local:syncError', {
  fallback: false,
})

export const fetchMetadataFromStorage = storage.defineItem<MetadataSource>(
  'local:fetchMetadataFrom',
  {
    fallback: 'browser',
  },
)

export const defaultUnreadStorage = storage.defineItem<boolean>('local:defaultUnread', {
  fallback: true,
})

export const fetchLimitStorage = storage.defineItem<number>('local:fetchLimit', {
  fallback: 50,
})

export const lastSyncTimestampStorage = storage.defineItem<number>('local:lastSyncTimestamp', {
  fallback: 0,
})
