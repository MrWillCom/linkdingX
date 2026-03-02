# CurrentTabCard Realtime and Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement realtime metadata updates and post-addition polling sync for the `CurrentTabCard`.

**Architecture:**

- **Realtime Metadata:** Use `browser.tabs.onUpdated` in `BookmarksList.tsx` to track current tab title/favicon changes.
- **Polling Sync:** Trigger a 2s polling interval (up to 5 times) in `BookmarksList.tsx` after `handleAdd` to refresh `currentTabCheckData` via SWR's `mutate`.

**Tech Stack:** React 19, WXT, SWR, HeroUI.

---

### Task 1: Add Realtime Metadata State to BookmarksList

**Files:**

- Modify: `components/BookmarksList.tsx:145-150` (Add state)
- Modify: `components/BookmarksList.tsx:255-285` (Update `onUpdated` listener)

**Step 1: Define `realtimeMetadata` state**
Add `const [realtimeMetadata, setRealtimeMetadata] = useState<{ title: string; favicon: string | null }>({ title: '', favicon: null })`.

**Step 2: Update `onUpdated` listener**
Inside the `useEffect` with `browser.tabs.onUpdated`, capture `changeInfo.title` and `changeInfo.favIconUrl` for the active tab and update `realtimeMetadata`.

**Step 3: Reset on tab change**
Ensure `realtimeMetadata` is reset or updated when `onActivated` fires.

**Step 4: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "feat(bookmarks): add realtime metadata tracking for active tab"
```

### Task 2: Pass Realtime Metadata to CurrentTabCard

**Files:**

- Modify: `components/CurrentTabCard.tsx:25-38` (Update props)
- Modify: `components/CurrentTabCard.tsx:40-55` (Prioritize realtime data)
- Modify: `components/BookmarksList.tsx:515-525` (Pass new prop)

**Step 1: Update `CurrentTabCardProps`**
Add `realtimeMetadata?: { title: string; favicon: string | null }`.

**Step 2: Update `CurrentTabCard` logic**

```typescript
const title =
  bookmark?.title ||
  realtimeMetadata?.title ||
  metadata?.title ||
  currentTabUrl ||
  ''
const favicon = bookmark?.favicon_url || realtimeMetadata?.favicon || null
```

**Step 3: Pass prop in `BookmarksList`**
Pass `realtimeMetadata={realtimeMetadata}` to `<CurrentTabCard />`.

**Step 4: Commit**

```bash
git add components/BookmarksList.tsx components/CurrentTabCard.tsx
git commit -m "feat(ui): update CurrentTabCard to use realtime browser metadata"
```

### Task 3: Implement Post-Add Polling Sync

**Files:**

- Modify: `components/BookmarksList.tsx:385-415` (Update `handleAdd`)

**Step 1: Implement polling in `handleAdd`**
After `response.ok`, start an interval that calls `mutateCurrentTabBookmark()` every 2 seconds.
Stop after 5 attempts or if the `bookmark` returned has a populated `preview_image_url` or `web_archive_snapshot_url`.

**Step 2: Refine polling logic**
Use a `ref` or similar to track the number of polling attempts to avoid memory leaks or infinite loops.

**Step 3: Verify with `pnpm compile`**
Ensure types are still correct.

**Step 4: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "feat(sync): implement post-addition polling sync for bookmarks"
```
