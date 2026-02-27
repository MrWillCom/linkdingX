# AGENTS.md - Development Guidelines for linkdingX

## Project Overview

This is a **browser extension** built with [WXT](https://wxt.dev/) (Web Extension Toolkit), React, TypeScript, and Tailwind CSS v4. It uses pnpm as the package manager.

The project structure:

- `entrypoints/` - Extension entry points (background, content scripts, sidepanel)
- `components/` - Reusable React components
- `utils/` - Utility functions
- `assets/` - Static assets (CSS, images)
- `public/` - Public assets (icons)

---

## Build Commands

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Start development server (Chrome)    |
| `pnpm dev:firefox`   | Start development server (Firefox)   |
| `pnpm build`         | Build production extension (Chrome)  |
| `pnpm build:firefox` | Build production extension (Firefox) |
| `pnpm zip`           | Create distribution zip (Chrome)     |
| `pnpm zip:firefox`   | Create distribution zip (Firefox)    |
| `pnpm compile`       | Run TypeScript type check            |
| `pnpm format`        | Format code with Prettier            |

---

## Code Style Guidelines

### Formatting

- **Tool**: Prettier (configured in `.prettierrc.yml`)
- **Settings**:
  - Tab width: 2 spaces
  - No semicolons
  - Single quotes
  - Trailing commas: all
  - Arrow parens: avoid

```bash
# Format all files before committing
pnpm format

# Type check before committing
pnpm compile
```

### TypeScript

- **Strict mode**: Enabled via WXT's tsconfig
- **JSX**: Use `react-jsx` pragma
- Always define explicit return types for utility functions
- Use `interface` over `type` for public API shapes

```typescript
// Good: explicit return type
function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

// Good: interface for public API
interface User {
  id: string
  name: string
  email: string
}
```

### Naming Conventions

| Type             | Convention                | Example                          |
| ---------------- | ------------------------- | -------------------------------- |
| Files            | kebab-case                | `content.ts`, `app-utils.ts`     |
| Components       | PascalCase                | `Setup.tsx`, `UserAvatar.tsx`    |
| Functions        | camelCase                 | `fetchUser()`, `formatDate()`    |
| Constants        | SCREAMING_SNAKE_CASE      | `MAX_RETRY`, `API_BASE_URL`      |
| React components | PascalCase                | Same as files                    |
| Hooks            | camelCase with use prefix | `useAuth()`, `useLocalStorage()` |

### Imports

```typescript
// React imports
import { useState, useEffect } from 'react'

// External libraries (named imports preferred)
import { Button, Input } from '@heroui/react'
import useSWR from 'swr'

// Internal imports (use path aliases if available)
import { formatDate } from '@/utils/date'
import type { User } from '@/types'
```

- Avoid barrel file imports (e.g., `from '@/components'`) when possible
- Group imports: external → internal → types → styles
- Use absolute imports with `@/` prefix for internal modules

### React Best Practices

Follow the rules in `.agents/skills/vercel-react-best-practices/AGENTS.md`:

- Use functional components with hooks
- Derive state during render when possible (avoid redundant state)
- Use `useCallback` / `useMemo` only when necessary
- Prefer functional setState updates: `setCount(c => c + 1)`
- Use SWR for data fetching (automatic deduplication)
- Lazy initialize expensive state: `useState(() => expensiveFn())`

```typescript
// Good: functional setState
setCount(c => c + 1)

// Good: lazy initialization
const [data] = useState(() => expensiveCalculation())

// Good: SWR for data fetching
const { data, error } = useSWR('/api/user', fetcher)
```

### Error Handling

- Use try-catch for async operations
- Wrap localStorage operations in try-catch (throws in private browsing)
- Provide user-friendly error messages in UI
- Log errors appropriately for debugging

```typescript
// Good: try-catch for localStorage
function getStoredValue<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// Good: try-catch for async operations
async function saveBookmark(url: string) {
  try {
    await api.save(url)
  } catch (error) {
    console.error('Failed to save bookmark:', error)
    showToast('Failed to save bookmark', 'error')
  }
}
```

### CSS / Tailwind

- Use Tailwind CSS v4 utility classes
- Avoid custom CSS when Tailwind can handle it
- Use semantic class names when combining with Tailwind

```tsx
// Good: Tailwind utilities
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Good: semantic class + Tailwind
<div className="card">
  <div className="card-title">Title</div>
</div>
```

### WXT / Extension Specifics

- Entry points go in `entrypoints/` directory
- Use `defineContentScript()` for content scripts
- Use `defineBackground()` for service workers
- Manifest is auto-generated by WXT

```typescript
// Content script
import { defineContentScript } from 'wxt'

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log('Content script running')
  },
})

// Background service worker
import { defineBackground } from 'wxt'

export default defineBackground({
  main() {
    browser.runtime.onInstalled.addListener(() => {
      console.log('Extension installed')
    })
  },
})
```

---

## React Component Patterns

### Component File Structure

```tsx
// components/UserAvatar.tsx
import { memo } from 'react'

interface UserAvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

function UserAvatar({ src, name, size = 'md' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <img src={src} alt={name} className={`${sizeClasses[size]} rounded-full`} />
  )
}

export default memo(UserAvatar)
```

### Custom Hooks

```typescript
// utils/useLocalStorage.ts
import { useState, useEffect } from 'react'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch {
      // Handle private browsing or quota exceeded
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue] as const
}

export default useLocalStorage
```

---

## Additional Guidelines

- Run `pnpm compile` before committing to catch type errors
- Run `pnpm format` before committing to ensure consistent formatting
- Test in both Chrome and Firefox during development
- Follow the Vercel React best practices for optimal performance

---

## Dependencies

Key dependencies used in this project:

- **React 19** - UI framework
- **WXT** - Web Extension Toolkit
- **Tailwind CSS v4** - Styling
- **HeroUI** - Component library
- **SWR** - Data fetching
- **TypeScript** - Type safety
- **Prettier** - Code formatting
