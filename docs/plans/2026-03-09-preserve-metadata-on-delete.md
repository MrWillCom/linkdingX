# Preserve Metadata on Bookmark Deletion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `handleDelete` in `BookmarksList.tsx` to preserve the current page's metadata in the SWR cache after deleting a bookmark, ensuring the card stays visible in the "Not in Linkding" state instead of disappearing.

**Architecture:** Use a functional update with SWR's `mutate` function to selectively clear only the `bookmark` object while keeping the rest of the cache (metadata).

**Tech Stack:** React, SWR

---

### Task 1: Update handleDelete logic

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/BookmarksList.tsx:423-426`

**Step 1: Update implementation**

Replace the existing `handleDelete` with the following:

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

**Step 2: Verify with compilation**

Run: `pnpm compile`
Expected: SUCCESS

**Step 3: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "fix: preserve metadata in SWR cache after bookmark deletion"
```
