import SettingsForm from '@/components/SettingsForm'
import { Toast } from '@heroui/react'

export default function App() {
  return (
    <div className="min-h-screen bg-background p-8 flex justify-center">
      <Toast.Provider placement="bottom" />
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Options</h1>
        <SettingsForm showCancel={false} />
      </div>
    </div>
  )
}
