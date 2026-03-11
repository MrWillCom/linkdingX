# Instant Current Tab Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the current tab card is always visible for non-internal tabs, prioritizing local data and browser fallbacks over server responses.

**Architecture:**

1. Update `useCurrentTabBookmark` to return `currentTabUrl` and `realtimeMetadata` immediately, even if server checks are pending or fail.
2. Update `BookmarksHeader` to show the card based solely on the existence of `currentTabUrl`.
3. Ensure `CurrentTabCard` uses `realtimeMetadata` as the primary fallback for title/favicon.

**Tech Stack:** React 19, WXT, Dexie (IndexedDB), Tailwind CSS v4, HeroUI v3.

---

### Task 1: Update `useCurrentTabBookmark` Hook

**Files:**

- Modify: `hooks/useCurrentTabBookmark.ts`

**Step 1: Modify hook to ensure immediate return of tab data**
Ensure `currentTabUrl` and `realtimeMetadata` are always part of the return object, and the hook doesn't "wait" for `serverData` to exist before being useful.

```typescript
// hooks/useCurrentTabBookmark.ts
export function useCurrentTabBookmark() {
  const { currentTabUrl, realtimeMetadata } = useCurrentTabTracker()
  const [serverData, setServerData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 1. Watch local DB (The Truth)
  const bookmark = useLiveQuery(
    () =>
      currentTabUrl
        ? db.bookmarks.where('url').equals(currentTabUrl).first()
        : undefined,
    [currentTabUrl],
  )

  // 2. Background Sync (Enhancement)
  useEffect(() => {
    if (!currentTabUrl || bookmark) {
      setServerData(null)
      return
    }

    setIsLoading(true)
    browser.runtime
      .sendMessage({
        type: 'api-request',
        url: `/api/bookmarks/check/?url=${encodeURIComponent(currentTabUrl)}`,
      })
      .then(res => {
        if (res.ok) {
          setServerData(res.data)
        }
      })
      .catch(err =>
        console.error('[useCurrentTabBookmark] Background sync failed:', err),
      )
      .finally(() => setIsLoading(false))
  }, [currentTabUrl, !!bookmark])

  return {
    bookmark,
    serverMetadata: serverData?.metadata,
    realtimeMetadata,
    isLoading,
    currentTabUrl,
  }
}
```

**Step 2: Commit**

```bash
git add hooks/useCurrentTabBookmark.ts
git commit -m "refactor(hooks): decouple tab metadata from server check state"
```

### Task 2: Update `BookmarksHeader` Visibility Logic

**Files:**

- Modify: `components/BookmarksHeader.tsx`

**Step 1: Update `isVisible` condition**
Change the logic to show the card whenever `currentTabUrl` is present.

```typescript
// components/BookmarksHeader.tsx:48-49
const isVisible = !!currentTabUrl
```

**Step 2: Commit**

```bash
git add components/BookmarksHeader.tsx
git commit -m "feat(ui): show current tab card instantly when URL is present"
```

### Task 3: Verify `CurrentTabCard` Fallback Rendering

**Files:**

- Modify: `components/CurrentTabCard.tsx` (if needed, but current logic looks robust)

**Step 1: Verify title/favicon resolution order**
Ensure `realtimeMetadata` is used if `bookmark` and `serverMetadata` are missing.

```typescript
// components/CurrentTabCard.tsx:76-85
const title =
  bookmark?.title ||
  realtimeMetadata?.title ||
  metadata?.title ||
  currentTabUrl ||
  ''
const url = bookmark?.url || currentTabUrl || ''
const description = bookmark?.description || metadata?.description || ''
const favicon = bookmark?.favicon_url || realtimeMetadata?.favicon || null
```

_(No changes needed if this matches existing code, just verification)_

**Step 2: Run build to ensure no regressions**

Run: `pnpm compile`
Expected: PASS

**Step 3: Commit (if changes made)**

```bash
git add components/CurrentTabCard.tsx
git commit -m "chore(ui): verify card fallback logic"
```
