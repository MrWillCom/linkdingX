# AGENTS.md - Development Guidelines for linkdingX

# GOLDEN RULES

> **CRITICAL: DOCUMENTATION FIRST**
>
> 1.  **Read Before Coding**: ALWAYS look up documentation (Context7, official docs, web search) BEFORE writing any code.
> 2.  **Line-by-Line Verification**: When copying from official documentation examples, you MUST check EVERY line one by one. Do NOT skip any parts (e.g., `<Modal.Icon>`, `<Surface>`, `className="p-6"`).
> 3.  **Use Context7** to look up WXT and Kumo documentation:
>     - WXT Docs: https://wxt.dev/
>     - Kumo Docs: https://kumo-ui.com/

> **CRITICAL: COMMUNICATION MANDATE**
>
> 1.  **Always Use Question Tool**: When a task requires choices, confirmations, or decisions about implementation, you MUST use the `question` tool to ask the user directly.
> 2.  **No Assumptions**: Don't proceed without confirmation and don't make assumptions about user preferences.
> 3.  **No Inline Questions**: NEVER ask questions inline in your response. ALWAYS use the tool.

## Project Overview

This is a **browser extension** built with [WXT](https://wxt.dev/), React 19, TypeScript, Tailwind CSS v4, and Cloudflare Kumo. It uses `pnpm` as the package manager, `dexie` for local storage, and `swr` for data fetching.

### Project Structure

```
{rootDir}/
   entrypoints/              # Extension entry points
      sidepanel/             # Sidepanel UI (primary interface)
      home/                  # Full-viewport bookmarks page
      options/               # Standalone settings page
      background.ts          # Background script (sync queue, API proxy)
   components/               # Auto-imported React components
      BookmarkContent.tsx
      BookmarkFavicon.tsx
      BookmarkItem.tsx
      BookmarkPreview.tsx
      BookmarksHeader.tsx
      BookmarksInfiniteList.tsx
      BookmarksList.tsx
      CurrentTabCard.tsx
      FilterTabs.tsx
      SettingsForm.tsx
      SetupGuide.tsx
      BookmarkItem.module.css    # CSS module for bookmark styling
   utils/                    # Auto-imported utility functions
      bookmarkService.ts
      cn.ts
      db.ts
      storage.ts
      types.ts
   hooks/                    # Auto-imported React hooks
      useBookmarksManager.ts
      useCurrentTabBookmark.ts
      useCurrentTabTracker.ts
      useSetup.ts
      useSyncNotifications.ts
      useSyncQueueStatus.ts
   assets/                   # Global CSS (globals.css), icons (icon.svg)
   public/                   # Static public assets
   docs/                     # Design docs and implementation plans
      plans/                 # Dated design/implementation documents
   screenshots/              # Extension screenshots
   .agents/skills/           # Project-specific AI skills
   .github/workflows/        # CI/CD pipeline (release.yml)
   .vscode/                  # VS Code workspace settings
   wxt.config.ts             # WXT configuration
   web-ext.config.ts         # Firefox web-ext configuration
   tsconfig.json             # TypeScript configuration (extends WXT)
   .oxfmtrc.json             # Oxide formatter configuration
   release-please-config.json    # release-please configuration
   .release-please-manifest.json # Current version manifest
   pnpm-workspace.yaml       # pnpm workspace configuration
   opencode.json             # OpenCode agent permissions
   skills-lock.json          # Locked agent skill hashes
   package.json
```

## Build & Verification

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `pnpm dev`           | Start development server (Chrome)            |
| `pnpm dev:firefox`   | Start development server (Firefox)           |
| `pnpm build`         | Build production extension (Chrome)          |
| `pnpm build:firefox` | Build production extension (Firefox)         |
| `pnpm zip`           | Package extension for distribution (Chrome)  |
| `pnpm zip:firefox`   | Package extension for distribution (Firefox) |
| `pnpm compile`       | **CRITICAL**: Run TypeScript type check      |
| `pnpm fmt`           | **CRITICAL**: Format code with oxfmt         |
| `pnpm fmt:check`     | **CRITICAL**: Check code formatting          |

> **Testing**: No test framework is currently configured.

## Code Style & Best Practices

### TypeScript & Naming

- **Strict Mode**: Enabled via WXT's tsconfig.
- **Interfaces**: Prefer `interface` over `type` for public API shapes.
- **Explicit Returns**: Always define explicit return types for utility functions.
- **Files**: `kebab-case` (e.g., `app-utils.ts`).
- **Components**: `PascalCase` (e.g., `UserAvatar.tsx`).

### Imports

**Order**: React → External (`@cloudflare/kumo`) → WXT (#imports) → Internal (@/) → Types → Styles

```typescript
import { useState, useEffect } from 'react'
import { Button, Input } from '@cloudflare/kumo'
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

### CSS Modules

Use `*.module.css` for component-scoped styles. Import as `import styles from './Component.module.css'` and reference classes via `styles.className`.

### Hooks

| Hook                    | Purpose                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `useSetup`              | Checks if server/API token are configured; watches for changes         |
| `useBookmarksManager`   | Manages bookmark list state, filtering, and infinite scroll pagination |
| `useCurrentTabBookmark` | Checks if the current browser tab URL exists in bookmarks              |
| `useCurrentTabTracker`  | Tracks the active browser tab's URL and title in real-time             |
| `useSyncNotifications`  | Listens for sync notifications from the background script              |
| `useSyncQueueStatus`    | Reports whether the sync queue has pending operations or errors        |

## UI & Styling (Kumo + Tailwind v4)

### Cloudflare Kumo

- **Semantic Colors**: Use Kumo's semantic variables (`text-kumo-default`, `bg-kumo-base`, `bg-kumo-brand`).
- **Surface**: Use `<Surface>` as the primary layout container.
- **Icons**: Use `@phosphor-icons/react` with the `Icon` suffix (e.g., `GearIcon`, `TrashIcon`).

### Tailwind v4

- **CSS-Based**: No `tailwind.config.js`. Config is in `assets/globals.css`.
- **Custom Utilities**: Use `@utility` for project-specific classes:
  - `text-2xs` (10px)
  - `text-3xs` (8px)

### Component Patterns

- **Group Modifier**: Add `group` ONLY to the interactive element (e.g., button), NOT the entire list row, to scope hover effects.
- **Clickable Area**: Use `p-2` on buttons for larger clickable areas but keep visual elements (inner divs) smaller.

### Toast Notifications

Use the `Toasty` provider (from Kumo) in app root renderers to display sync notifications. `useSyncNotifications` listens for `sync-notification` messages from the background script and shows them as toast messages.

## WXT Framework Specifics

- **Storage**: Use `storage.defineItem<T>('local:key')`.
- **Entrypoints**: Defined in `entrypoints/` (background, sidepanel, home, options).
- **Manifest**: Managed in `wxt.config.ts`.

### Offline-First & Instant UI

- **Data Hierarchy**: Always prioritize local data (IndexedDB/Cache) and browser-provided metadata over server responses.
- **Background Hub**: Foreground components should primarily listen to the local database (e.g., via `useLiveQuery`). Background scripts should handle server synchronization and update the local database.
- **Immediate Feedback**: Never hide UI elements (like a "Current Tab" card) while waiting for server verification. Show the component immediately using browser fallbacks (e.g., `browser.tabs` title/favicon).
- **Fallback Resilience**: Components must gracefully handle the absence of server metadata by falling back to local/realtime data without showing "loading" flickers or disappearing.

### Conflict Resolution

When syncing server data to IndexedDB, respect pending operations:

- Skip bookmarks with entries in the `sync_queue` table.
- Skip bookmarks where `_local_modified_at` is newer than the server's `date_modified`.
- This prevents local-first mutations from being overwritten by stale server responses.

## Conventional Commits

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This enables automated versioning, changelog generation, and release management via release-please.

### Commit Message Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type              | SemVer | Description                                        |
| ----------------- | ------ | -------------------------------------------------- |
| `fix`             | PATCH  | Patches a bug                                      |
| `feat`            | MINOR  | Introduces a new feature                           |
| `BREAKING CHANGE` | MAJOR  | Breaking API change (any type, with `!` or footer) |
| `docs`            | —      | Documentation only                                 |
| `style`           | —      | Code style changes (formatting, whitespace)        |
| `refactor`        | —      | Code refactoring (not a fix or feature)            |
| `perf`            | —      | Performance improvements                           |
| `test`            | —      | Adding or fixing tests                             |
| `build`           | —      | Build system or external dependency changes        |
| `ci`              | —      | CI/CD configuration changes                        |
| `chore`           | —      | Other changes that don't modify source or tests    |
| `revert`          | —      | Reverting a previous commit                        |

### Breaking Changes

Indicate breaking changes with `!` after the type/scope, or use a `BREAKING CHANGE:` footer:

```
feat(api)!: change authentication endpoint

BREAKING CHANGE: API now requires Bearer token in Authorization header
```

> **Breaking Change Criteria**
>
> Only mark a commit as breaking when it **directly breaks the experience of end users or external consumers** of the project. Internal changes — such as dependency upgrades, internal refactors, or adjustments to library APIs that do not surface to users — **MUST NOT** use the `!` marker or a `BREAKING CHANGE:` footer, even if they require significant internal rework.
>
> release-please uses these markers to bump the major version. Mislabeling an internal change as breaking will cause the CI pipeline to generate an incorrect major release. For example, upgrading `@cloudflare/kumo` to v2 and adapting internal component calls should be `feat(deps): upgrade @cloudflare/kumo to v2`, not `feat(deps)!:`.

### Examples

```
feat: add URL filter persistence
fix(sidepanel): prevent bookmark operations from reverting after sync
docs: update AGENTS.md and README.md
ci: add release-please workflow for automated releases
```

### Release Workflow

This project uses [release-please](https://github.com/googleapis/release-please) for automated releases:

1. Push to `main` → release-please analyzes conventional commits
2. If releasable commits found → creates a Release PR with version bump, CHANGELOG.md updates
3. Merge the Release PR → creates git tag, GitHub Release with release notes
4. Build artifacts (Chrome + Firefox ZIPs) are uploaded to the GitHub Release

**Required repository settings**: Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"

## CI/CD

The `.github/workflows/release.yml` pipeline has two jobs:

### `checks`

Runs on every push to `main` and on every pull request targeting `main`:

1. Format check (`pnpm fmt:check`)
2. Type check (`pnpm compile`)
3. Build Chrome extension (`pnpm build`)
4. Build Firefox extension (`pnpm build:firefox`)

### `release-please`

Runs only on pushes to `main`:

1. Analyzes conventional commits and opens/updates a Release PR.
2. When the Release PR is merged, creates a git tag and GitHub Release.
3. Builds distribution ZIPs (`pnpm zip` and `pnpm zip:firefox`) and uploads them to the GitHub Release.

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

### Breaking Change Labeling

Only label a commit as breaking when it directly affects end users or public APIs. Internal changes such as dependency upgrades that require internal code adjustments but do not change user-facing behavior should NOT use `!` or `BREAKING CHANGE:` markers, because release-please will incorrectly bump the major version. See the [Breaking Changes](#breaking-changes) section for the full criteria.
