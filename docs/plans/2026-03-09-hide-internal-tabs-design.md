# Design Doc: Hide Internal Tabs in Current Tab Card

**Goal:** Ensure the `CurrentTabCard` disappears immediately when the user switches to a browser-internal tab (e.g., `chrome://`, `about:blank`, `edge://`) to prevent "information delay" and stale data visibility.

## Problem

Currently, switching to an internal tab leaves the `CurrentTabCard` visible with the previous tab's data for a few seconds. This happens because the state in `useCurrentTabTracker` is not immediately cleared or is cleared in a way that allows stale data to persist.

## Architecture & Data Flow

### 1. Source-Level Reset (`useCurrentTabTracker.ts`)

The `useCurrentTabTracker` hook is the single source of truth for the active tab's URL and realtime metadata (title, favicon). We will update its logic to:

- **Querying:** In `syncCurrentTab`, if the active tab's URL does not start with `http` or `https`, it will explicitly dispatch a `SET_TAB` action with `null` values.
- **Updating:** In the `onUpdated` listener, any URL change to a non-HTTP(S) address will also trigger an immediate `SET_TAB` with `null` values.
- **State Integrity:** The `SET_TAB` action will clear `realtimeMetadata` (title, favicon) in addition to `currentTabUrl`.

### 2. SWR Integration (`BookmarksList.tsx`)

`BookmarksList` uses `currentTabUrl` as part of the SWR key.

- When `currentTabUrl` becomes `null`, the SWR key becomes `null`.
- SWR will clear its data (`currentTabCheckData` becomes `undefined`/`null`).
- This propagates to `BookmarksHeader`.

### 3. UI Reaction (`BookmarksHeader.tsx`)

`BookmarksHeader` uses the following logic:

```tsx
<div data-open={!!currentTabCheckData}>
```

When `currentTabCheckData` is cleared, the `data-open` attribute becomes `false`, triggering the CSS `grid-rows-[0fr]` transition and hiding the card.

## Supported Protocols

The extension will only track tabs with the following protocols:

- `http:`
- `https:`

All other protocols (e.g., `chrome:`, `chrome-extension:`, `about:`, `file:`, `view-source:`) will be treated as "unsupported," causing the card to disappear.

## Benefits

- **Robustness:** Handles all ways a tab can change (navigation, switching tabs, window focus).
- **Maintainability:** Fixes the issue at the data source, ensuring any future UI components using this hook are also protected from stale data.
- **Performance:** Prevents unnecessary API calls to Linkding for unsupported URLs.

## Implementation Steps

1.  Update `useCurrentTabTracker.ts` to strictly handle non-HTTP(S) URLs in `syncCurrentTab` and `onUpdated`.
2.  Verify the `SET_TAB` reducer action clears all metadata.
3.  Run `pnpm compile` and `pnpm format` to ensure code quality.
