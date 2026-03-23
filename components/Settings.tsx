'use client'

import { Button, Dialog, Text } from '@cloudflare/kumo'
import { useState } from 'react'
import { GearIcon } from '@phosphor-icons/react'
import SettingsForm from './SettingsForm'

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger
        render={props => (
          <Button {...props} variant="ghost" shape="square" aria-label="Open settings">
            <GearIcon size={18} weight="bold" />
          </Button>
        )}
      />
      <Dialog className="sm:max-w-md p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-kumo-tint text-kumo-brand">
            <GearIcon weight="bold" className="size-5" />
          </div>
          <div className="flex-1">
            <Dialog.Title className="text-lg font-semibold leading-6">Settings</Dialog.Title>
            <div className="mt-1">
              <Text variant="secondary" size="sm">
                Configure your linkding server and API token.
              </Text>
            </div>
          </div>
          <Dialog.Close
            aria-label="Close settings"
            render={props => (
              <Button {...props} variant="ghost" shape="square" aria-label="Close settings">
                <span className="sr-only">Close</span>
              </Button>
            )}
          />
        </div>
        <SettingsForm onSaved={handleClose} onCancel={handleClose} />
      </Dialog>
    </Dialog.Root>
  )
}
