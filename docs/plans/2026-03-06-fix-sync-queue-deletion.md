# Fix Sync Queue Deletion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the issue where 'delete' tasks remain stuck in the IndexedDB `sync_queue` if the server returns an error (like 404), and improve user feedback via toasts and better logging.

**Architecture:**

1. Update `processSyncQueue` in the background script to handle `404` and `410` responses as successful deletions.
2. Add a `toast.danger` notification when a sync operation fails unexpectedly.
3. Add a `<Toast.Provider />` to the root application to enable toast notifications.

**Tech Stack:** TypeScript, WXT (Background Service Worker), Dexie (IndexedDB), HeroUI v3 (Toast)

---

### Task 1: Setup HeroUI Toast Provider

**Files:**

- Modify: `entrypoints/sidepanel/main.tsx`

**Step 1: Add Toast.Provider**

```typescript
import { Toast } from '@heroui/react'

// Wrap App or add sibling to App
<ThemeProvider>
  <Toast.Provider placement="bottom end" />
  <App />
  {import.meta.env.DEV && <Agentation />}
</ThemeProvider>
```

**Step 2: Commit**

```bash
git add entrypoints/sidepanel/main.tsx
git commit -m "chore: add HeroUI Toast.Provider to sidepanel"
```

---

### Task 2: Update Background Sync Logic

**Files:**

- Modify: `entrypoints/background.ts`

**Step 1: Update processSyncQueue logic**

The logic should:

1. Treat `404 Not Found` and `410 Gone` as successful deletions (remove from queue).
2. Treat any `2xx` response as success.
3. Show a toast if an operation fails (excluding 404/410 for deletes).

**Proposed Change in `processSyncQueue`:**

```typescript
import { toast } from '@heroui/react'

// ... inside loop ...
const isDeletedOnServer = response.status === 404 || response.status === 410
const isSuccess = response.ok || (op.action === 'delete' && isDeletedOnServer)

if (isSuccess) {
  await db.sync_queue.delete(op.id!)
  if (op.action === 'update' && response.ok) {
    await db.bookmarks.update(op.bookmark_id, {
      _sync_status: 'synced',
    })
  }
} else {
  console.error(`Sync failed for ${op.action} on bookmark ${op.bookmark_id}:`, {
    status: response.status,
    statusText: response.statusText,
    operation: op,
  })

  // Show toast to user for actual errors
  toast.danger(`Failed to sync ${op.action}`, {
    description: `Server returned ${response.status}: ${response.statusText}`,
  })
}
```

**Step 2: Add diagnostic logging**

Add `console.log` at the start of `processSyncQueue` to track when sync starts.

**Step 3: Commit**

```bash
git add entrypoints/background.ts
git commit -m "fix: remove delete tasks from sync queue if bookmark not found on server and add toast on error"
```

---

### Task 3: Verification

**Step 1: Manual Verification**

1. Trigger a deletion in the sidepanel.
2. Observe the `Application` tab in DevTools for the `sync_queue` table.
3. Verify the task is removed even if the server returns 404 (simulated by deleting on server first).
4. Verify a toast appears if the server returns a 500 or network error.
5. Check the background page console for the new logs.
