import { useEffect, useReducer } from 'react'

interface State {
  currentTabUrl: string | null
  realtimeMetadata: {
    title: string
    favicon: string | null
  }
}

type Action =
  | {
      type: 'SET_TAB'
      url: string | null
      title?: string
      favicon?: string | null
    }
  | { type: 'UPDATE_METADATA'; title?: string; favicon?: string | null }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TAB':
      return {
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
            url: activeTab.url,
            title: activeTab.title,
            favicon: activeTab.favIconUrl,
          })
          return
        }
      } catch {}
      dispatch({ type: 'SET_TAB', url: null })
    }

    const onActivated = () => syncCurrentTab()
    const onUpdated = (_id: number, change: any, tab: any) => {
      if (!tab.active) return
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
            url: change.url,
            title: tab.title,
            favicon: tab.favIconUrl,
          })
        } else {
          dispatch({ type: 'SET_TAB', url: null })
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
  }, [])

  return state
}
