# Unified Tab Card Options & Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add configurable bookmarking options (metadata fetching and default unread state) and fix the "stretching" animation in the current tab card.

**Architecture:**

- Use `wxt/storage` for persistent user preferences.
- Extend `SettingsForm` with HeroUI `RadioGroup` and `Switch` components.
- Use `motion.div` with `layout` and `AnimatePresence` with `mode="wait"` for smooth, non-stretching transitions.

**Tech Stack:** React, WXT Storage, HeroUI v3, Tailwind CSS v4, `motion/react`.

---

### Task 1: Update Storage Hooks

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/hooks/useSetup.ts`

**Step 1: Add new storage items**

```typescript
// hooks/useSetup.ts
export type MetadataSource = 'browser' | 'server'

const fetchMetadataFromStorage = storage.defineItem<MetadataSource>(
  'local:fetchMetadataFrom',
  {
    fallback: 'browser',
  },
)

const defaultUnreadStorage = storage.defineItem<boolean>(
  'local:defaultUnread',
  {
    fallback: true,
  },
)
```

**Step 2: Update `useSetup` hook to return them**

```typescript
// hooks/useSetup.ts
return {
  isSetupComplete,
  isLoading,
  serverStorage,
  apiTokenStorage,
  fetchMetadataFromStorage,
  defaultUnreadStorage,
}
```

**Step 3: Commit**

```bash
git add hooks/useSetup.ts
git commit -m "feat: add fetchMetadataFrom and defaultUnread to storage"
```

---

### Task 2: Update Settings UI

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/SettingsForm.tsx`

**Step 1: Add state and actions to reducer**

```typescript
// Add to SettingsState
fetchMetadataFrom: MetadataSource
defaultUnread: boolean

// Add to SettingsAction
| { type: 'SET_METADATA_FROM'; payload: MetadataSource }
| { type: 'SET_DEFAULT_UNREAD'; payload: boolean }
| { type: 'RESET_FORM'; payload: { server: string; apiToken: string; fetchMetadataFrom: MetadataSource; defaultUnread: boolean } }
```

**Step 2: Update reducer logic and initial state**

**Step 3: Add RadioGroup and Switch to the Form**

Use HeroUI components to add a "Preferences" section.

**Step 4: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat: add Preferences section to SettingsForm"
```

---

### Task 3: Update BookmarksList Logic

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/BookmarksList.tsx`

**Step 1: Read new storage values in `handleAdd`**

```typescript
const fetchFrom = await fetchMetadataFromStorage.getValue()
const defaultUnread = await defaultUnreadStorage.getValue()

const payload = {
  url,
  title: fetchFrom === 'browser' ? title : '',
  description: fetchFrom === 'browser' ? description : '',
  unread: defaultUnread,
}
```

**Step 2: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "feat: implement bookmarking preferences in handleAdd"
```

---

### Task 4: Fix Card Animation

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/CurrentTabCard.tsx`

**Step 1: Refactor to use AnimatePresence with mode="wait"**

Wrap the conditional branches in `AnimatePresence`.

```tsx
<motion.div layout style={{ height: 'auto' }}>
  <AnimatePresence mode="wait" initial={false}>
    {!isBookmarked ? (
      <motion.div
        key="add"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Compact Card */}
      </motion.div>
    ) : (
      <motion.div
        key="manage"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Full Card */}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```

**Step 2: Commit**

```bash
git add components/CurrentTabCard.tsx
git commit -m "fix: smooth card transition using AnimatePresence wait mode"
```

---

### Task 5: Verification

**Step 1: Run type check**

Run: `pnpm compile`

**Step 2: Format code**

Run: `pnpm format`
