# Unified Tab Card Options & Animation Fine-tuning

## Goal

Add configurable options for bookmarking behavior and fix the stretching animation in the `CurrentTabCard` component.

## User Requirements

- **Configuration Options**:
  1. **Fetch Metadata**: Choose between `Browser` (client) and `Server` (empty metadata). Default: `Browser`.
  2. **Default State**: Choose between `Unread` and `Read` for new bookmarks. Default: `Unread`.
- **Animation Fine-tuning**:
  - Fix the "stretching" effect when transitioning between compact (not bookmarked) and full (bookmarked) states.
  - Use `AnimatePresence` with `mode="wait"` for children.
  - Implement smooth height changes for the container.

## Architecture

- **Storage**: Extend `wxt/storage` definitions in `hooks/useSetup.ts` to include `local:fetchMetadataFrom` and `local:defaultUnread`.
- **Settings UI**: Update `components/SettingsForm.tsx` with a new "Preferences" section using HeroUI `RadioGroup` or `Select` components.
- **Card Logic**: Update `components/BookmarksList.tsx` to read these settings and pass them to the `handleAdd` function.
- **Card Animation**: Refactor `components/CurrentTabCard.tsx` to wrap the state-specific cards in `AnimatePresence` and use a `motion.div` wrapper for height animation.

## Tech Stack

- **Framework**: WXT (Web Extension Toolkit)
- **UI**: HeroUI v3 (React Aria based), Tailwind CSS v4
- **Animation**: `motion/react` (Framer Motion)
- **State Management**: SWR for data fetching, WXT Storage for settings

---

## Design Detail: Animation Strategy

The current stretching occurs because both the "Not Bookmarked" and "Bookmarked" states might briefly exist in the DOM during the transition, or the layout property is trying to interpolate between two very different structures.

1.  **Height Wrapper**: A `motion.div` with `layout` and `style={{ height: 'auto' }}` will wrap the entire card content.
2.  **State Switcher**: Inside the wrapper, `<AnimatePresence mode="wait">` will manage the two states.
3.  **Individual States**: Each state ("Add" and "Manage") will be a `motion.div` with its own `initial`, `animate`, and `exit` props (e.g., opacity and scale).

## Design Detail: Configuration UI

- **Metadata Fetching**: A `RadioGroup` with options "Browser (fast, includes current page context)" and "Server (Linkding will crawl the URL)".
- **Default Unread**: A `Switch` or `RadioGroup` for "Mark as unread by default".

---

## Next Steps

1. [ ] Present this design to the user for final confirmation.
2. [ ] Create the implementation plan in `docs/plans/2026-03-02-options-and-animation-tuning.md`.
3. [ ] Implement the storage hooks.
4. [ ] Implement the settings UI.
5. [ ] Implement the animation refactor.
6. [ ] Verify functionality and smoothness.
