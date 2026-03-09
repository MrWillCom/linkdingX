# Design: Cache Cleaner (Maintenance Modal)

**Date**: 2026-03-09  
**Status**: Approved

## Overview

Implement a "Maintenance" section in the extension's Options page to allow users to manually clear local data (Bookmark Cache and/or Sync Queue). This is intended as a recovery tool for rare "ghost item" or synchronization issues.

## Requirements

- **Selection Control**: Users choose exactly which data to clean.
- **Safety**: Clear warnings for destructive actions (Sync Queue).
- **Ease of Use**: Modal-based interface accessible from Settings.
- **Immediate Recovery**: (Optional) Trigger sync after clearing bookmarks.

## User Interface (Option B)

### Section: Maintenance

- Location: Bottom of `SettingsForm.tsx`.
- Element: A "Clean Local Data..." button.

### Modal: "Clean Local Data"

- **Backdrop**: Blur variant.
- **Header**: "Clean Local Data" with a warning icon.
- **Body**:
  - **Checkbox 1**: `Bookmark Cache` (Value: `bookmarks`) - Checked by default.
  - **Checkbox 2**: `Pending Sync Queue` (Value: `sync_queue`) - Unchecked by default.
  - **Contextual Warning**: If `sync_queue` is selected, display: "Warning: Clearing the sync queue will lose any unsaved changes that haven't reached the server yet."
- **Footer**:
  - `Cancel` (Tertiary)
  - `Clean Selected Data` (Danger)

## Implementation Details

### Logic

1. Use `db.bookmarks.clear()` to empty the cache.
2. Use `db.sync_queue.clear()` to empty pending operations.
3. Use `toast.success()` to confirm completion.
4. Notify background script to re-sync if cache was cleared (using existing messaging system).

### Components

- `entrypoints/options/SettingsForm.tsx`: Entry point for UI changes.
- `utils/db.ts`: Data source.
- `entrypoints/background.ts`: Sync orchestration.

## Verification

- `pnpm compile`: Verify types.
- `pnpm format`: Maintain style.
- Manual test: Verify data is actually cleared from IndexedDB via DevTools.
