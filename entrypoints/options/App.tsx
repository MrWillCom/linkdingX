import SettingsForm from '@/components/SettingsForm'
import { Toasty } from '@cloudflare/kumo'

export default function App() {
  return (
    <div className="min-h-screen bg-kumo-base p-8 flex justify-center">
      <Toasty>
        <div className="w-full max-w-xl">
          <h1 className="text-2xl font-bold mb-6 text-kumo-strong">Options</h1>
          <SettingsForm showCancel={false} />
        </div>
      </Toasty>
    </div>
  )
}
