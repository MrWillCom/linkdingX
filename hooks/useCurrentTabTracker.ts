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

  const currentTabIdRef = useRef<number | null>(null)

  useEffect(() => {
    const syncCurrentTab = async () => {
      try {
        const tabs = await browser.tabs.query({
          currentWindow: true,
          active: true,
        })
        const activeTab = tabs[0]

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

        currentTabIdRef.current = null
        dispatch({ type: 'SET_TAB', id: null, url: null })
      } catch {
        currentTabIdRef.current = null
        dispatch({ type: 'SET_TAB', id: null, url: null })
      }
    }

    const onActivated = () => {
      syncCurrentTab()
    }
    const onCreated = (tab: any) => {
      if (tab.active) syncCurrentTab()
    }
    const onRemoved = (tabId: number) => {
      if (tabId === currentTabIdRef.current) syncCurrentTab()
    }
    const onWindowFocusChanged = (windowId: number) => {
      if (windowId !== browser.windows.WINDOW_ID_NONE) syncCurrentTab()
    }

    const onUpdated = (
      id: number,
      change: { title?: string; favIconUrl?: string; url?: string },
      tab: { active?: boolean; title?: string; favIconUrl?: string },
    ) => {
      if (!tab.active) return

      if (id !== currentTabIdRef.current) {
        if (change.url?.startsWith('http')) {
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
  }, [])

  return state
}
