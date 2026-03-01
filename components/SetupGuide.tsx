import { Card, Button } from '@heroui/react'
import { browser } from '#imports'

export default function SetupGuide() {
  const openSettings = () => {
    browser.runtime.openOptionsPage()
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <Card className="w-full max-w-96" variant="secondary">
        <Card.Header>
          <Card.Title>Welcome to linkdingX</Card.Title>
          <Card.Description>
            To get started, please configure your linkding server and API token
            in the settings.
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex justify-center pt-2">
          <Button variant="primary" onPress={openSettings}>
            Open Settings
          </Button>
        </Card.Content>
      </Card>
    </div>
  )
}
