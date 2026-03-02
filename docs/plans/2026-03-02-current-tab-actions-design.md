# Unified Current Tab Card Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Side Panel's current tab display into a unified card that always shows information about the active tab, allowing users to quickly Add or Delete/Manage the page in Linkding.

**Architecture:**

- Enhance `CurrentTabCard` to handle two states: `bookmarked` (showing Linkding data) and `not-bookmarked` (showing browser tab data).
- Update `BookmarksList` to always provide data for the `CurrentTabCard` even if no bookmark exists.
- Implement `POST` (Create) and `DELETE` (Delete) actions in `background.ts` and `BookmarksList`.

**Tech Stack:** React, HeroUI v3, WXT, SWR.

---

## Data Flow & API Usage

1. **Check Status:** Use `GET /api/bookmarks/check/?url=...` to check if the current URL is bookmarked.
2. **Add Bookmark:** Use `POST /api/bookmarks/` with `url`, `title`, and `description` from the browser tab.
3. **Delete Bookmark:** Use `DELETE /api/bookmarks/<id>/`.
4. **Update List:** Use SWR's `mutate` to refresh the bookmarks list and the card state after actions.

## UI States

### State: Bookmarked (Existing)

- **Title:** Bookmark title from Linkding.
- **URL:** Bookmark URL.
- **Tags:** Displayed as Chips.
- **Actions:**
  - "Mark as Read/Unread" (Primary/Ghost button).
  - "Delete" (Ghost button with Trash icon in header or footer).
- **Appearance:** Full card as it is now.

### State: Not Bookmarked (New)

- **Title:** Page title from browser tab.
- **URL:** Page URL from browser tab.
- **Actions:**
  - "Add to Linkding" (Primary button).
- **Appearance:** Compact (2-3 lines). No tags, no preview image. Header shows "Not in Linkding".

---

## Design Approaches

1. **Approach 1: Polymorphic Card (Recommended)**
   - Single `CurrentTabCard` component that takes `bookmark | null` and `activeTab | null`.
   - Internal conditional rendering for compact vs full view.
   - _Reasoning:_ Simplest maintenance, shared styling and logic for tab tracking.

2. **Approach 2: Separate Components**
   - `CurrentTabCard` (existing) and `AddCurrentTabCard` (new).
   - _Reasoning:_ Harder to maintain consistent layout/transitions in the `BookmarksList` sticky area.

---

## Refined Plan

### Phase 1: Background & API

- Add `api-post` and `api-delete` handlers to `entrypoints/background.ts`.
- Update `fetchCurrentTabBookmark` to use the `/check/` endpoint instead of search, for more accurate metadata and auto-tags.

### Phase 2: Component Enhancement

- Modify `CurrentTabCard` to support the compact "Not Bookmarked" state.
- Add "Add" and "Delete" buttons with proper loading states.

### Phase 3: Integration

- Update `BookmarksList` to manage the lifecycle of Adding/Deleting.
- Ensure optimistic updates for a snappy feel.

---

## Execution Choice

Plan complete and saved to `docs/plans/2026-03-02-current-tab-actions-design.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints.

Which approach?
