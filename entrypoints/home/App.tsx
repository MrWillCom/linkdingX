import { useSetup } from '@/hooks/useSetup'
import { useSyncNotifications } from '@/hooks/useSyncNotifications'
import SetupGuide from '@/components/SetupGuide'
import BookmarksList from '@/components/BookmarksList'

function App() {
  const { isSetupComplete, isLoading } = useSetup()
  useSyncNotifications()

  if (isLoading) {
    return null
  }

  if (!isSetupComplete) {
    return <SetupGuide />
  }

  return <BookmarksList variant="expanded" />
}

export default App
