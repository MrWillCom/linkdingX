import { useEffect, useReducer } from 'react'

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

  useEffect(() => {
    const syncCurrentTab = async () => {
      try {
        const tabs = await browser.tabs.query({
          currentWindow: true,
          active: true,
        })
        const activeTab = tabs[0]
        if (activeTab?.url?.startsWith('http')) {
          dispatch({
            type: 'SET_TAB',
            id: activeTab.id ?? null,
            url: activeTab.url,
            title: activeTab.title,
            favicon: activeTab.favIconUrl,
          })
          return
        }
        // Explicitly reset if not an HTTP(S) tab
        dispatch({ type: 'SET_TAB', id: null, url: null })
      } catch {
        // Explicitly reset if error occurs
        dispatch({ type: 'SET_TAB', id: null, url: null })
      }
    }

    const onActivated = () => syncCurrentTab()
    const onUpdated = (
      id: number,
      change: { title?: string; favIconUrl?: string; url?: string },
      tab: { active?: boolean; title?: string; favIconUrl?: string },
    ) => {
      // Ensure we only update if the tab being updated is the one we are currently tracking
      if (!tab.active || id !== state.currentTabId) return
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
          // If URL changes to something non-HTTP, clear the state immediately
          dispatch({ type: 'SET_TAB', id: null, url: null })
        }
      }
    }

    syncCurrentTab()
    browser.tabs.onActivated.addListener(onActivated)
    browser.tabs.onUpdated.addListener(onUpdated)
    return () => {
      browser.tabs.onActivated.removeListener(onActivated)
      browser.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [state.currentTabId])

  return state
}
