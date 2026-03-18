# Refactor BookmarksList Layout for Full-Viewport Scrolling

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable full-viewport scrolling in the 'expanded' view of `BookmarksList` by decoupling the scroll container from the `max-width` constraint.

**Architecture:** The outer `div` remains the scroll container (`overflow-y-auto`) and is always full-width. A new inner wrapper `div` will handle the `max-w-3xl mx-auto` constraint for the 'expanded' variant, ensuring that the entire viewport is clickable/scrollable.

**Tech Stack:** React 19, Tailwind CSS v4, HeroUI v3.

---

### Task 1: Refactor BookmarksList.tsx structure

**Files:**

- Modify: `components/BookmarksList.tsx:172-202`

**Step 1: Write the failing test**
_Note: Since Vitest is not configured, we will rely on manual verification and `pnpm compile` for type safety. Visual changes are best verified in-browser._

**Step 2: Modify the JSX structure**

Change the current structure:

```tsx
  return (
    <div
      onScroll={handleScroll}
      className={`h-screen overflow-y-auto relative ${variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}`}
    >
      <BookmarksHeader ... />
      <BookmarksInfiniteList ... />
    </div>
  )
```

To:

```tsx
return (
  <div
    onScroll={handleScroll}
    className="h-screen overflow-y-auto relative w-full"
  >
    <div className={variant === 'expanded' ? 'max-w-3xl mx-auto' : ''}>
      <BookmarksHeader
        unreadFilter={unreadFilter}
        onUnreadFilterChange={setUnreadFilter}
        variant={variant}
        currentTabUrl={currentTabUrl}
        currentTabBookmark={currentTabBookmark}
        currentTabMetadata={currentTabMetadata}
        realtimeMetadata={realtimeMetadata}
        isCurrentTabBookmarkLoading={isCurrentTabBookmarkLoading}
        onToggleUnread={handleToggleUnread}
        onAdd={handleAdd}
        onDelete={handleDelete}
        isScrolled={isScrolled}
      />

      <BookmarksInfiniteList
        filteredBookmarks={filteredBookmarks}
        unreadFilter={unreadFilter}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        hasTriggeredLoadRef={hasTriggeredLoadRef}
        loadMoreRef={loadMoreRef}
        loadMore={loadMore}
        onToggleUnread={handleToggleUnread}
      />
    </div>
  </div>
)
```

**Step 3: Run type check**

Run: `pnpm compile`
Expected: Done in ... (no errors)

**Step 4: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "fix: enable full-viewport scrolling by decoupling scroll container from max-width"
```
