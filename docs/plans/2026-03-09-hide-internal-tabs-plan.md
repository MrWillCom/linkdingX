# Hide Internal Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the current tab card disappears immediately when the user switches to a browser-internal tab (e.g., `chrome://`, `about:blank`, `edge://`).

**Architecture:** Update the `useCurrentTabTracker` hook to explicitly clear state (URL and metadata) when a non-HTTP(S) tab is detected. This will propagate through SWR to the UI, triggering the card's removal.

**Tech Stack:** React, WXT/Browser Extension APIs.

---

### Task 1: Update `useCurrentTabTracker` Logic

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/hooks/useCurrentTabTracker.ts:54-73` (sync logic)
- Modify: `/Users/will/Developer/MrWillCom/linkdingX/hooks/useCurrentTabTracker.ts:90-102` (update logic)

**Step 1: Update `syncCurrentTab` to handle non-HTTP URLs**

In `hooks/useCurrentTabTracker.ts`:

```typescript
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
  } catch {}
  // Explicitly reset if not an HTTP(S) tab or error occurs
  dispatch({ type: 'SET_TAB', id: null, url: null })
}
```

**Step 2: Update `onUpdated` listener to handle non-HTTP URLs**

In `hooks/useCurrentTabTracker.ts`:

```typescript
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
```

**Step 3: Run compilation and formatting**

Run: `pnpm compile && pnpm format`
Expected: Success

**Step 4: Commit**

```bash
git add hooks/useCurrentTabTracker.ts
git commit -m "fix: reset current tab state for non-HTTP URLs"
```

---

### Task 2: Verify `SET_TAB` Reducer State Clearing

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/hooks/useCurrentTabTracker.ts:24-32`

**Step 1: Ensure `realtimeMetadata` is cleared in `SET_TAB`**

In `hooks/useCurrentTabTracker.ts`:

```typescript
case 'SET_TAB':
  return {
    currentTabId: action.id,
    currentTabUrl: action.url,
    realtimeMetadata: {
      title: action.title ?? '', // Will be '' if not provided
      favicon: action.favicon ?? null, // Will be null if not provided
    },
  }
```

**Step 2: Run compilation and formatting**

Run: `pnpm compile && pnpm format`
Expected: Success

**Step 3: Commit**

```bash
git add hooks/useCurrentTabTracker.ts
git commit -m "refactor: ensure SET_TAB action clears metadata"
```
