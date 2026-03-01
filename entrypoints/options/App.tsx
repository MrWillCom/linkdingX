import SettingsForm from '@/components/SettingsForm'

export default function App() {
  return (
    <div className="min-h-screen bg-background p-8 flex justify-center">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6">linkdingX Settings</h1>
        <SettingsForm showCancel={false} />
      </div>
    </div>
  )
}
