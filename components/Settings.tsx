'use client'

import { Button, Input, Label, Modal, Surface, TextField } from '@heroui/react'
import { useState, useEffect } from 'react'
import { storage } from '#imports'
import { Settings as SettingsIcon } from 'lucide-react'

const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [server, setServer] = useState('')
  const [apiToken, setApiToken] = useState('')

  useEffect(() => {
    async function loadValues() {
      const [serverValue, apiTokenValue] = await Promise.all([
        serverStorage.getValue(),
        apiTokenStorage.getValue(),
      ])
      setServer(serverValue)
      setApiToken(apiTokenValue)
    }
    loadValues()
  }, [])

  const onSave = async () => {
    if (!server || !apiToken) return

    setIsLoading(true)
    try {
      const response = await browser.runtime.sendMessage({
        type: 'api-request',
        url: `${server}/api/user/profile/`,
        options: {
          method: 'GET',
          headers: {
            Authorization: `Token ${apiToken}`,
          },
        },
      })

      if (!response.ok) {
        throw new Error('Invalid server URL or API token')
      }

      await serverStorage.setValue(server)
      await apiTokenStorage.setValue(apiToken)
    } catch (err) {
      console.error('Settings error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        onPress={() => setIsOpen(true)}
      >
        <SettingsIcon size={18} />
      </Button>
      <Modal.Backdrop>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
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
                <form className="flex flex-col gap-4">
                  <TextField name="server" type="text">
                    <Label>Server</Label>
                    <Input
                      value={server}
                      onChange={e => setServer(e.target.value)}
                      placeholder="https://linkding.example.com"
                    />
                  </TextField>
                  <TextField name="apiToken" type="password">
                    <Label>API Token</Label>
                    <Input
                      value={apiToken}
                      onChange={e => setApiToken(e.target.value)}
                      placeholder="xxxxxxxx..."
                    />
                  </TextField>
                </form>
              </Surface>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button isPending={isLoading} onPress={onSave} slot="close">
                Save
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
