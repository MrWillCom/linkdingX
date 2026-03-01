# Options Page & Settings Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Settings from a modal in Home to a standalone Options page and replace the Home Setup modal with a "Smart Guide".

**Architecture:** Use WXT's multi-entrypoint system to create an `options` page. Refactor `Settings.tsx` into a `SettingsForm.tsx` that both the Options page and (optionally) other components can use.

**Tech Stack:** React 19, WXT, HeroUI, Tailwind CSS v4.

---

### Task 1: Create Options Entrypoint Structure

**Files:**

- Create: `entrypoints/options/index.html`
- Create: `entrypoints/options/main.tsx`
- Create: `entrypoints/options/App.tsx`

**Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>linkdingX Settings</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

**Step 2: Create main.tsx**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '@/assets/tailwind.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 3: Create App.tsx (Initial boilerplate)**

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-background p-8 flex justify-center">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p>Options page placeholder</p>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add entrypoints/options/
git commit -m "feat: add initial options entrypoint"
```

---

### Task 2: Refactor Settings.tsx to SettingsForm.tsx

**Files:**

- Create: `components/SettingsForm.tsx`
- Modify: `components/Settings.tsx` (To use the new form)

**Step 1: Extract form logic to SettingsForm.tsx**
(Logic will be moved from `Settings.tsx` into a standalone form component using HeroUI `Form`, `TextField`, `Input`, etc.)

**Step 2: Update Settings.tsx to use SettingsForm.tsx inside its Modal**

**Step 3: Commit**

```bash
git add components/SettingsForm.tsx components/Settings.tsx
git commit -m "refactor: extract SettingsForm component"
```

---

### Task 3: Implement SettingsPage in Options Entrypoint

**Files:**

- Modify: `entrypoints/options/App.tsx`

**Step 1: Use SettingsForm in Options App.tsx**
Implement a clean layout with a header and the form.

**Step 2: Commit**

```bash
git add entrypoints/options/App.tsx
git commit -m "feat: implement settings form in options page"
```

---

### Task 4: Update Home Entrypoint Navigation

**Files:**

- Modify: `components/BookmarksList.tsx`

**Step 1: Change Settings button behavior**
Replace the `<Settings />` component with a simple `<Button>` that calls `browser.runtime.openOptionsPage()`.

**Step 2: Commit**

```bash
git add components/BookmarksList.tsx
git commit -m "feat: open options page from bookmarks list settings button"
```

---

### Task 5: Implement SetupGuide and Remove Setup.tsx

**Files:**

- Create: `components/SetupGuide.tsx`
- Modify: `entrypoints/home/App.tsx`
- Delete: `components/Setup.tsx`

**Step 1: Create SetupGuide.tsx**
A simple card with a message and an "Open Settings" button.

**Step 2: Update entrypoints/home/App.tsx**
Switch from `<Setup />` to `<SetupGuide />`.

**Step 3: Delete components/Setup.tsx**

**Step 4: Commit**

```bash
git rm components/Setup.tsx
git add components/SetupGuide.tsx entrypoints/home/App.tsx
git commit -m "feat: replace setup modal with setup guide and remove setup.tsx"
```

---

### Task 6: Final Verification

**Step 1: Run type checks**
Run: `pnpm compile`

**Step 2: Run linter**
Run: `pnpm format`

**Step 3: Manual verification (instructions)**

- Open extension home.
- Verify "Setup Guide" shows if no settings.
- Verify "Open Settings" button opens options page in a new tab.
- Verify settings can be saved in the options page.
- Verify home page updates once settings are saved.
