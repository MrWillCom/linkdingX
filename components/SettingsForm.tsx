'use client'

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Surface,
  TextField,
} from '@heroui/react'
import { useEffect, useReducer } from 'react'
import { useSetup } from '@/hooks/useSetup'

interface SettingsState {
  isLoading: boolean
  server: string
  apiToken: string
  error: string
}

type SettingsAction =
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
  isLoading: false,
  server: '',
  apiToken: '',
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
        payload: { server: serverValue || '', apiToken: apiTokenValue || '' },
      })
    }
    loadValues()
  }, [serverStorage, apiTokenStorage])

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
      onSaved?.()
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload:
          err instanceof Error ? err.message : 'Failed to validate credentials',
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Surface variant="default">
        <Form
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
          {state.error && <FieldError>{state.error}</FieldError>}
          <button type="submit" className="hidden" aria-hidden="true" />
        </Form>
      </Surface>
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
        <Button isPending={state.isLoading} onPress={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}
