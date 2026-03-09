# Fix Bookmark Deletion UI State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the current tab card remains visible in the "Not in Linkding" state after a bookmark is deleted, instead of disappearing.

**Architecture:** Update the `handleDelete` function in `BookmarksList.tsx` to preserve the current page's metadata while clearing the `bookmark` object in the SWR cache.

**Tech Stack:** React, SWR, WXT, HeroUI.

---

### Task 1: Update handleDelete logic in BookmarksList.tsx

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/BookmarksList.tsx`

**Step 1: Update handleDelete to preserve metadata**

In `handleDelete`, replace the simple `mutateCurrentTabBookmark(null)` with a functional update that clears only the `bookmark` property.

```typescript
const handleDelete = async (id: number) => {
  await bookmarkService.deleteBookmark(id)
  // Update SWR cache while preserving metadata to keep the card visible
  mutateCurrentTabBookmark(
    prev => (prev ? { ...prev, bookmark: null } : null),
    { revalidate: false },
  )
}
```

**Step 2: Commit changes**

```bash
git add /Users/will/Developer/MrWillCom/linkdingX/components/BookmarksList.tsx
git commit -m "fix: preserve metadata after bookmark deletion to show 'Not in Linkding' state"
```

### Task 2: Verification

**Step 1: Run type check**

Run: `pnpm compile`
Expected: Success

**Step 2: Run formatting**

Run: `pnpm format`
Expected: Success
