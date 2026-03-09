# Fix Bookmark Deletion Cache Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the issue where deleted bookmarks still appear in the "Current Tab" card by manually updating the SWR cache.

**Architecture:** Update the `handleDelete` function in `BookmarksList.tsx` to call `mutateCurrentTabBookmark(null, { revalidate: false })` immediately after the deletion service call. This ensures the UI reflects the "not bookmarked" state without waiting for a background revalidation.

**Tech Stack:** React 19, SWR, Dexie (IndexedDB)

---

### Task 1: Update handleDelete in BookmarksList.tsx

**Files:**

- Modify: `components/BookmarksList.tsx:417-419`

**Step 1: Read existing implementation**
Read `components/BookmarksList.tsx` around line 417 to confirm context.

**Step 2: Apply the fix**

```typescript
const handleDelete = async (id: number) => {
  await bookmarkService.deleteBookmark(id)
  // Manually clear the SWR cache for the current tab bookmark
  // to prevent it from flashing back to the "bookmarked" state
  mutateCurrentTabBookmark(null, {
    revalidate: false,
  })
}
```

**Step 3: Verify compilation**
Run: `pnpm compile`
Expected: Success

**Step 4: Format code**
Run: `pnpm format`
Expected: Success

**Step 5: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "fix: clear current tab bookmark cache after deletion"
```
