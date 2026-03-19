# Fix Pagination & Infinite Scroll Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure the bookmarks list scrolls infinitely and the "Load more" button works reliably by auto-fetching until new items are found.

**Architecture:** Use a `useEffect` in the manager hook to detect empty/duplicate page results and trigger the next page automatically. Improve `IntersectionObserver` configuration in the UI component and add scroll-based revalidation.

**Tech Stack:** React 19, SWR Infinite, Dexie.

---

### Task 1: Update `useBookmarksManager` for Auto-Pagination

**Files:**

- Modify: `hooks/useBookmarksManager.ts`

**Step 1: Implement Recursive Fetch Logic**

Update `useBookmarksManager` to watch for "stuck" pagination. If a fetch completes but the `filteredBookmarks` list hasn't grown despite `hasMore` being true, increment `size`.

```typescript
// Inside useBookmarksManager
useEffect(() => {
  if (
    !isLoading &&
    !isValidating &&
    hasMore &&
    filteredBookmarks.length < (size * PAGE_SIZE) / 2
  ) {
    // If we have very few filtered bookmarks relative to the pages fetched,
    // and we're not currently loading, fetch the next page automatically.
    // Use a small delay to avoid hammering the API
    const timer = setTimeout(() => setSize(s => s + 1), 100)
    return () => clearTimeout(timer)
  }
}, [filteredBookmarks.length, size, isLoading, isValidating, hasMore, setSize])
```

**Step 2: Run compile to verify types**

Run: `pnpm compile`
Expected: PASS

**Step 3: Commit**

```bash
git add hooks/useBookmarksManager.ts
git commit -m "feat(hooks): add recursive auto-pagination to bookmarks manager"
```

### Task 2: Improve `IntersectionObserver` & Scroll Reliability

**Files:**

- Modify: `components/BookmarksList.tsx`

**Step 1: Fix Observer Config and Reset Ref**

Update the observer in `BookmarksList.tsx` to include a `rootMargin` and reset the `hasTriggeredLoadRef` when loading finishes.

```typescript
// In BookmarksList.tsx
useEffect(() => {
  if (!isLoadingMore) {
    hasTriggeredLoadRef.current = false
  }
}, [isLoadingMore])

useEffect(() => {
  if (!loadMoreRef.current) return

  const observer = new IntersectionObserver(
    entries => {
      const { isLoadingMore, hasMore, loadMore } = stateRef.current
      if (entries[0].isIntersecting && !isLoadingMore) {
        if (hasMore) {
          hasTriggeredLoadRef.current = true
          loadMore()
        }
      }
    },
    {
      threshold: 0.1,
      rootMargin: '200px', // Trigger earlier
    },
  )

  observer.observe(loadMoreRef.current)
  return () => observer.disconnect()
}, [])
```

**Step 2: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "fix(ui): improve infinite scroll observer and add scroll revalidation"
```

### Task 3: Sync "Load more" Button UI

**Files:**

- Modify: `components/BookmarksInfiniteList.tsx`

**Step 1: Ensure button recovery**

Update visibility logic to be more resilient.

**Step 2: Run format**

Run: `pnpm format`

**Step 3: Commit**

```bash
git add components/BookmarksInfiniteList.tsx
git commit -m "fix(ui): ensure Load More button is visible when observer fails"
```
