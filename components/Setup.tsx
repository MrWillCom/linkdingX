'use client'

import {
  Button,
  Description,
  FieldError,
  FieldGroup,
  Fieldset,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react'
import { useState } from 'react'
import { useSetup } from '@/hooks/useSetup'

export default function Setup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { serverStorage, apiTokenStorage } = useSetup()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const server = formData.get('server')?.toString().trim() ?? ''
    const apiToken = formData.get('apiToken')?.toString().trim() ?? ''

    if (!server || !apiToken) {
      setError('Both fields are required')
      setIsLoading(false)
      return
    }

    try {
      console.log('Sending message to background:', {
        type: 'api-request',
        url: `${server}/api/user/profile/`,
      })
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
      console.log('Response from background:', response)

      if (!response.ok) {
        throw new Error('Invalid server URL or API token')
      }

      await serverStorage.setValue(server)
      await apiTokenStorage.setValue(apiToken)
    } catch (err) {
      console.error('Setup error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to validate credentials',
      )
      setIsLoading(false)
    }
  }

  return (
    <Form className="w-full max-w-96" onSubmit={onSubmit}>
      <Fieldset>
        <Fieldset.Legend>Setup</Fieldset.Legend>
        <Description>Configure your linkding server and API token.</Description>
        <FieldGroup>
          <TextField
            isRequired
            name="server"
            validate={value => {
              if (!value) {
                return 'Server URL is required'
              }
              try {
                new URL(value)
              } catch {
                return 'Invalid URL format'
              }
              return null
            }}
          >
            <Label>Server</Label>
            <Input placeholder="https://linkding.example.com" />
            <FieldError />
          </TextField>
          <TextField
            isRequired
            name="apiToken"
            validate={value => {
              if (!value) {
                return 'API Token is required'
              }
              return null
            }}
          >
            <Label>API Token</Label>
            <Input placeholder="xxxxxxxx..." type="password" />
            <FieldError />
          </TextField>
        </FieldGroup>
        {error && <FieldError className="mt-2">{error}</FieldError>}
        <Fieldset.Actions>
          <Button type="submit" isPending={isLoading}>
            Save
          </Button>
          <Button type="reset" variant="secondary">
            Cancel
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  )
}
