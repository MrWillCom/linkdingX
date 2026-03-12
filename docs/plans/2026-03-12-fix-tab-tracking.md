# Fix Current Tab Tracking Logic

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the current tab card in the side panel accurately reflects the active tab, even when new tabs are opened via `target="_blank"` or when window focus changes.

**Architecture:** Refactor `useCurrentTabTracker.ts` to use a more robust set of browser event listeners and manage internal state with refs to avoid unnecessary re-subscriptions and race conditions.

**Tech Stack:** React, WXT (#imports), browser.tabs API, browser.windows API.

---

### Task 1: Refactor useCurrentTabTracker.ts

**Files:**

- Modify: `hooks/useCurrentTabTracker.ts`

**Step 1: Update imports and state management**
Add `useRef` to track the current tab ID and URL outside of the React render cycle to prevent effect re-runs.

**Step 2: Add missing event listeners**
Include `browser.tabs.onCreated`, `browser.tabs.onRemoved`, and `browser.windows.onFocusChanged`.

**Step 3: Refine tab filtering**
Ensure only `http` and `https` tabs update the state, explicitly resetting for internal or restricted tabs.

**Step 4: Implementation**

```typescript
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

        // Reset if not an HTTP(S) tab
        currentTabIdRef.current = null
        dispatch({ type: 'SET_TAB', id: null, url: null })
      } catch (err) {
        console.error('[useCurrentTabTracker] Error syncing tab:', err)
        currentTabIdRef.current = null
        dispatch({ type: 'SET_TAB', id: null, url: null })
      }
    }

    const onActivated = () => syncCurrentTab()
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
      // Only care about updates to the active tab we're tracking
      if (!tab.active) return

      if (id !== currentTabIdRef.current) {
        // If an active tab we weren't tracking just updated its URL to something valid
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
  }, []) // Empty dependency array: run once and manage via refs/events

  return state
}
```

**Step 5: Verify via compilation**

Run: `pnpm compile`
Expected: Successfully compiled without TypeScript errors.

**Step 6: Commit**

```bash
git add hooks/useCurrentTabTracker.ts
git commit -m "fix: robust tab tracking with onCreated and onFocusChanged listeners"
```
