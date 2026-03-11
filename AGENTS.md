# AGENTS.md - Development Guidelines for linkdingX

# 🛡️ GOLDEN RULES

> **CRITICAL: DOCUMENTATION FIRST**
>
> 1.  **Read Before Coding**: ALWAYS look up documentation (Context7, official docs, web search) BEFORE writing any code.
> 2.  **Line-by-Line Verification**: When copying from official documentation examples, you MUST check EVERY line one by one. Do NOT skip any parts (e.g., `<Modal.Icon>`, `<Surface>`, `className="p-6"`).
> 3.  **Use Context7** to look up WXT and HeroUI documentation:
>     - WXT Docs: https://wxt.dev/
>     - HeroUI Docs: https://v3.heroui.com/

> **⚠️ CRITICAL: COMMUNICATION MANDATE**
>
> 1.  **Always Use Question Tool**: When a task requires choices, confirmations, or decisions about implementation, you MUST use the `question` tool to ask the user directly.
> 2.  **No Assumptions**: Don't proceed without confirmation and don't make assumptions about user preferences.
> 3.  **No Inline Questions**: NEVER ask questions inline in your response. ALWAYS use the tool.

---

## Project Overview

This is a **browser extension** built with [WXT](https://wxt.dev/), React 19, TypeScript, Tailwind CSS v4, and HeroUI v3. It uses `pnpm` as the package manager, `dexie` for local storage, and `swr` for data fetching.

### Project Structure

```
📂 {rootDir}/
   📁 entrypoints/       # Extension entry points (background, content scripts, sidepanel)
   📁 components/        # Auto-imported React components
   📁 utils/             # Auto-imported utility functions (db.ts, bookmarkService.ts)
   📁 hooks/             # Auto-imported React hooks
   📁 assets/            # Global CSS (globals.css), images
   📁 public/           # Static assets (icons)
   📁 .agents/skills/   # Project-specific AI skills (HeroUI, React Best Practices)
   📄 wxt.config.ts     # WXT configuration
   📄 package.json
```

---

## Build & Verification

| Command        | Description                             |
| -------------- | --------------------------------------- |
| `pnpm dev`     | Start development server (Chrome)       |
| `pnpm build`   | Build production extension (Chrome)     |
| `pnpm compile` | **CRITICAL**: Run TypeScript type check |
| `pnpm format`  | **CRITICAL**: Format code with Prettier |

> **Testing**: Vitest is currently **NOT** configured. Before attempting test commands, verify the existence of `vitest.config.ts` and a `tests/` directory.

---

## Code Style & Best Practices

### TypeScript & Naming

- **Strict Mode**: Enabled via WXT's tsconfig.
- **Interfaces**: Prefer `interface` over `type` for public API shapes.
- **Explicit Returns**: Always define explicit return types for utility functions.
- **Files**: `kebab-case` (e.g., `app-utils.ts`).
- **Components**: `PascalCase` (e.g., `UserAvatar.tsx`).

### Imports

**Order**: React → External (`@heroui/react`) → WXT (#imports) → Internal (@/) → Types → Styles

```typescript
import { useState, useEffect } from 'react'
import { Button, Input } from '@heroui/react'
import { storage } from 'wxt/storage'
import { defineContentScript } from '#imports'
import { db } from '@/utils/db'
import type { User } from '@/types'
```

- **Alias**: Use `@/` for all internal modules.
- **WXT**: Use `#imports` for WXT utilities explicitly.
- **Barrels**: Avoid barrel file imports (e.g., `from '@/components'`).

### React 19 Patterns

Follow the rules in `.agents/skills/vercel-react-best-practices/AGENTS.md`:

- **Functional setState**: Always use the functional form for updates: `setCount(c => c + 1)`.
- **Lazy Initialization**: Lazy initialize expensive state: `useState(() => expensiveFn())`.
- **Derived State**: Derive state during render instead of using `useEffect`.
- **Error Handling**: Wrap `localStorage` and async operations in `try-catch`.

---

## UI & Styling (HeroUI v3 + Tailwind v4)

### HeroUI v3

- **Semantic Colors**: Use semantic names (`text-muted`, `bg-background`) instead of numbered defaults (`text-default-400`).
- **Props**: Use `is` prefix (`isDisabled`, `isLoading`) and `on` prefix (`onPress`, `onValueChange`).
- **Tabs**: Use `id` on `<Tabs.Tab>` (NOT `key`). Always include `<Tabs.Indicator />`.

### Tailwind v4

- **CSS-Based**: No `tailwind.config.js`. Config is in `assets/globals.css`.
- **Custom Utilities**: Use `@utility` for project-specific classes:
  - `text-2xs` (10px)
  - `text-3xs` (8px)

### Component Patterns

- **Group Modifier**: Add `group` ONLY to the interactive element (e.g., button), NOT the entire list row, to scope hover effects.
- **Clickable Area**: Use `p-2` on buttons for larger clickable areas but keep visual elements (inner divs) smaller.

---

## WXT Framework Specifics

- **Storage**: Use `storage.defineItem<T>('local:key')`.
- **Entrypoints**: Defined in `entrypoints/` (background, sidepanel, content).
- **Manifest**: Managed in `wxt.config.ts`.

### Offline-First & Instant UI

- **Data Hierarchy**: Always prioritize local data (IndexedDB/Cache) and browser-provided metadata over server responses.
- **Background Hub**: Foreground components should primarily listen to the local database (e.g., via `useLiveQuery`). Background scripts should handle server synchronization and update the local database.
- **Immediate Feedback**: Never hide UI elements (like a "Current Tab" card) while waiting for server verification. Show the component immediately using browser fallbacks (e.g., `browser.tabs` title/favicon).
- **Fallback Resilience**: Components must gracefully handle the absence of server metadata by falling back to local/realtime data without showing "loading" flickers or disappearing.

---

## Lessons Learned & Known Issues

### Chrome Sidepanel IntersectionObserver

The `IntersectionObserver` API may not fire in Chrome's side panel until user interaction.
**Solution**: Use a fallback "Load More" button that hides only after the observer successfully triggers the first load.

```tsx
const hasTriggeredLoadRef = useRef(false)
// In render:
{
  !isLoading && hasMore && !hasTriggeredLoadRef.current && (
    <Button onPress={() => setSize(s => s + 1)}>Load more</Button>
  )
}
```

### Dependency Side-effects

Installing new packages with `pnpm` can occasionally remove indirect dependencies. Always verify `package.json` after installations.
