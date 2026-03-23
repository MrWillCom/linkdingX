# Kumo UI Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Completely migrate the project from HeroUI to Kumo UI, including styling, components, icons, and theme logic.

**Architecture:** Replace HeroUI semantic imports and components with Kumo UI equivalents. Leverage Kumo's semantic tokens and `data-mode` attribute for theming. Migrate `lucide-react` to `@phosphor-icons/react`.

**Tech Stack:** React 19, Tailwind CSS v4, @cloudflare/kumo, @phosphor-icons/react, next-themes.

---

### Task 1: Install Dependencies and Initialize Kumo

**Files:**

- Modify: `package.json`
- Modify: `assets/globals.css`

**Step 1: Install Kumo UI and Phosphor Icons**

Run: `pnpm add @cloudflare/kumo @phosphor-icons/react`

**Step 2: Remove HeroUI styles from CSS**

Modify: `assets/globals.css`
Replace `@import '@heroui/styles';` with `@import "@cloudflare/kumo/styles";`.

**Step 3: Commit initial setup**

```bash
git add package.json assets/globals.css
git commit -m "chore: install kumo-ui and phosphor-icons, update global styles"
```

---

### Task 2: Configure Theme Logic (next-themes)

**Files:**

- Modify: `entrypoints/sidepanel/main.tsx` (or wherever ThemeProvider is)
- Modify: `components/ThemeSwitcher.tsx` (if exists)

**Step 1: Update ThemeProvider to use data-mode**

Kumo uses `data-mode="light|dark"`. `next-themes` should be configured to use the `data-mode` attribute instead of `class`.

```tsx
<ThemeProvider attribute="data-mode" defaultTheme="system" enableSystem>
```

**Step 2: Commit theme configuration**

```bash
git add entrypoints/sidepanel/main.tsx
git commit -m "feat: configure next-themes to use data-mode for kumo compatibility"
```

---

### Task 3: Migrate Basic Components (Button, Loader, Badge)

**Files:**

- Modify: `components/BookmarksInfiniteList.tsx`
- Modify: `components/BookmarksList.tsx`
- Modify: `components/BookmarkItem.tsx`
- Modify: `components/CurrentTabCard.tsx`

**Step 1: Replace Spinner with Loader and Button with Kumo Button**

```tsx
import { Button, Loader } from "@cloudflare/kumo";
// ...
<Loader />
<Button variant="primary">Click me</Button>
```

**Step 2: Replace Chip with Badge**

```tsx
import { Badge } from '@cloudflare/kumo'
// ...
;<Badge variant="info">Tag</Badge>
```

**Step 3: Commit basic component migration**

```bash
git add components/BookmarksInfiniteList.tsx components/BookmarksList.tsx components/BookmarkItem.tsx components/CurrentTabCard.tsx
git commit -m "refactor: migrate basic components (Button, Loader, Badge) to Kumo"
```

---

### Task 4: Migrate Layout Components (Surface, LayerCard)

**Files:**

- Modify: `components/CurrentTabCard.tsx`
- Modify: `components/SetupGuide.tsx`
- Modify: `components/BookmarkItem.tsx`

**Step 1: Replace Card with Surface or LayerCard**

```tsx
import { Surface, LayerCard } from '@cloudflare/kumo'
// ...
;<LayerCard className="p-4">...</LayerCard>
```

**Step 2: Commit layout migration**

```bash
git add components/CurrentTabCard.tsx components/SetupGuide.tsx components/BookmarkItem.tsx
git commit -m "refactor: migrate Card to Kumo Surface/LayerCard"
```

---

### Task 5: Migrate Complex Components (Dialog, Popover, Tabs)

**Files:**

- Modify: `components/Settings.tsx`
- Modify: `components/FilterTabs.tsx`
- Modify: `components/BookmarksHeader.tsx`

**Step 1: Replace Modal with Dialog**

Kumo Dialog anatomy: `Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`.

**Step 2: Replace Tabs**

Kumo Tabs anatomy: `Tabs.Root`, `Tabs.List`, `Tabs.Tab`, `Tabs.Indicator`.

**Step 3: Commit complex component migration**

```bash
git add components/Settings.tsx components/FilterTabs.tsx components/BookmarksHeader.tsx
git commit -m "refactor: migrate Modal, Tabs, and Popover to Kumo"
```

---

### Task 6: Icon Migration (Lucide to Phosphor)

**Files:**

- Modify: All components using `lucide-react`

**Step 1: Replace lucide icons with phosphor equivalents**

Example: `Settings` (Lucide) -> `Gear` (Phosphor).

**Step 2: Commit icon migration**

```bash
git add .
git commit -m "refactor: migrate icons from lucide-react to phosphor-icons"
```

---

### Task 7: Cleanup and Verification

**Step 1: Uninstall HeroUI and Lucide**

Run: `pnpm remove @heroui/react @heroui/styles lucide-react`

**Step 2: Run verification commands**

Run: `pnpm compile && pnpm build`

**Step 3: Final Commit**

```bash
git add package.json
git commit -m "chore: remove heroui and lucide dependencies, migration complete"
```
