# IndexedDB Caching Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transition the extension from a memory-only SWR cache to a persistent local-first architecture using Dexie.js and IndexedDB.

**Architecture:** This plan follows the **Offline-First Sync** approach using **Lazy Sync**. We will introduce a `db` utility using `dexie`, a `bookmarkService` for mutations, and a background sync loop.

**Tech Stack:** Dexie.js, dexie-react-hooks, React 19, WXT.

---

### Task 1: Initialize Database & Sync Queue

**Files:**

- Create: `utils/db.ts`
- Modify: `package.json`

**Step 1: Install Dexie**
Run: `pnpm add dexie dexie-react-hooks`

**Step 2: Define Database Schema**

```typescript
import Dexie, { type EntityTable } from 'dexie'
import type { Bookmark } from '@/components/BookmarksList'

export interface SyncOperation {
  id?: number
  action: 'create' | 'update' | 'delete'
  bookmark_id: number
  payload: Partial<Bookmark>
  timestamp: number
}

const db = new Dexie('LinkdingDB') as Dexie & {
  bookmarks: EntityTable<Bookmark & { _sync_status?: string }, 'id'>
  sync_queue: EntityTable<SyncOperation, 'id'>
}

db.version(1).stores({
  bookmarks: 'id, url, unread, date_added',
  sync_queue: '++id, bookmark_id, action',
})

export { db }
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml utils/db.ts
git commit -m "feat: initialize Dexie database schema"
```

---

### Task 2: Implement Bookmark Service (Local First)

**Files:**

- Create: `utils/bookmarkService.ts`

**Step 1: Write local-first mutations**

```typescript
import { db } from './db'
import type { Bookmark } from '@/components/BookmarksList'

export const bookmarkService = {
  async toggleUnread(id: number, currentUnread: boolean) {
    const newUnread = !currentUnread
    await db.bookmarks.update(id, {
      unread: newUnread,
      _sync_status: 'pending',
    })
    await db.sync_queue.add({
      action: 'update',
      bookmark_id: id,
      payload: { unread: newUnread },
      timestamp: Date.now(),
    })
    // Trigger background sync
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async deleteBookmark(id: number) {
    await db.bookmarks.delete(id)
    await db.sync_queue.add({
      action: 'delete',
      bookmark_id: id,
      payload: {},
      timestamp: Date.now(),
    })
    browser.runtime.sendMessage({ type: 'sync-request' })
  },

  async addBookmark(bookmark: Bookmark) {
    await db.bookmarks.add({ ...bookmark, _sync_status: 'synced' })
  },
}
```

**Step 2: Commit**

```bash
git add utils/bookmarkService.ts
git commit -m "feat: add bookmarkService for local-first mutations"
```

---

### Task 3: Background Sync Worker

**Files:**

- Modify: `entrypoints/background.ts`

**Step 1: Implement sync logic**

```typescript
import { db } from '@/utils/db'

async function processSyncQueue() {
  const operations = await db.sync_queue.toArray()
  for (const op of operations) {
    // Implement API call logic here based on action (PATCH/DELETE)
    // On success: db.sync_queue.delete(op.id)
    // On success: db.bookmarks.update(op.bookmark_id, { _sync_status: 'synced' })
  }
}

// Add to message listener
if (message.type === 'sync-request') {
  processSyncQueue()
}
```

**Step 2: Commit**

```bash
git add entrypoints/background.ts
git commit -m "feat: implement background sync worker"
```

---

### Task 4: Refactor UI to use useLiveQuery

**Files:**

- Modify: `components/BookmarksList.tsx`

**Step 1: Replace useSWR with useLiveQuery**

```typescript
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/utils/db'

// ... inside component ...
const bookmarks =
  useLiveQuery(() => db.bookmarks.orderBy('date_added').reverse().toArray()) ||
  []
```

**Step 2: Update pagination to save to IDB**
Modify `fetcher` or `useEffect` to call `db.bookmarks.bulkPut(results)` when new pages arrive.

**Step 3: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "feat: refactor UI to use reactive IndexedDB queries"
```

---

### Task 5: Cleanup & Verification

**Files:**

- Modify: `components/BookmarksList.tsx`
- Modify: `entrypoints/background.ts`

**Step 1: Finalize revalidation logic**
Ensure page 1 is refetched on startup and synced to IDB.

**Step 2: Verify offline behavior**
Test toggling unread while "offline" (simulated in DevTools) and verify it syncs when "online".

**Step 3: Commit**

```bash
git add .
git commit -m "feat: final polish for IndexedDB caching"
```
