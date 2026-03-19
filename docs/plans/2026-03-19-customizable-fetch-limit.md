# Customizable Fetch Limit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to customize the number of bookmarks fetched per page (limit) in the settings.

**Architecture:** Add a new WXT storage item for the fetch limit, expose it via the `useSetup` hook, and update the `SettingsForm` to allow editing. Finally, update `useBookmarksManager` to use this dynamic limit.

**Tech Stack:** React 19, WXT Storage, SWR Infinite.

---

### Task 1: Add Fetch Limit to Storage and Hook

**Files:**

- Modify: `hooks/useSetup.ts`

**Step 1: Define `fetchLimitStorage`**

Add the following storage item definition and return it from the hook.

```typescript
const fetchLimitStorage = storage.defineItem<number>('local:fetchLimit', {
  fallback: 50,
})
// ... add to useSetup return object
```

**Step 2: Commit**

```bash
git add hooks/useSetup.ts
git commit -m "feat(storage): add fetch limit to storage and hook"
```

---

### Task 2: Add Fetch Limit to Settings Form

**Files:**

- Modify: `components/SettingsForm.tsx`

**Step 1: Update Reducer and Initial State**

Add `fetchLimit` to the state, action types, and reducer.

**Step 2: Update `useEffect` to Load Value**

Load the value from `fetchLimitStorage`.

**Step 3: Update `onSave` to Store Value**

Save the new value to `fetchLimitStorage`.

**Step 4: Add Input Field to UI**

Add a numeric `TextField` in the Preferences section.

```tsx
<TextField name="fetchLimit" type="number" isRequired>
  <Label>Fetch Limit</Label>
  <Input
    value={state.fetchLimit.toString()}
    onChange={e =>
      dispatch({
        type: 'SET_FETCH_LIMIT',
        payload: parseInt(e.target.value) || 50,
      })
    }
    min={1}
    max={1000}
  />
  <Description>Number of bookmarks to fetch per page.</Description>
</TextField>
```

**Step 5: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat(ui): add fetch limit setting to settings form"
```

---

### Task 3: Update Bookmarks Manager to use Dynamic Limit

**Files:**

- Modify: `hooks/useBookmarksManager.ts`

**Step 1: Retrieve Dynamic Limit**

Use `fetchLimitStorage` from `useSetup` (via an updated `fetcher` or passing it in).

**Step 2: Replace `PAGE_SIZE` with dynamic limit**

Update `getKey` and any threshold logic to use the value from storage.

**Step 3: Commit**

```bash
git add hooks/useBookmarksManager.ts
git commit -m "feat(hooks): use dynamic fetch limit in bookmarks manager"
```
