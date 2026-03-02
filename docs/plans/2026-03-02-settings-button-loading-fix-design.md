# Design: Settings Form Save Button State Fix

The current `SettingsForm.tsx` implementation leaves the "Save" button in a loading/disabled state after a successful save because `isLoading` is only set to `false` in error cases or when explicitly loading initial values.

## Architecture & Data Flow

1. **State Management**: The form uses `useReducer`.
2. **Current Issue**: `isLoading` is set to `true` at the start of `onSave` but only reset to `false` in the `catch` block (via `SET_ERROR`).
3. **The Fix**: Add an explicit `SET_LOADING` to `false` in the `onSave` success path.

## Components

- `SettingsForm.tsx`: Update `onSave` logic.

## Trade-offs

- **Explicit vs. Finally**: Using an explicit dispatch is easier to read in the context of the existing `useReducer` flow.

## Testing

- Manual verification: Save settings and confirm the button returns to its active state (not loading/disabled).
