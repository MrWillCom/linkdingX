'use client'

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
  RadioGroup,
  Radio,
  Description,
  Modal,
  Checkbox,
} from '@heroui/react'
import { useEffect, useReducer, useState } from 'react'
import { useSetup, type MetadataSource } from '@/hooks/useSetup'
import { db } from '@/utils/db'

interface SettingsState {
  isLoading: boolean
  server: string
  apiToken: string
  fetchMetadataFrom: MetadataSource
  defaultUnread: boolean
  error: string
}

type SettingsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SERVER'; payload: string }
  | { type: 'SET_API_TOKEN'; payload: string }
  | { type: 'SET_METADATA_FROM'; payload: MetadataSource }
  | { type: 'SET_DEFAULT_UNREAD'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | {
      type: 'RESET_FORM'
      payload: {
        server: string
        apiToken: string
        fetchMetadataFrom: MetadataSource
        defaultUnread: boolean
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
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'RESET_FORM':
      return {
        ...state,
        server: action.payload.server,
        apiToken: action.payload.apiToken,
        fetchMetadataFrom: action.payload.fetchMetadataFrom,
        defaultUnread: action.payload.defaultUnread,
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cleanBookmarks, setCleanBookmarks] = useState(true)
  const [cleanSyncQueue, setCleanSyncQueue] = useState(false)
  const [state, dispatch] = useReducer(settingsReducer, initialState)
  const {
    serverStorage,
    apiTokenStorage,
    fetchMetadataFromStorage,
    defaultUnreadStorage,
  } = useSetup()

  useEffect(() => {
    async function loadValues() {
      const [
        serverValue,
        apiTokenValue,
        fetchMetadataValue,
        defaultUnreadValue,
      ] = await Promise.all([
        serverStorage.getValue(),
        apiTokenStorage.getValue(),
        fetchMetadataFromStorage.getValue(),
        defaultUnreadStorage.getValue(),
      ])
      dispatch({
        type: 'RESET_FORM',
        payload: {
          server: serverValue || '',
          apiToken: apiTokenValue || '',
          fetchMetadataFrom: fetchMetadataValue,
          defaultUnread: defaultUnreadValue,
        },
      })
    }
    loadValues()
  }, [
    serverStorage,
    apiTokenStorage,
    fetchMetadataFromStorage,
    defaultUnreadStorage,
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
      toast.danger(errorMsg)
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
      ])

      dispatch({ type: 'SET_LOADING', payload: false })
      toast.success('Settings saved successfully')
      onSaved?.()
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to validate credentials'
      dispatch({
        type: 'SET_ERROR',
        payload: errorMsg,
      })
      toast.danger(errorMsg)
    }
  }

  const handleClean = async () => {
    try {
      const tables = []
      if (cleanBookmarks) tables.push('bookmarks')
      if (cleanSyncQueue) tables.push('sync_queue')

      if (tables.length === 0) {
        toast('No data selected to clean')
        return
      }

      await Promise.all(tables.map(table => (db.table(table) as any).clear()))

      if (cleanBookmarks) {
        browser.runtime.sendMessage({ type: 'sync-bookmarks' })
      }

      toast.success('Local data cleaned successfully')
      setIsModalOpen(false)
    } catch (err) {
      toast.danger('Failed to clean local data')
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Form
        className="flex flex-col gap-6"
        onSubmit={e => {
          e.preventDefault()
          onSave()
        }}
      >
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Connection
          </h2>
          <TextField
            name="server"
            type="text"
            isInvalid={!!state.error}
            isRequired
          >
            <Label>Server</Label>
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
          </TextField>
          <TextField
            name="apiToken"
            type="password"
            isInvalid={!!state.error}
            isRequired
          >
            <Label>API Token</Label>
            <Input
              value={state.apiToken}
              onChange={e =>
                dispatch({
                  type: 'SET_API_TOKEN',
                  payload: e.target.value,
                })
              }
              placeholder="xxxxxxxx…"
              autoComplete="off"
            />
          </TextField>
        </div>

        <div className="h-px bg-default-200" />

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Preferences
          </h2>
          <RadioGroup
            value={state.fetchMetadataFrom}
            onChange={value =>
              dispatch({
                type: 'SET_METADATA_FROM',
                payload: value as MetadataSource,
              })
            }
          >
            <Label>Fetch Metadata From</Label>
            <div className="flex flex-col gap-2">
              <Radio value="browser">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>Browser</Label>
                  <Description>Fast, includes page context</Description>
                </Radio.Content>
              </Radio>
              <Radio value="server">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>Server</Label>
                  <Description>Linkding crawls the URL</Description>
                </Radio.Content>
              </Radio>
            </div>
          </RadioGroup>

          <RadioGroup
            value={state.defaultUnread ? 'unread' : 'read'}
            onChange={value =>
              dispatch({
                type: 'SET_DEFAULT_UNREAD',
                payload: value === 'unread',
              })
            }
          >
            <Label>Default Bookmark State</Label>
            <div className="flex flex-col gap-2">
              <Radio value="unread">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>Unread</Label>
                </Radio.Content>
              </Radio>
              <Radio value="read">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Radio.Content>
                  <Label>Read</Label>
                </Radio.Content>
              </Radio>
            </div>
          </RadioGroup>
        </div>

        <div className="h-px bg-default-200" />

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Maintenance
          </h2>
          <div className="flex flex-col gap-2">
            <Description>
              Clear local cache and sync queue. This will not delete your
              bookmarks on the server.
            </Description>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onPress={() => setIsModalOpen(true)}
                className="w-fit"
              >
                Clean Local Data...
              </Button>
            </div>
          </div>
        </div>

        {state.error && <FieldError>{state.error}</FieldError>}
        <button type="submit" className="hidden" aria-hidden="true" />
      </Form>
      <div className="flex justify-end gap-3">
        {showCancel && (
          <Button
            isDisabled={state.isLoading}
            variant="secondary"
            onPress={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button isDisabled={state.isLoading} onPress={onSave}>
          {state.isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
        <Modal.Backdrop variant="blur" />
        <Modal.Container>
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>Clean Local Data</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body>
                  <div className="flex flex-col gap-4">
                    <Description>
                      Select the local data you want to remove. This will not
                      affect your data on the Linkding server.
                    </Description>
                    <div className="flex flex-col gap-3">
                      <Checkbox
                        isSelected={cleanBookmarks}
                        onChange={setCleanBookmarks}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                          <Label>Bookmarks Cache</Label>
                          <Description>
                            Forces a full re-sync of all bookmarks.
                          </Description>
                        </Checkbox.Content>
                      </Checkbox>

                      <Checkbox
                        isSelected={cleanSyncQueue}
                        onChange={setCleanSyncQueue}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                          <Label>Sync Queue</Label>
                          {cleanSyncQueue && (
                            <Description className="text-danger">
                              Warning: This will discard any pending changes
                              that haven't been sent to the server.
                            </Description>
                          )}
                        </Checkbox.Content>
                      </Checkbox>
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" onPress={close}>
                    Cancel
                  </Button>
                  <Button variant="danger" onPress={handleClean}>
                    Clean Selected Data
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </div>
  )
}
