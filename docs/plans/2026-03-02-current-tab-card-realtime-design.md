# CurrentTabCard Realtime and Sync Design

**Goal:** Improve the `CurrentTabCard` to show realtime browser tab metadata and reliably sync with the Linkding server after a bookmark is added.

**Architecture:**

- **Realtime Metadata:** Use `browser.tabs.onUpdated` in `BookmarksList` to track title and favicon changes for the active tab, passing this "live" data to `CurrentTabCard`.
- **Post-Addition Sync:** Implement a polling mechanism in `BookmarksList` using `useSWR`'s `mutate` or a dedicated timer to fetch the latest bookmark state (including server-side metadata like archives and previews) after a successful add operation.

**Success Criteria:**

- `CurrentTabCard` reflects title/favicon changes immediately without page reload.
- After clicking "Add to Linkding", the card eventually shows the server-generated metadata (e.g., preview images, archive links) within a few seconds.

---

## Design Sections

### 1. Realtime Metadata State

- **Store:** `BookmarksList` component.
- **State:** `realtimeMetadata: { title: string, favicon: string }`.
- **Trigger:** `browser.tabs.onUpdated` where `tabId` is the active tab.
- **Priority:** In `CurrentTabCard`, `realtimeMetadata` > `metadata` (from check API) > `url`.

### 2. Polling Sync Logic

- **Trigger:** Successful `handleAdd` in `BookmarksList`.
- **Mechanism:**
  - Set `isPolling: true`.
  - Run an interval (2s) that calls `mutateCurrentTabBookmark`.
  - Stop after 5 attempts OR if `bookmark.preview_image_url` / `bookmark.web_archive_snapshot_url` becomes populated (or if the bookmark state changes significantly).
- **Concurrency:** Ensure polling doesn't conflict with user-initiated refreshes.

### 3. UI Refinements

- **Loading State:** Maintain `isValidating` / `isLoading` visibility while polling to signal the background sync.
- **Button Feedback:** Keep "Add" button disabled during the initial poll to prevent duplicate adds if the user clicks quickly (though the API check usually handles this).
