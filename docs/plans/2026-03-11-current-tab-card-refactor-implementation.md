# CurrentTabCard Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the `CurrentTabCard` logic into a bulletproof, isolated architecture using IndexedDB as the single source of truth and the background script as a stateless messenger.

**Architecture:**

- **Foreground:** `useCurrentTabBookmark` hook watches `db.bookmarks` (optimistic) and requests stateless checks from background.
- **Background:** Stateless proxy for `api/bookmarks/check` and an autonomous `sync_queue` processor.
- **Service:** Optimistic writes to IndexedDB + `sync_queue` entries for all actions.

**Tech Stack:** React 19, WXT, Dexie (IndexedDB), Tailwind CSS v4, HeroUI v3.

---

### Task 1: Clean up IndexedDB & Service Layer

**Files:**

- Modify: `utils/db.ts`
- Modify: `utils/bookmarkService.ts`

**Step 1: Update DB Schema (Add \_sync_status to bookmarks if not present)**
Modify `utils/db.ts`:

```typescript
// Ensure bookmarks table includes _sync_status for optimistic tracking
bookmarks: 'id, url, unread, date_added, _sync_status',
```

**Step 2: Refactor `bookmarkService.toggleUnread` for Optimistic Updates**
Modify `utils/bookmarkService.ts`:

```typescript
async toggleUnread(id: number, currentUnread: boolean) {
  const newUnread = !currentUnread;
  // 1. Optimistic Update in DB
  await db.bookmarks.update(id, {
    unread: newUnread,
    _sync_status: 'pending',
  });
  // 2. Add to Sync Queue
  await db.sync_queue.add({
    action: 'update',
    bookmark_id: id,
    payload: { unread: newUnread },
    timestamp: Date.now(),
  });
  // 3. Trigger Background Sync
  browser.runtime.sendMessage({ type: 'sync-request' });
}
```

**Step 3: Commit**

```bash
git add utils/db.ts utils/bookmarkService.ts
git commit -m "refactor(db): implement optimistic update logic in bookmarkService"
```

---

### Task 2: Refactor Background to Stateless Messenger

**Files:**

- Modify: `entrypoints/background.ts`

**Step 1: Remove redundant state and implement `api-check` handler**
Ensure `api-request` and `sync-request` are robust and don't store local state for the UI.

**Step 2: Commit**

```bash
git add entrypoints/background.ts
git commit -m "refactor(bg): ensure background is a stateless proxy for UI requests"
```

---

### Task 3: Implement `useCurrentTabBookmark` Hook

**Files:**

- Create: `hooks/useCurrentTabBookmark.ts`

**Step 1: Write the hook logic**

```typescript
import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'
import { useCurrentTabTracker } from './useCurrentTabTracker'

export function useCurrentTabBookmark() {
  const { currentTabUrl, realtimeMetadata } = useCurrentTabTracker()
  const [serverData, setServerData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 1. Watch local DB (The Truth)
  const bookmark = useLiveQuery(
    () =>
      currentTabUrl
        ? db.bookmarks.where('url').equals(currentTabUrl).first()
        : null,
    [currentTabUrl],
  )

  // 2. Stateless Check when URL changes
  useEffect(() => {
    if (!currentTabUrl || bookmark) return

    setIsLoading(true)
    browser.runtime
      .sendMessage({
        type: 'api-request',
        url: `/api/bookmarks/check/?url=${encodeURIComponent(currentTabUrl)}`,
      })
      .then(res => {
        if (res.ok) setServerData(res.data)
      })
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
git commit -m "feat(hooks): add useCurrentTabBookmark for reactive DB-first state"
```

---

### Task 4: Refactor `BookmarksList` & `CurrentTabCard`

**Files:**

- Modify: `components/BookmarksList.tsx`
- Modify: `components/CurrentTabCard.tsx`

**Step 1: Replace SWR logic in `BookmarksList` with the new hook.**
**Step 2: Update `CurrentTabCard` to consume new cleaner props.**

**Step 3: Run Type Check**
Run: `pnpm compile`

**Step 4: Commit**

```bash
git add components/BookmarksList.tsx components/CurrentTabCard.tsx
git commit -m "refactor(ui): switch CurrentTabCard to use reactive hook architecture"
```
