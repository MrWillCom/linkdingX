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
   .changeset/               # Changesets versioning and changelog files
   .github/workflows/        # CI/CD pipeline (release.yml)
   .vscode/                  # VS Code workspace settings
   wxt.config.ts             # WXT configuration
   web-ext.config.ts         # Firefox web-ext configuration
   tsconfig.json             # TypeScript configuration (extends WXT)
   .oxfmtrc.json             # Oxide formatter configuration
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
| `pnpm changeset`     | Add a changeset for the next release         |

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

Commits SHOULD follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification as a message style. Version numbers and changelog entries are **not** inferred from commit messages; they come from Changesets.

### Commit Message Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                     |
| ---------- | ----------------------------------------------- |
| `fix`      | Patches a bug                                   |
| `feat`     | Introduces a new feature                        |
| `docs`     | Documentation only                              |
| `style`    | Code style changes (formatting, whitespace)     |
| `refactor` | Code refactoring (not a fix or feature)         |
| `perf`     | Performance improvements                        |
| `test`     | Adding or fixing tests                          |
| `build`    | Build system or external dependency changes     |
| `ci`       | CI/CD configuration changes                     |
| `chore`    | Other changes that don't modify source or tests |
| `revert`   | Reverting a previous commit                     |

### Examples

```
feat: add URL filter persistence
fix(sidepanel): prevent bookmark operations from reverting after sync
docs: update AGENTS.md and README.md
ci: add Changesets workflow for automated releases
```

## Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning, changelog generation, and GitHub Releases.

### Adding a changeset

For user-facing changes, run `pnpm changeset` in the PR and choose a bump:

| Bump    | When to use                                                 |
| ------- | ----------------------------------------------------------- |
| `patch` | Bug fixes and other non-breaking corrections                |
| `minor` | New features that do not break existing behavior            |
| `major` | Changes that **directly break** the experience of end users |

Docs, chore, CI, and internal refactors can omit a changeset. Nothing is released until a changeset is merged.

> Only choose `major` when the change **directly breaks** the experience of end users. Internal changes — such as dependency upgrades, refactors, or library API adaptations that do not surface to users — MUST use `patch` or `minor`. For example, upgrading `@cloudflare/kumo` to v2 and adapting internal component calls should be a `minor` (or `patch`) changeset, not `major`.

Install the [Changesets Bot](https://github.com/apps/changeset-bot) on the repository so pull requests are reminded when a changeset is missing.

### Release Workflow

1. Merge a PR that includes a changeset into `main`.
2. The release workflow opens or updates a Version PR (`chore: version packages`) that bumps `package.json` and updates `CHANGELOG.md`.
3. Merge the Version PR → creates git tag `vX.Y.Z` and a GitHub Release with changelog notes.
4. Chrome and Firefox distribution ZIPs (`pnpm zip` / `pnpm zip:firefox`) are uploaded as GitHub Release attachments.

**Required repository settings**: Settings → Actions → General → "Allow GitHub Actions to create and approve pull requests"

## CI/CD

The `.github/workflows/release.yml` pipeline has two jobs:

### `checks`

Runs on every push to `main` and on every pull request targeting `main`:

1. Format check (`pnpm fmt:check`)
2. Type check (`pnpm compile`)
3. Build Chrome extension (`pnpm build`)
4. Build Firefox extension (`pnpm build:firefox`)

### `release`

Runs only on pushes to `main`, after `checks` succeeds:

1. If there are pending changesets, opens or updates a Version PR.
2. If the Version PR was just merged, creates git tag `vX.Y.Z` and a GitHub Release.
3. Builds distribution ZIPs (`pnpm zip` and `pnpm zip:firefox`) and uploads them as GitHub Release attachments.

## Lessons Learned & Known Issues

### Chrome Sidepanel IntersectionObserver

The `IntersectionObserver` API may not fire in Chrome's side panel until user interaction.
**Solution**: Use a fallback "Load More" button that hides only after the observer successfully triggers the first load. Drive visibility with state (not a ref read during render), and reset it when the list identity changes (filter/search).

```tsx
const [showLoadMoreFallback, setShowLoadMoreFallback] = useState(true)
// Hide after IntersectionObserver fires once; reset on filter/search change.
{
  !isLoading && hasMore && showLoadMoreFallback && (
    <Button onPress={() => setSize(s => s + 1)}>Load more</Button>
  )
}
```

### Dependency Side-effects

Installing new packages with `pnpm` can occasionally remove indirect dependencies. Always verify `package.json` after installations.

### Changeset Bump Labeling

Only choose `major` in a changeset when the change directly affects end users. Internal changes such as dependency upgrades that require internal code adjustments but do not change user-facing behavior should use `patch` or `minor`. See the [Changesets](#changesets) section for the full criteria.
