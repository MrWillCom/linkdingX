import { useSetup } from '@/hooks/useSetup'
import SetupGuide from '@/components/SetupGuide'
import ManagerTable from '@/components/manager/ManagerTable'

function App() {
  const { isSetupComplete, isLoading } = useSetup()

  if (isLoading) {
    return null
  }

  if (!isSetupComplete) {
    return <SetupGuide />
  }

  return <ManagerTable />
}

export default App
