'use client'

import { Button, Modal } from '@heroui/react'
import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import SettingsForm from './SettingsForm'

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const handleClose = () => {
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
              <SettingsForm onSaved={handleClose} onCancel={handleClose} />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
