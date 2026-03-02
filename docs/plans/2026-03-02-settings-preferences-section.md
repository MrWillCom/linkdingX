# Settings Preferences Section Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Preferences" section to the settings form with options for metadata source and default unread state.

**Architecture:** Update the existing `useReducer` state machine in `SettingsForm.tsx` to handle new preference fields, and add UI components using HeroUI.

**Tech Stack:** React, WXT Storage, HeroUI (RadioGroup, Radio, Divider).

---

### Task 1: Update SettingsState and Reducer

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/SettingsForm.tsx`

**Step 1: Update `SettingsState` and `SettingsAction`**

```typescript
// Update SettingsState
interface SettingsState {
  isLoading: boolean
  server: string
  apiToken: string
  fetchMetadataFrom: 'browser' | 'server'
  defaultUnread: boolean
  error: string
}

// Update SettingsAction
type SettingsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SERVER'; payload: string }
  | { type: 'SET_API_TOKEN'; payload: string }
  | { type: 'SET_FETCH_METADATA_FROM'; payload: 'browser' | 'server' }
  | { type: 'SET_DEFAULT_UNREAD'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | {
      type: 'RESET_FORM'
      payload: {
        server: string
        apiToken: string
        fetchMetadataFrom: 'browser' | 'server'
        defaultUnread: boolean
      }
    }
```

**Step 2: Update `settingsReducer` and `initialState`**

```typescript
function settingsReducer(
  state: SettingsState,
  action: SettingsAction,
): SettingsState {
  switch (action.type) {
    // ... existing cases ...
    case 'SET_FETCH_METADATA_FROM':
      return { ...state, fetchMetadataFrom: action.payload }
    case 'SET_DEFAULT_UNREAD':
      return { ...state, defaultUnread: action.payload }
    case 'RESET_FORM':
      return {
        ...state,
        server: action.payload.server,
        apiToken: action.payload.apiToken,
        fetchMetadataFrom: action.payload.fetchMetadataFrom,
        defaultUnread: action.payload.defaultUnread,
        error: '',
        isLoading: false,
      }
    // ... existing cases ...
  }
}

const initialState: SettingsState = {
  isLoading: false,
  server: '',
  apiToken: '',
  fetchMetadataFrom: 'browser',
  defaultUnread: true,
  error: '',
}
```

**Step 3: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "refactor: update SettingsForm state and reducer for preferences"
```

---

### Task 2: Update Data Loading and Saving

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/SettingsForm.tsx`

**Step 1: Update `useEffect` to load all storage values**

```typescript
useEffect(() => {
  async function loadValues() {
    const [
      serverValue,
      apiTokenValue,
      fetchMetadataFromValue,
      defaultUnreadValue,
    ] = await Promise.all([
      serverStorage.getValue(),
      apiTokenStorage.getValue(),
      fetchMetadataFromStorage.getValue(),
      defaultUnreadStorage.getValue(),
    ])
    dispatch({
      type: 'RESET_FORM',
      payload: {
        server: serverValue || '',
        apiToken: apiTokenValue || '',
        fetchMetadataFrom: fetchMetadataFromValue,
        defaultUnread: defaultUnreadValue,
      },
    })
  }
  loadValues()
}, [
  serverStorage,
  apiTokenStorage,
  fetchMetadataFromStorage,
  defaultUnreadStorage,
])
```

**Step 2: Update `onSave` to save preference values**

```typescript
// Inside onSave try block, after credentials validation:
await Promise.all([
  serverStorage.setValue(trimmedServer),
  apiTokenStorage.setValue(trimmedApiToken),
  fetchMetadataFromStorage.setValue(state.fetchMetadataFrom),
  defaultUnreadStorage.setValue(state.defaultUnread),
])
```

**Step 3: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat: implement loading and saving of preferences in SettingsForm"
```

---

### Task 3: Add UI Components

**Files:**

- Modify: `/Users/will/Developer/MrWillCom/linkdingX/components/SettingsForm.tsx`

**Step 1: Add imports and UI sections**

```typescript
// Add imports
import {
  Button,
  Divider, // Add Divider
  FieldError,
  Form,
  Input,
  Label,
  Radio, // Add Radio
  RadioGroup, // Add RadioGroup
  TextField,
  toast,
} from '@heroui/react'

// Add Preferences section to the form JSX
{/* ... after connection fields ... */}
<Divider className="my-2" />
<div className="flex flex-col gap-4">
  <h3 className="text-medium font-medium">Preferences</h3>
  <RadioGroup
    label="Fetch Metadata From"
    value={state.fetchMetadataFrom}
    onValueChange={(value) =>
      dispatch({
        type: 'SET_FETCH_METADATA_FROM',
        payload: value as 'browser' | 'server',
      })
    }
    description="Choose whether the browser or server should fetch metadata for new bookmarks."
  >
    <Radio value="browser">Browser</Radio>
    <Radio value="server">Server</Radio>
  </RadioGroup>

  <RadioGroup
    label="Default State"
    value={state.defaultUnread ? 'unread' : 'read'}
    onValueChange={(value) =>
      dispatch({
        type: 'SET_DEFAULT_UNREAD',
        payload: value === 'unread',
      })
    }
    description="New bookmarks will be set to this state by default."
  >
    <Radio value="unread">Unread</Radio>
    <Radio value="read">Read</Radio>
  </RadioGroup>
</div>
```

**Step 2: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat: add Preferences section to SettingsForm UI"
```

---

### Task 4: Verification

**Step 1: Build and Verify**

Run: `pnpm compile`
Expected: Success

**Step 2: Final Commit**

```bash
git commit --allow-empty -m "feat: add Preferences section to SettingsForm"
```
