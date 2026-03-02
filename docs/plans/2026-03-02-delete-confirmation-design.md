# Design Doc: Delete Bookmark Confirmation Popover

Add a second confirmation step when deleting a bookmark from the Unified Current Tab Card using a HeroUI Popover.

## Goal

Prevent accidental deletions by requiring a second click within a popover, ensuring the UI remains compact and non-disruptive within the extension side panel.

## Design

### UI Components

- **HeroUI Popover**: Will wrap the existing "Delete" (Trash2) button.
- **Trigger**: The Trash2 button.
- **Content**: A small confirmation box with:
  - Text: "Delete this bookmark?"
  - "Cancel" button (Ghost variant).
  - "Confirm Delete" button (Danger variant).
- **Placement**: `bottom-end` (as requested).

### Logic

1. Use controlled state `isOpen` for the Popover to manage its visibility.
2. Clicking the Trash2 button opens the Popover.
3. Clicking "Cancel" closes it.
4. Clicking "Confirm Delete" triggers the `onDelete` callback and closes the Popover.
5. While `isLoading` or `isValidating`, the Trash2 button remains disabled, preventing the popover from opening.

### Styling

- Popover backdrop: `transparent` (default).
- Popover offset: `10px` from the trigger.
- Content: Padded with `p-3` or `p-4` with Tailwind classes.

## Alternatives Considered

- **Alert Dialog**: Centered on screen, more disruptive to flow.
- **Tooltip Confirmation**: Too small/unclear.
- **Double Click**: No visual affordance.

## Approval

User approved `Popover` with `bottom-end` placement.
