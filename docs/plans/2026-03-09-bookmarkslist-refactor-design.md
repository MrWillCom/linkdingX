# Design Document: BookmarksList Refactor (2026-03-09)

## Problem Statement

The `BookmarksList.tsx` component (566 lines) has several React anti-patterns identified by `react-doctor`:

1.  **Too many `useState` calls (6)**: Consider `useReducer` for related state.
2.  **Too many `setState` calls in one `useEffect` (9)**: Risk of inconsistent state updates and unnecessary re-renders.
3.  **Component size (423+ lines)**: Hard to maintain and reason about.
4.  **Sequential await statements**: Independent storage calls in `handleAdd` should be parallelized with `Promise.all()`.

## Proposed Solution

A **Modular Refactor** that extracts state management into custom hooks and UI into smaller components while maintaining functional parity and strict TypeScript compliance.

### 1. Data Layer: Custom Hooks

- **`useCurrentTabTracker`**:
  - Encapsulates `browser.tabs` event listeners.
  - Uses `useReducer` to manage `currentTabUrl`, `realtimeMetadata`, and `pollingStatus`.
  - Exposes `syncCurrentTab` and state values.
- **`useBookmarksManager`**:
  - Handles `useSWRInfinite` for paginated bookmarks.
  - Syncs remote data with local Dexie DB (`db.bookmarks.bulkPut`).
  - Provides `filteredBookmarks`, `isLoadingMore`, and `loadMore` functions.

### 2. UI Layer: Modular Components

- **`BookmarksHeader`**: Contains `FilterTabs`, global action buttons (open in new tab, settings), and the `CurrentTabCard` container logic.
- **`BookmarksInfiniteList`**: Handles the `IntersectionObserver` for infinite scrolling and renders `BookmarkItem` components.

### 3. Logic Optimization

- Refactor `handleAdd` to use `Promise.all()` for fetching independent configuration items from `storage`.
- Simplify `BookmarksList` (entry point) to orchestrate these hooks and components.

## Success Criteria

- Zero `react-doctor` warnings related to `BookmarksList.tsx`.
- Full functional parity: Tab tracking, filtering, infinite scroll, and bookmark actions (add/delete/toggle) work as before.
- Successful `pnpm compile` and `pnpm format`.
