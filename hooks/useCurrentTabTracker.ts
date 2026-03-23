import { useEffect, useReducer, useRef } from 'react'

interface State {
  currentTabId: number | null
  currentTabUrl: string | null
  realtimeMetadata: {
    title: string
    favicon: string | null
  }
}

type Action =
  | {
      type: 'SET_TAB'
      id: number | null
      url: string | null
      title?: string
      favicon?: string | null
    }
  | { type: 'UPDATE_METADATA'; title?: string; favicon?: string | null }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TAB':
      return {
        currentTabId: action.id,
        currentTabUrl: action.url,
        realtimeMetadata: {
          title: action.title ?? '',
          favicon: action.favicon ?? null,
        },
      }
    case 'UPDATE_METADATA':
      return {
        ...state,
        realtimeMetadata: {
          title: action.title ?? state.realtimeMetadata.title,
          favicon: action.favicon ?? state.realtimeMetadata.favicon,
        },
      }
    default:
      return state
  }
}

export function useCurrentTabTracker() {
  const [state, dispatch] = useReducer(reducer, {
    currentTabId: null,
    currentTabUrl: null,
    realtimeMetadata: { title: '', favicon: null },
  })

  // Use refs to keep track of the current state without triggering effect re-runs
  const currentTabIdRef = useRef<number | null>(null)

  useEffect(() => {
    const syncCurrentTab = async () => {
      console.log('[useCurrentTabTracker] syncCurrentTab')
      try {
        const tabs = await browser.tabs.query({
          currentWindow: true,
          active: true,
        })
        const activeTab = tabs[0]
        console.log('[useCurrentTabTracker] activeTab:', activeTab?.url)

        if (activeTab?.url?.startsWith('http')) {
          currentTabIdRef.current = activeTab.id ?? null
          dispatch({
            type: 'SET_TAB',
            id: activeTab.id ?? null,
            url: activeTab.url,
            title: activeTab.title,
            favicon: activeTab.favIconUrl,
          })
          return
        }

        // Reset if not an HTTP(S) tab
        console.log('[useCurrentTabTracker] Not an HTTP tab, resetting')
        currentTabIdRef.current = null
        dispatch({ type: 'SET_TAB', id: null, url: null })
      } catch (err) {
        console.error('[useCurrentTabTracker] Error syncing tab:', err)
        currentTabIdRef.current = null
        dispatch({ type: 'SET_TAB', id: null, url: null })
      }
    }

    const onActivated = () => {
      console.log('[useCurrentTabTracker] onActivated')
      syncCurrentTab()
    }
    const onCreated = (tab: any) => {
      console.log('[useCurrentTabTracker] onCreated', tab.id, tab.active)
      if (tab.active) syncCurrentTab()
    }
    const onRemoved = (tabId: number) => {
      console.log('[useCurrentTabTracker] onRemoved', tabId)
      if (tabId === currentTabIdRef.current) syncCurrentTab()
    }
    const onWindowFocusChanged = (windowId: number) => {
      console.log('[useCurrentTabTracker] onWindowFocusChanged', windowId)
      if (windowId !== browser.windows.WINDOW_ID_NONE) syncCurrentTab()
    }

    const onUpdated = (
      id: number,
      change: { title?: string; favIconUrl?: string; url?: string },
      tab: { active?: boolean; title?: string; favIconUrl?: string },
    ) => {
      console.log('[useCurrentTabTracker] onUpdated', {
        id,
        change,
        active: tab.active,
      })

      // Only care about updates to the active tab we're tracking
      if (!tab.active) return

      if (id !== currentTabIdRef.current) {
        // If an active tab we weren't tracking just updated its URL to something valid
        if (change.url?.startsWith('http')) {
          console.log('[useCurrentTabTracker] New active tab detected via update')
          syncCurrentTab()
        }
        return
      }

      if (change.title || change.favIconUrl) {
        dispatch({
          type: 'UPDATE_METADATA',
          title: change.title,
          favicon: change.favIconUrl,
        })
      }

      if (change.url) {
        if (change.url.startsWith('http')) {
          dispatch({
            type: 'SET_TAB',
            id,
            url: change.url,
            title: tab.title,
            favicon: tab.favIconUrl,
          })
        } else {
          console.log('[useCurrentTabTracker] URL changed to non-HTTP, resetting')
          currentTabIdRef.current = null
          dispatch({ type: 'SET_TAB', id: null, url: null })
        }
      }
    }

    syncCurrentTab()

    browser.tabs.onActivated.addListener(onActivated)
    browser.tabs.onUpdated.addListener(onUpdated)
    browser.tabs.onCreated.addListener(onCreated)
    browser.tabs.onRemoved.addListener(onRemoved)
    browser.windows.onFocusChanged.addListener(onWindowFocusChanged)

    return () => {
      browser.tabs.onActivated.removeListener(onActivated)
      browser.tabs.onUpdated.removeListener(onUpdated)
      browser.tabs.onCreated.removeListener(onCreated)
      browser.tabs.onRemoved.removeListener(onRemoved)
      browser.windows.onFocusChanged.removeListener(onWindowFocusChanged)
    }
  }, []) // Empty dependency array: run once and manage via refs/events

  return state
}
