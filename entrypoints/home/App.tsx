import { useSetup } from '@/hooks/useSetup'
import Setup from '@/components/Setup'
import BookmarksList from '@/components/BookmarksList'

function App() {
  const { isSetupComplete, isLoading } = useSetup()

  if (isLoading) {
    return null
  }

  if (!isSetupComplete) {
    return <Setup />
  }

  return <BookmarksList variant="expanded" />
}

export default App
