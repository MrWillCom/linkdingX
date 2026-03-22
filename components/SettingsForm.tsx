'use client'

import {
  Button,
  Input,
  Radio,
  Dialog,
  Checkbox,
  Toasty,
  useKumoToastManager,
  Field,
  Label,
  Text,
} from '@cloudflare/kumo'
import { useEffect, useReducer, useState } from 'react'
import { useSetup, type MetadataSource } from '@/hooks/useSetup'
import { db } from '@/utils/db'

interface SettingsState {
  isLoading: boolean
  server: string
  apiToken: string
  fetchMetadataFrom: MetadataSource
  defaultUnread: boolean
  fetchLimit: number
  error: string
}

type SettingsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SERVER'; payload: string }
  | { type: 'SET_API_TOKEN'; payload: string }
  | { type: 'SET_METADATA_FROM'; payload: MetadataSource }
  | { type: 'SET_DEFAULT_UNREAD'; payload: boolean }
  | { type: 'SET_FETCH_LIMIT'; payload: number }
  | { type: 'SET_ERROR'; payload: string }
  | {
      type: 'RESET_FORM'
      payload: {
        server: string
        apiToken: string
        fetchMetadataFrom: MetadataSource
        defaultUnread: boolean
        fetchLimit: number
      }
    }

function settingsReducer(
  state: SettingsState,
  action: SettingsAction,
): SettingsState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_SERVER':
      return { ...state, server: action.payload }
    case 'SET_API_TOKEN':
      return { ...state, apiToken: action.payload }
    case 'SET_METADATA_FROM':
      return { ...state, fetchMetadataFrom: action.payload }
    case 'SET_DEFAULT_UNREAD':
      return { ...state, defaultUnread: action.payload }
    case 'SET_FETCH_LIMIT':
      return { ...state, fetchLimit: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'RESET_FORM':
      return {
        ...state,
        server: action.payload.server,
        apiToken: action.payload.apiToken,
        fetchMetadataFrom: action.payload.fetchMetadataFrom,
        defaultUnread: action.payload.defaultUnread,
        fetchLimit: action.payload.fetchLimit,
        error: '',
        isLoading: false,
      }
    default:
      return state
  }
}

const initialState: SettingsState = {
  isLoading: false,
  server: '',
  apiToken: '',
  fetchMetadataFrom: 'browser',
  defaultUnread: true,
  fetchLimit: 50,
  error: '',
}

interface SettingsFormProps {
  onSaved?: () => void
  onCancel?: () => void
  showCancel?: boolean
}

export default function SettingsForm({
  onSaved,
  onCancel,
  showCancel = true,
}: SettingsFormProps) {
  const toastManager = useKumoToastManager()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cleanBookmarks, setCleanBookmarks] = useState(true)
  const [cleanSyncQueue, setCleanSyncQueue] = useState(false)
  const [state, dispatch] = useReducer(settingsReducer, initialState)
  const {
    serverStorage,
    apiTokenStorage,
    fetchMetadataFromStorage,
    defaultUnreadStorage,
    fetchLimitStorage,
  } = useSetup()

  useEffect(() => {
    async function loadValues() {
      const [
        serverValue,
        apiTokenValue,
        fetchMetadataValue,
        defaultUnreadValue,
        fetchLimitValue,
      ] = await Promise.all([
        serverStorage.getValue(),
        apiTokenStorage.getValue(),
        fetchMetadataFromStorage.getValue(),
        defaultUnreadStorage.getValue(),
        fetchLimitStorage.getValue(),
      ])
      dispatch({
        type: 'RESET_FORM',
        payload: {
          server: serverValue || '',
          apiToken: apiTokenValue || '',
          fetchMetadataFrom: fetchMetadataValue,
          defaultUnread: defaultUnreadValue,
          fetchLimit: fetchLimitValue,
        },
      })
    }
    loadValues()
  }, [
    serverStorage,
    apiTokenStorage,
    fetchMetadataFromStorage,
    defaultUnreadStorage,
    fetchLimitStorage,
  ])

  const onSave = async () => {
    dispatch({ type: 'SET_ERROR', payload: '' })

    const trimmedServer = state.server.trim()
    const trimmedApiToken = state.apiToken.trim()

    if (!trimmedServer || !trimmedApiToken) {
      const errorMsg = 'Both server and API token are required'
      dispatch({
        type: 'SET_ERROR',
        payload: errorMsg,
      })
      toastManager.add({ title: errorMsg, variant: 'error' })
      return
    }

    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await browser.runtime.sendMessage({
        type: 'api-request',
        url: `${trimmedServer}/api/user/profile/`,
        options: {
          method: 'GET',
          headers: {
            Authorization: `Token ${trimmedApiToken}`,
          },
        },
      })

      if (!response.ok) {
        throw new Error('Invalid server URL or API token')
      }

      await Promise.all([
        serverStorage.setValue(trimmedServer),
        apiTokenStorage.setValue(trimmedApiToken),
        fetchMetadataFromStorage.setValue(state.fetchMetadataFrom),
        defaultUnreadStorage.setValue(state.defaultUnread),
        fetchLimitStorage.setValue(state.fetchLimit),
      ])

      dispatch({ type: 'SET_LOADING', payload: false })
      toastManager.add({
        title: 'Settings saved successfully',
        variant: 'default',
      })
      onSaved?.()
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to validate credentials'
      dispatch({
        type: 'SET_ERROR',
        payload: errorMsg,
      })
      toastManager.add({ title: errorMsg, variant: 'error' })
    }
  }

  const handleClean = async () => {
    try {
      const tables = []
      if (cleanBookmarks) tables.push('bookmarks')
      if (cleanSyncQueue) tables.push('sync_queue')

      if (tables.length === 0) {
        toastManager.add({ title: 'No data selected to clean' })
        return
      }

      await Promise.all(tables.map(table => (db.table(table) as any).clear()))

      if (cleanBookmarks) {
        browser.runtime.sendMessage({ type: 'sync-bookmarks' })
      }

      toastManager.add({
        title: 'Local data cleaned successfully',
        variant: 'default',
      })
      setIsModalOpen(false)
    } catch (err) {
      toastManager.add({
        title: 'Failed to clean local data',
        variant: 'error',
      })
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-kumo-strong">
            Connection
          </div>
          <Field label="Server">
            <Input
              value={state.server}
              onChange={e =>
                dispatch({
                  type: 'SET_SERVER',
                  payload: e.target.value,
                })
              }
              placeholder="https://linkding.example.com"
              autoComplete="url"
            />
          </Field>
          <Field label="API Token">
            <Input
              value={state.apiToken}
              onChange={e =>
                dispatch({
                  type: 'SET_API_TOKEN',
                  payload: e.target.value,
                })
              }
              type="password"
              placeholder="xxxxxxxx…"
              autoComplete="off"
            />
          </Field>
        </div>

        <div className="h-px bg-kumo-line" />

        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-kumo-strong">
            Preferences
          </div>
          <Radio.Group
            legend="Fetch Metadata From"
            value={state.fetchMetadataFrom}
            onValueChange={value =>
              dispatch({
                type: 'SET_METADATA_FROM',
                payload: value as MetadataSource,
              })
            }
          >
            <Radio.Item
              value="browser"
              label="Browser"
              description="Fast, includes page context"
            />
            <Radio.Item
              value="server"
              label="Server"
              description="Linkding crawls the URL"
            />
          </Radio.Group>

          <Radio.Group
            legend="Default Bookmark State"
            value={state.defaultUnread ? 'unread' : 'read'}
            onValueChange={value =>
              dispatch({
                type: 'SET_DEFAULT_UNREAD',
                payload: value === 'unread',
              })
            }
          >
            <Radio.Item value="unread" label="Unread" />
            <Radio.Item value="read" label="Read" />
          </Radio.Group>

          <Field
            label="Fetch Limit"
            description="Number of bookmarks to fetch per page."
          >
            <Input
              type="number"
              min={1}
              max={1000}
              value={state.fetchLimit}
              onChange={e =>
                dispatch({
                  type: 'SET_FETCH_LIMIT',
                  payload: parseInt(e.target.value) || 50,
                })
              }
            />
          </Field>
        </div>

        <div className="h-px bg-kumo-line" />

        <div className="flex flex-col gap-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-kumo-strong">
            Maintenance
          </div>
          <div className="flex flex-col gap-2">
            <Text variant="secondary" size="sm">
              Clear local cache and sync queue. This will not delete your
              bookmarks on the server.
            </Text>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                className="w-fit"
              >
                Clean Local Data...
              </Button>
            </div>
          </div>
        </div>

        {state.error && (
          <Text variant="error" size="sm">
            {state.error}
          </Text>
        )}
      </div>
      <div className="flex justify-end gap-3">
        {showCancel && (
          <Button
            disabled={state.isLoading}
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          disabled={state.isLoading}
          variant="primary"
          onClick={onSave}
          loading={state.isLoading}
        >
          Save
        </Button>
      </div>

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog className="p-8">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Clean Local Data
          </Dialog.Title>
          <div className="flex flex-col gap-4">
            <Text variant="secondary" size="sm">
              Select the local data you want to remove. This will not affect
              your data on the Linkding server.
            </Text>
            <div className="flex flex-col gap-4">
              <Checkbox
                checked={cleanBookmarks}
                onCheckedChange={setCleanBookmarks}
                label="Bookmarks Cache"
              />
              <div className="text-xs text-kumo-strong -mt-3 ml-7">
                Forces a full re-sync of all bookmarks.
              </div>

              <Checkbox
                checked={cleanSyncQueue}
                onCheckedChange={setCleanSyncQueue}
                label="Sync Queue"
              />
              {cleanSyncQueue && (
                <div className="text-xs text-kumo-danger -mt-3 ml-7">
                  Warning: This will discard any pending changes that haven't
                  been sent to the server.
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Dialog.Close
              render={p => (
                <Button {...p} variant="secondary">
                  Cancel
                </Button>
              )}
            />
            <Button variant="destructive" onClick={() => handleClean()}>
              Clean Selected Data
            </Button>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  )
}
