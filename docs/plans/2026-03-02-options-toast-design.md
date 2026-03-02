# Toast Notifications for Options Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement HeroUI toast notifications in the options page to provide feedback on settings save/validation.

**Architecture:** Use HeroUI's global `Toast.Provider` in the root `App` component and trigger toasts using the `toast` function in the `SettingsForm` component.

**Tech Stack:** React, HeroUI v3, WXT

---

### Task 1: Setup Toast Provider

**Files:**

- Modify: `entrypoints/options/App.tsx`

**Step 1: Add Toast.Provider to App.tsx**

```tsx
import SettingsForm from '@/components/SettingsForm'
import { Toast } from '@heroui/react'

export default function App() {
  return (
    <div className="min-h-screen bg-background p-8 flex justify-center">
      <Toast.Provider placement="bottom" />
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Options</h1>
        <SettingsForm showCancel={false} />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add entrypoints/options/App.tsx
git commit -m "feat(options): add Toast.Provider to options page"
```

---

### Task 2: Implement Toast Notifications in SettingsForm

**Files:**

- Modify: `components/SettingsForm.tsx`

**Step 1: Import toast and update onSave logic**

```tsx
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast, // Add this import
} from '@heroui/react'

// ... inside onSave function ...

if (!trimmedServer || !trimmedApiToken) {
  const errorMsg = 'Both server and API token are required'
  dispatch({
    type: 'SET_ERROR',
    payload: errorMsg,
  })
  toast.danger(errorMsg) // Add toast
  return
}

dispatch({ type: 'SET_LOADING', payload: true })
try {
  const response = await browser.runtime.sendMessage({
    // ... message config ...
  })

  if (!response.ok) {
    throw new Error('Invalid server URL or API token')
  }

  await serverStorage.setValue(trimmedServer)
  await apiTokenStorage.setValue(trimmedApiToken)
  toast.success('Settings saved successfully') // Add success toast
  onSaved?.()
} catch (err) {
  const errorMsg =
    err instanceof Error ? err.message : 'Failed to validate credentials'
  dispatch({
    type: 'SET_ERROR',
    payload: errorMsg,
  })
  toast.danger(errorMsg) // Add danger toast
}
```

**Step 2: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat(options): trigger success/danger toasts on settings save"
```

---

### Task 3: Verification

**Step 1: Type Check**

Run: `pnpm compile`
Expected: No TypeScript errors

**Step 2: Format**

Run: `pnpm format`
Expected: Files formatted correctly
