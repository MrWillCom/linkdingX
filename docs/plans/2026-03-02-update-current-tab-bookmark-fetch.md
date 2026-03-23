# Update Current Tab Bookmark Fetch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `fetchCurrentTabBookmark` to use the `/api/bookmarks/check/` endpoint, handle its response format, and return both bookmark and metadata.

**Architecture:**

- Update the fetcher function `fetchCurrentTabBookmark` to call the new endpoint.
- Change the return type from `Bookmark | null` to `{ bookmark: Bookmark | null, metadata: any } | null`.
- Update the `useSWR` hook to handle the new return type.
- Update `BookmarksList` components to handle the new data structure.

**Tech Stack:** React, SWR, WXT, TypeScript

---

### Task 1: Update Types and Fetcher

**Files:**

- Modify: `components/BookmarksList.tsx`

**Step 1: Define new interface for the check response**

```typescript
interface BookmarkCheckResponse {
  bookmark: Bookmark | null
  metadata: {
    title: string
    description: string
  }
}
```

**Step 2: Update `fetchCurrentTabBookmark`**

Update the function to use the new endpoint and return the new structure.

```typescript
async function fetchCurrentTabBookmark([
  _type,
  url,
]: CurrentTabBookmarkKey): Promise<BookmarkCheckResponse | null> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) return null

  const fullUrl = `${server}/api/bookmarks/check/?url=${encodeURIComponent(url)}`
  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url: fullUrl,
    options: {
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    },
  })

  if (!response.ok) return null

  const data = response.data as BookmarkCheckResponse
  return {
    bookmark: data.bookmark,
    metadata: data.metadata,
  }
}
```

**Step 3: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "refactor: update fetchCurrentTabBookmark to use check endpoint"
```

### Task 2: Update `useSWR` and Component State

**Files:**

- Modify: `components/BookmarksList.tsx`

**Step 1: Update `currentTabBookmarkData` hook**

Update the generic type parameters for `useSWR` to reflect the new return type.

```typescript
const {
  data: currentTabBookmarkData,
  isLoading: isCurrentTabBookmarkLoading,
  isValidating: isCurrentTabBookmarkValidating,
  mutate: mutateCurrentTabBookmark,
} = useSWR<BookmarkCheckResponse | null, Error, CurrentTabBookmarkKey | null>(
  currentTabKey,
  fetchCurrentTabBookmark,
  {
    // ... existing options ...
  },
)
```

**Step 2: Update `useEffect` that synchronizes with infinite list**

```typescript
useEffect(() => {
  if (!currentTabBookmarkData?.bookmark) return
  const updatedBookmark = bookmarks.find(b => b.id === currentTabBookmarkData.bookmark!.id)
  if (updatedBookmark && updatedBookmark.unread !== currentTabBookmarkData.bookmark.unread) {
    mutateCurrentTabBookmark(
      { ...currentTabBookmarkData, bookmark: updatedBookmark },
      {
        revalidate: false,
      },
    )
  }
}, [bookmarks, currentTabBookmarkData, mutateCurrentTabBookmark])
```

**Step 3: Update `useEffect` that sets `displayedCurrentTabBookmark`**

```typescript
useEffect(() => {
  if (currentTabBookmarkData?.bookmark) {
    setDisplayedCurrentTabBookmark(currentTabBookmarkData.bookmark)
    return
  }

  const timeoutId = window.setTimeout(() => {
    setDisplayedCurrentTabBookmark(null)
  }, 220)

  return () => window.clearTimeout(timeoutId)
}, [currentTabBookmarkData])
```

**Step 4: Update `handleToggleUnread` to handle new structure**

```typescript
// Optimistic update for current tab card if it matches
if (currentTabBookmarkData?.bookmark && currentTabBookmarkData.bookmark.id === id) {
  await mutateCurrentTabBookmark(
    {
      ...currentTabBookmarkData,
      bookmark: { ...currentTabBookmarkData.bookmark, unread: newUnread },
    },
    { revalidate: false },
  )
}
```

**Step 5: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "feat: update BookmarksList to handle new bookmark check data structure"
```

### Task 3: Verification

**Files:**

- Run: `pnpm compile`

**Step 1: Run type check**

Run: `pnpm compile`
Expected: PASS (no type errors)

**Step 2: Commit**

```bash
git commit --allow-empty -m "chore: verify build passes after changes"
```
