import { LayerCard, Button, Text } from '@cloudflare/kumo'
import { browser } from '#imports'

export default function SetupGuide() {
  const openSettings = () => {
    browser.runtime.openOptionsPage()
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <LayerCard className="w-full max-w-96">
        <LayerCard.Secondary>
          <Text variant="heading3">Welcome to linkdingX</Text>
        </LayerCard.Secondary>
        <LayerCard.Primary>
          <div className="flex flex-col gap-4">
            <Text variant="secondary" size="sm">
              To get started, please configure your linkding server and API
              token in the settings.
            </Text>
            <div className="flex justify-center">
              <Button variant="primary" onClick={openSettings}>
                Open Settings
              </Button>
            </div>
          </div>
        </LayerCard.Primary>
      </LayerCard>
    </div>
  )
}
