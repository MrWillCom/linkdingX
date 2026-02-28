# AGENTS.md - Development Guidelines for linkdingX

> **IMPORTANT: Before any action, ALWAYS read the relevant documentation first!**
>
> - **Use Context7** to look up WXT and HeroUI documentation
> - WXT Docs: https://wxt.dev/
> - HeroUI Docs: https://v3.heroui.com/
> - Read the TOC and relevant guides thoroughly before coding!

> **⚠️ CRITICAL: Always Use Question Tool for Clarifications**
>
> When the user asks something that requires:
>
> - Choosing between multiple approaches
> - Confirming details before implementation
> - Any decision that affects the implementation
>
> You MUST use the `question` tool to ask the user directly. Do NOT:
>
> - Proceed without confirmation
> - Make assumptions about user preferences
> - Ask follow-up questions inline in your response
>
> Example of CORRECT behavior:
>
> ```
> User: "Make the button blue or red?"
> Assistant: [uses question tool to ask]
> ```
>
> Example of INCORRECT behavior:
>
> ```
> User: "Make the button blue or red?"
> Assistant: "I'll make it blue"  ← WRONG! Must ask first
> ```

---

## Project Overview

This is a **browser extension** built with [WXT](https://wxt.dev/) (Web Extension Toolkit), React, TypeScript, and Tailwind CSS v4. It uses pnpm as the package manager.

### Project Structure

```
📂 {rootDir}/
   📁 entrypoints/       # Extension entry points (background, content scripts, sidepanel)
   📁 components/        # Auto-imported React components
   📁 utils/             # Auto-imported utility functions
   📁 hooks/             # Auto-imported React hooks
   📁 assets/            # CSS, images (processed by WXT)
   📁 public/           # Static assets (icons, copied as-is)
   📄 wxt.config.ts     # WXT configuration
   📄 package.json
```

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

**Order**: React imports → External libraries → Internal modules → Types → Styles

```typescript
// React imports
import { useState, useEffect } from 'react'

// External libraries (named imports preferred)
import { Button, Input } from '@heroui/react'

// WXT APIs - use #imports for explicit imports
import { storage } from 'wxt/storage'
import { defineContentScript, defineBackground } from '#imports'

// Internal imports (use path aliases)
import { formatDate } from '@/utils/date'
import type { User } from '@/types'
```

**Key Points**:

- Avoid barrel file imports (e.g., `from '@/components'`) when possible
- Use `#imports` for WXT utilities explicitly
- Use absolute imports with `@/` prefix for internal modules
- Run `wxt prepare` to generate auto-import type definitions

---

## WXT Framework Specifics

> READ: https://wxt.dev/guide/essentials/entrypoints

### Entrypoint Types

| Entrypoint     | Filename Pattern               | Output                        |
| -------------- | ------------------------------ | ----------------------------- |
| Background     | `entrypoints/background.[jt]s` | `/background.js`              |
| Content Script | `entrypoints/content.[jt]sx?`  | `/content-scripts/content.js` |
| Popup          | `entrypoints/popup.html`       | `/popup.html`                 |
| Options        | `entrypoints/options.html`     | `/options.html`               |
| Side Panel     | `entrypoints/sidepanel.html`   | `/sidepanel.html`             |

### Defining Entrypoints

```typescript
// Background service worker
import { defineBackground } from '#imports'

export default defineBackground({
  main() {
    browser.runtime.onInstalled.addListener(() => {
      console.log('Extension installed')
    })
  },
})
```

```typescript
// Content script
import { defineContentScript } from '#imports'

export default defineContentScript({
  matches: ['*://*/*'],
  main(ctx) {
    console.log('Content script running')
  },
})
```

### Manifest Configuration

WXT auto-generates `manifest.json`. Configure via:

1. Global options in `wxt.config.ts`
2. Entrypoint-specific options in the entrypoint file
3. Hooks for modification

```typescript
// wxt.config.ts
export default defineConfig({
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'tabs'],
    host_permissions: ['https://*/*'],
  },
})
```

### Storage

> READ: https://wxt.dev/guide/essentials/storage

Use WXT's built-in storage API:

```typescript
import { storage } from 'wxt/storage'

// Define a typed storage item
const accountStorage = storage.defineItem<Account>('local:account')

// Use it
const account = await accountStorage.getValue()
await accountStorage.setValue(newAccount)
await accountStorage.deleteValue()
```

### Auto-imports

> READ: https://wxt.dev/guide/essentials/config/auto-imports

WXT auto-imports from:

- `components/*`
- `composables/*`
- `hooks/*`
- `utils/*`
- All WXT APIs

To see all auto-imports, run `wxt prepare` and check `.wxt/types/imports-module.d.ts`.

---

## HeroUI Component Library

> READ: https://v3.heroui.com/docs/react/getting-started
> READ: https://v3.heroui.com/docs/react/components

### Key Differences from Other UI Libraries

- **Props use `is` prefix**: `isDisabled`, `isLoading`, `isOpen` (NOT `disabled`, `loading`, `open`)
- **Events use `on` prefix with specific names**: `onPress`, `onValueChange`, `onSelectionChange`
- **Built on React Aria**: Accessible by default, follows WAI-ARIA guidelines

### Import

```typescript
import { Button, Input, Form, Card } from '@heroui/react'
```

### Button

```typescript
import { Button } from '@heroui/react'

// Variants: primary, secondary, tertiary, outline, ghost, danger
// Sizes: sm, md, lg

<Button
  variant="primary"
  size="md"
  isDisabled={false}
  isLoading={false}
  onPress={() => console.log('pressed')}
>
  Click me
</Button>
```

### Form Components

> READ: https://v3.heroui.com/docs/guide/forms

HeroUI forms support:

- Built-in validation with `isRequired`, `minLength`, `pattern`
- Labels via `<Label>` component
- Error messages via `<FieldError>`
- Integration with React Hook Form

```typescript
import { Form, TextField, Input, Label, FieldError, Button } from '@heroui/react'

<Form>
  <TextField name="email" isRequired>
    <Label>Email</Label>
    <Input />
    <FieldError />
  </TextField>
  <Button type="submit">Submit</Button>
</Form>
```

### Tabs Component (React)

> READ: https://v3.heroui.com/docs/react/components/tabs

```typescript
import { Tabs } from '@heroui/react'

// Controlled state
<Tabs selectedKey={value} onSelectionChange={setValue}>
  <Tabs.List>
    <Tabs.Tab id="tab1">
      Tab 1
      <Tabs.Indicator />
    </Tabs.Tab>
    <Tabs.Tab id="tab2">
      Tab 2
      <Tabs.Indicator />
    </Tabs.Tab>
  </Tabs.List>
</Tabs>
```

**Key Points**:

- Use `id` prop on `<Tabs.Tab>` (NOT `key`) for tab identification
- Use `selectedKey` and `onSelectionChange` for controlled state
- Always include `<Tabs.Indicator />` inside each `<Tabs.Tab>` (required for indicator animation)
- Props differ between React version (`id`, `selectedKey`) and Native version (`value`, `onValueChange`)

### Styling

- Use `className` for custom Tailwind classes
- Components are built on Tailwind CSS v4
- Use semantic class names when combining with Tailwind

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
```

---

## Tailwind CSS v4

> This project uses Tailwind v4 with `@tailwindcss/vite` plugin

**No `tailwind.config.js` file** - Tailwind v4 uses CSS-based configuration:

```css
/* assets/tailwind.css */
@import 'tailwindcss';

@theme {
  --color-primary: #0072f5;
  --color-secondary: #7828c8;
}
```

---

## Testing Setup (Reference)

> READ: https://wxt.dev/guide/essentials/unit-testing

To add testing to this project:

1. Install Vitest:

```bash
pnpm add -D vitest @wxt-dev/module-react
```

2. Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
  plugins: [WxtVitest()],
})
```

3. Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

4. Write tests:

```typescript
import { describe, it, expect } from 'vitest'
import { fakeBrowser } from 'wxt/testing/fake-browser'

const accountStorage = storage.defineItem<Account>('local:account')

describe('accountStorage', () => {
  beforeEach(() => {
    fakeBrowser.reset()
  })

  it('should store and retrieve account', async () => {
    const account = { name: 'Test' }
    await accountStorage.setValue(account)
    expect(await accountStorage.getValue()).toEqual(account)
  })
})
```

**Key Points**:

- `WxtVitest()` polyfills the `browser` API with in-memory implementation
- Use `wxt/testing/fake-browser` for storage mocking
- Mock WXT APIs using their real import paths (check `.wxt/types/imports-module.d.ts`)

---

## React Best Practices

Follow the rules in `.agents/skills/vercel-react-best-practices/AGENTS.md`:

- Use functional components with hooks
- Derive state during render when possible (avoid redundant state)
- Use `useCallback` / `useMemo` only when necessary
- Prefer functional setState updates: `setCount(c => c + 1)`
- Lazy initialize expensive state: `useState(() => expensiveFn())`

```typescript
// Good: functional setState
setCount(c => c + 1)

// Good: lazy initialization
const [data] = useState(() => expensiveCalculation())
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

---

## Dependencies

Key dependencies used in this project:

- **React 19** - UI framework
- **WXT v0.20.18** - Web Extension Toolkit
- **Tailwind CSS v4** - Styling
- **HeroUI v3.0.0-beta.7** - Component library
- **TypeScript** - Type safety
- **Prettier** - Code formatting

---

## Additional Guidelines

- **Use Skills to Solve Problems**: When encountering issues or needing to investigate problems, use the available skills (e.g., `web-design-guidelines` for UI/UX review, `vercel-react-best-practices` for React performance issues)
- **Use Context7** to look up documentation when implementing features
- Run `pnpm compile` before committing to catch type errors
- Run `pnpm format` before committing to ensure consistent formatting
- Test in both Chrome and Firefox during development
- Follow the Vercel React best practices for optimal performance
- **ALWAYS read the relevant documentation before implementing features!**
- **Verify external API capabilities** before assuming features exist - don't guess or assume API parameters without checking
- **Look up component documentation first** - Don't guess the API props, always check Context7 for correct usage

### Context7 Usage

When working on this project, use Context7 to look up:

- **WXT**: Framework APIs, entry points, storage, manifest config
- **HeroUI**: Component props, form patterns, accessibility

```bash
# Example: Look up HeroUI Button component
# Use context7_resolve_library_id then context7_query_docs
```

### Communication Guidelines

- **Use the question tool** when uncertain about implementation choices (e.g., UI patterns, data handling, architecture decisions)
- Don't assume user preferences - ask instead when there are multiple reasonable approaches
- This ensures we build exactly what you want rather than making incorrect assumptions

---

## Lessons Learned

### Tailwind `group` Modifier Mistakes

**Mistake**: Adding `group` to the wrong element.

When implementing hover effects where a child element changes on parent hover:

1. **Wrong**: Add `group` to the outer container (e.g., entire list item row)
   - This causes all children to react when hovering anywhere on the row

2. **Correct**: Add `group` only to the interactive element (e.g., button)
   - Use `group-hover`/`group-active` on child elements to respond to parent button hover only

### Button + Inner Indicator Pattern

For a clickable indicator with larger click area but smaller visual:

```tsx
// Button: larger padding for clickable area
// Inner div: smaller size for visual dot
<button className="group p-2 rounded-full hover:bg-default-200 transition-colors">
  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:bg-blue-600" />
</button>
```

**Key points**:

- Use `group` on the button element only
- Inner elements use `group-hover`/`group-active` to respond to button hover (not row hover)
- Button: `p-2` for larger clickable area
- Inner div: smaller `w-2.5 h-2.5` for visual dot
- Use conditional Tailwind classes (not inline styles) so hover states work for both states
- Example: `bookmark.unread ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-gray-300 group-hover:bg-gray-400'`

### HeroUI v3 Semantic Colors

- **Wrong**: `text-default-400`, `text-default-300` (these don't exist in HeroUI v3)
- **Correct**: Use semantic colors like `text-muted`
- HeroUI v3 uses semantic color names (`--muted`, `--foreground`, `--background`) rather than numbered default colors

### pnpm Dependency Behavior

- Adding a new dependency can accidentally remove indirect dependencies
- Always verify `package.json` after installing new packages
- Example: Installing `date-fns` removed `swr` (an indirect dependency), requiring manual re-addition

### Tailwind v4 Custom Utilities

- Use `@utility` directive (not just `@theme`) to create custom utilities
- Example: Creating `text-2xs` (10px) and `text-3xs` (8px) for smaller text

```css
@utility text-2xs {
  font-size: 0.625rem;
  line-height: 0.875rem;
}

@utility text-3xs {
  font-size: 0.5rem;
  line-height: 0.75rem;
}
```

- Tailwind's smallest built-in font size is `text-xs` (12px/0.75rem)

### Flexbox Gap Semantics

- `gap` in `flex-col` container = vertical spacing between items
- `gap` in `flex-wrap` container = horizontal spacing between chips
- Use `mt` (margin-top) for spacing between different sections (e.g., description → tags)

```tsx
// Vertical layout: gap controls vertical spacing
<div className="flex flex-col gap-1.5">
  <div>Title</div>
  <div>Description</div>
  <div>Tags</div>
</div>

// Horizontal/wrap layout: gap controls horizontal spacing
<div className="flex flex-wrap gap-1.5">
  <Chip>Tag 1</Chip>
  <Chip>Tag 2</Chip>
</div>

// Between different sections: use mt
<p className="description" />
<div className="mt-1.5 tags" />
```

### Always Use Question Tool for Clarifications

**Rule**: When the user asks something that requires choices, confirmations, or decisions about implementation, you MUST use the question tool to ask the user directly.

**Examples of when to use question tool**:

- Choosing between multiple approaches
- Confirming details before implementation
- Any decision that affects the implementation
- UI placement decisions

**What NOT to do**:

- Don't proceed without confirmation
- Don't make assumptions about user preferences
- Don't ask follow-up questions inline in your response

**Example of CORRECT behavior**:

```
User: "Make the button blue or red?"
Assistant: [uses question tool to ask]
```

**Example of INCORRECT behavior**:

```
User: "Make the button blue or red?"
Assistant: "I'll make it blue"  ← WRONG! Must ask first
```

---

### Always Check Documentation Before Implementing

**Rule**: ALWAYS look up documentation (Context7, official docs, web search) BEFORE writing any code for:

- UI components (HeroUI, Tailwind, etc.)
- Framework APIs (WXT, React, etc.)
- Library usage patterns

**Why**:

- You guessed the HeroUI Modal API wrong
- The component API is different from what you assumed
- This wastes time and creates bugs

**What NOT to do**:

- Don't assume you know how a component works
- Don't guess the API based on experience with similar libraries
- Don't write code first, then check docs when it fails

**Example of INCORRECT behavior**:

```
User: "Add a modal with Setup component"
Assistant: [writes Modal code without checking docs]
→ Modal doesn't work because wrong API usage
```

**Example of CORRECT behavior**:

```
User: "Add a modal with Setup component"
Assistant: [first checks HeroUI Modal docs on Context7]
→ Understands correct API (Modal.Trigger as child, etc.)
→ Then writes working code
```

---

### Always Check Documentation Line by Line

**Rule**: When copying from official documentation examples, you MUST check EVERY line one by one. Do NOT skip any parts.

**Why**:

- Skipped lines (like `<Modal.Icon>`, `<Surface>`, `className="p-6"`) caused bugs
- User had to point out each missing piece individually
- This wastes both user and assistant time

**What to do**:

- Compare your implementation against the official example line by line
- Check for: props, children, classNames, components like `<Surface>`, `<Modal.Icon>`, etc.
- If in doubt, ask the user to confirm

**Example of INCORRECT behavior**:

```
User: "Follow the official Modal example"
Assistant: [copies most of the code but skips <Modal.Icon> and className="p-6"]
→ User gets frustrated having to point out each missing piece
```

**Example of CORRECT behavior**:

```
User: "Follow the official Modal example"
Assistant: [reads the example line by line, identifies all required parts]
→ Implements complete code matching the example exactly
→ Asks if user wants any modifications
```

**Issue**: The IntersectionObserver API may not fire properly in Chrome's side panel until the user interacts with it (e.g., clicks somewhere). This affects infinite scroll functionality.

**Symptoms**:

- Scroll-to-load-more doesn't work when the side panel first opens
- Works after clicking anywhere in the side panel

**Solutions that didn't work**:

1. Adding `rootMargin` to IntersectionObserver options
2. Calling `document.body.focus()` on mount

**Working solution**: Add a fallback "Load More" button that:

- Shows by default when there's more data to load
- Hides when the IntersectionObserver successfully triggers a load (using a ref to track this)
- Allows users to manually load more if infinite scroll fails

```tsx
const hasTriggeredLoadRef = useRef(false)

// In IntersectionObserver callback:
if (hasMore) {
  hasTriggeredLoadRef.current = true
  setSize(size + 1)
}

// In render:
{
  !isLoadingMore && hasMore && !hasTriggeredLoadRef.current && (
    <Button size="sm" variant="ghost" onPress={() => setSize(size + 1)}>
      Load more
    </Button>
  )
}
```
