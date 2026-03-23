# Delete Bookmark Confirmation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a HeroUI Popover confirmation to the "Delete" button in `CurrentTabCard.tsx`.

**Architecture:** Use `useState` to manage the Popover's `isOpen` state. Wrap the Trash2 button in a `Popover` component with a `bottom-end` placement. Trigger the `onDelete` action and close the popover upon user confirmation.

**Tech Stack:** React, HeroUI v3 (Popover, Button), Lucide Icons (Trash2).

---

### Task 1: Add Popover Confirmation to CurrentTabCard

**Files:**

- Modify: `components/CurrentTabCard.tsx`

**Step 1: Import Popover from HeroUI**

```typescript
import { Card, Link, Chip, Button, Popover } from '@heroui/react'
```

**Step 2: Add isOpen state**

```typescript
const [isDeletePopoverOpen, setIsDeletePopoverOpen] = useState(false)
```

**Step 3: Implement Popover UI**

Replace the existing "Delete" button with:

```tsx
<Popover
  isOpen={isDeletePopoverOpen}
  onOpenChange={open => setIsDeletePopoverOpen(open)}
  placement="bottom-end"
  showArrow
>
  <Popover.Trigger>
    <Button
      size="sm"
      variant="ghost"
      isIconOnly
      className="text-danger hover:bg-danger-50"
      aria-label="Delete bookmark"
      isDisabled={isLoading || isValidating}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </Popover.Trigger>
  <Popover.Content>
    <div className="p-3">
      <p className="text-sm mb-3">Delete this bookmark?</p>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onPress={() => setIsDeletePopoverOpen(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="danger"
          onPress={() => {
            onDelete?.(bookmark.id)
            setIsDeletePopoverOpen(false)
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  </Popover.Content>
</Popover>
```

**Step 4: Verify UI and Behavior**

1. Click Trash2 button -> Popover opens.
2. Click Cancel -> Popover closes.
3. Click Delete -> Bookmark is deleted and Popover closes.

**Step 5: Commit**

```bash
git add components/CurrentTabCard.tsx
git commit -m "feat: add delete confirmation popover"
```
