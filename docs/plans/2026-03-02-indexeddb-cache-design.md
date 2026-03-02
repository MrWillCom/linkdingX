# IndexedDB Caching and Lazy Sync Design

**Date:** 2026-03-02
**Status:** Approved
**Topic:** Implementing an offline-first, lazy-sync caching layer using IndexedDB and Dexie.

## 1. Abstract

Transition the extension from a memory-only SWR cache to a persistent local-first architecture. Data is stored in IndexedDB (IDB) using Dexie.js. The UI remains reactive to local changes, while a background process handles synchronization with the linkding server.

## 2. Architecture

### 2.1 Database Schema (Dexie)

We will use a database named `LinkdingDB`.

- **`bookmarks` table**:
  - `id`: number (Primary Key, from server)
  - `url`: string (Indexed)
  - `title`: string
  - `description`: string
  - `unread`: boolean (Indexed)
  - `date_added`: string (Indexed)
  - `date_modified`: string
  - `tag_names`: string[]
  - `_sync_status`: 'synced' | 'pending' | 'error' (Internal)

- **`sync_queue` table**:
  - `id`: number (Auto-incrementing PK)
  - `action`: 'create' | 'update' | 'delete'
  - `bookmark_id`: number (Foreign key to bookmarks.id)
  - `payload`: object (The data to send to server)
  - `timestamp`: number

### 2.2 Component Data Flow

1. **Reading**: Components use `useLiveQuery` from `dexie-react-hooks`. This replaces `useSWR` for the primary list display.
2. **Mutations**:
   - Component calls `bookmarkService.toggleUnread(id)`.
   - `bookmarkService` updates `bookmarks` table immediately (UI updates instantly).
   - `bookmarkService` adds a record to `sync_queue`.
   - `bookmarkService` triggers a message to `background.ts` to process the queue.

### 2.3 Lazy Sync Strategy

- **Initial Load**: Display what's in IDB.
- **Revalidation**: Fetch page 1 from the server. Update IDB with any changes.
- **Pagination**: When the user scrolls to the bottom, fetch the next page from the server, save to IDB, and the UI will automatically append them via `useLiveQuery`.
- **Search**: (Future) Search will run against the local IDB first, with an optional "Search Server" fallback.

## 3. Implementation Details

### 3.1 Background Worker

The background script will maintain a sync loop:

1. Watch `sync_queue`.
2. For each item:
   - Attempt API call.
   - On success: remove from `sync_queue`, update `bookmarks._sync_status = 'synced'`.
   - On failure (offline): wait for 'online' event or retry after delay.

### 3.2 Conflict Resolution

- **Last-Write-Wins**: Server is the source of truth for remote state.
- If a server update arrives for a bookmark that has a `pending` sync status locally, we preserve the local changes in the `bookmarks` table but update other fields from the server.

## 4. Risks & Mitigations

- **DB Corruption**: Implement a reset/wipe mechanism in Settings.
- **Large DB**: Monitor storage usage; bookmarks are typically small (KB), so even 10k bookmarks will fit easily within browser quotas.
