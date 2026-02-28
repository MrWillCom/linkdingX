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
import { useState, useEffect } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { useSetup } from '@/hooks/useSetup'

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [server, setServer] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [error, setError] = useState('')
  const { serverStorage, apiTokenStorage } = useSetup()

  useEffect(() => {
    async function loadValues() {
      const [serverValue, apiTokenValue] = await Promise.all([
        serverStorage.getValue(),
        apiTokenStorage.getValue(),
      ])
      setServer(serverValue)
      setApiToken(apiTokenValue)
    }
    if (isOpen) {
      loadValues()
    }
  }, [isOpen, serverStorage, apiTokenStorage])

  const onSave = async () => {
    setError('')

    const trimmedServer = server.trim()
    const trimmedApiToken = apiToken.trim()

    if (!trimmedServer || !trimmedApiToken) {
      setError('Both server and API token are required')
      return
    }

    setIsLoading(true)
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
      setIsOpen(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to validate credentials',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return
    if (!open) {
      setError('')
    }
    setIsOpen(open)
  }

  const handleCancel = () => {
    if (isLoading) return
    setError('')
    setIsOpen(false)
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        isIconOnly
        variant="tertiary"
        onPress={() => setIsOpen(true)}
        aria-label="Open settings"
      >
        <SettingsIcon size={18} />
      </Button>
      <Modal.Backdrop>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger isDisabled={isLoading} />
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
                  <TextField name="server" type="text" isInvalid={!!error}>
                    <Label>Server</Label>
                    <Input
                      value={server}
                      onChange={e => setServer(e.target.value)}
                      placeholder="https://linkding.example.com"
                      autoComplete="url"
                    />
                  </TextField>
                  <TextField
                    name="apiToken"
                    type="password"
                    isInvalid={!!error}
                  >
                    <Label>API Token</Label>
                    <Input
                      value={apiToken}
                      onChange={e => setApiToken(e.target.value)}
                      placeholder="xxxxxxxx…"
                      autoComplete="off"
                    />
                  </TextField>
                  {error && <FieldError>{error}</FieldError>}
                </form>
              </Surface>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isLoading}
                variant="secondary"
                onPress={handleCancel}
              >
                Cancel
              </Button>
              <Button isPending={isLoading} onPress={onSave}>
                Save
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
