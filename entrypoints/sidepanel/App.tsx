import { useSetup } from '@/hooks/useSetup'
import SetupGuide from '@/components/SetupGuide'
import BookmarksList from '@/components/BookmarksList'

function App() {
  const { isSetupComplete, isLoading } = useSetup()

  if (isLoading) {
    return null
  }

  if (!isSetupComplete) {
    return <SetupGuide />
  }

  return <BookmarksList variant="default" />
}

export default App
