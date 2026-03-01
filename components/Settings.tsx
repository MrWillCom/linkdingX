'use client'

import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  Surface,
  TextField,
} from '@heroui/react'
import { useEffect, useReducer } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useSetup } from '@/hooks/useSetup'

interface SettingsState {
  isOpen: boolean
  isLoading: boolean
  server: string
  apiToken: string
  error: string
}

type SettingsAction =
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SERVER'; payload: string }
  | { type: 'SET_API_TOKEN'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_FORM'; payload: { server: string; apiToken: string } }

function settingsReducer(
  state: SettingsState,
  action: SettingsAction,
): SettingsState {
  switch (action.type) {
    case 'SET_OPEN':
      return {
        ...state,
        isOpen: action.payload,
        error: action.payload ? state.error : '',
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_SERVER':
      return { ...state, server: action.payload }
    case 'SET_API_TOKEN':
      return { ...state, apiToken: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'RESET_FORM':
      return {
        ...state,
        server: action.payload.server,
        apiToken: action.payload.apiToken,
        error: '',
        isLoading: false,
      }
    default:
      return state
  }
}

const initialState: SettingsState = {
  isOpen: false,
  isLoading: false,
  server: '',
  apiToken: '',
  error: '',
}

export default function Settings() {
  const [state, dispatch] = useReducer(settingsReducer, initialState)
  const { serverStorage, apiTokenStorage } = useSetup()

  useEffect(() => {
    async function loadValues() {
      const [serverValue, apiTokenValue] = await Promise.all([
        serverStorage.getValue(),
        apiTokenStorage.getValue(),
      ])
      dispatch({
        type: 'RESET_FORM',
        payload: { server: serverValue, apiToken: apiTokenValue },
      })
    }
    if (state.isOpen) {
      loadValues()
    }
  }, [state.isOpen, serverStorage, apiTokenStorage])

  const onSave = async () => {
    dispatch({ type: 'SET_ERROR', payload: '' })

    const trimmedServer = state.server.trim()
    const trimmedApiToken = state.apiToken.trim()

    if (!trimmedServer || !trimmedApiToken) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Both server and API token are required',
      })
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

      await serverStorage.setValue(trimmedServer)
      await apiTokenStorage.setValue(trimmedApiToken)
      dispatch({ type: 'SET_OPEN', payload: false })
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          err instanceof Error ? err.message : 'Failed to validate credentials',
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (state.isLoading) return
    dispatch({ type: 'SET_OPEN', payload: open })
  }

  const handleCancel = () => {
    if (state.isLoading) return
    dispatch({ type: 'SET_OPEN', payload: false })
  }

  return (
    <Modal isOpen={state.isOpen} onOpenChange={handleOpenChange}>
      <Button
        isIconOnly
        variant="tertiary"
        onPress={() => dispatch({ type: 'SET_OPEN', payload: true })}
        aria-label="Open settings"
      >
        <SettingsIcon size={18} />
      </Button>
      <Modal.Backdrop>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger isDisabled={state.isLoading} />
            <Modal.Header>
              <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                <SettingsIcon className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Settings</Modal.Heading>
              <p className="mt-1.5 text-sm leading-5 text-muted">
                Configure your linkding server and API token.
              </p>
            </Modal.Header>
            <Modal.Body className="p-6">
              <Surface variant="default">
                <form
                  className="flex flex-col gap-4"
                  onSubmit={e => {
                    e.preventDefault()
                    onSave()
                  }}
                >
                  <TextField
                    name="server"
                    type="text"
                    isInvalid={!!state.error}
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
                  {state.error && <FieldError>{state.error}</FieldError>}
                  {/* Hidden submit button to allow Enter to save while technically adhering to Suggestion */}
                  <button type="submit" className="hidden" aria-hidden="true" />
                </form>
              </Surface>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={state.isLoading}
                variant="secondary"
                onPress={handleCancel}
              >
                Cancel
              </Button>
              <Button isPending={state.isLoading} onPress={onSave}>
                Save
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
