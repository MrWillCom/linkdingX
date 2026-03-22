# Layout and Visual Polish for home.html Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix button sizing inconsistencies, eliminate the top background "stripe", and refine container borders on the expanded home page.

**Architecture:** Normalize remaining `size="sm"` buttons, adjust padding hierarchy to ensure sticky header alignment, and remove side borders from list items for a cleaner full-page layout.

**Tech Stack:** React 19, @cloudflare/kumo, Tailwind CSS v4.

---

### Task 1: Normalize Settings Button Size

**Files:**

- Modify: `components/BookmarksHeader.tsx`

**Step 1: Remove size="sm" from the settings button**

```tsx
// components/BookmarksHeader.tsx:158
<Button
  variant="ghost"
  shape="square"
  aria-label="Open settings"
  onClick={() => browser.runtime.openOptionsPage()}
>
```

**Step 2: Commit changes**

```bash
git add components/BookmarksHeader.tsx
git commit -m "style: normalize settings button size in header"
```

---

### Task 2: Fix Top Layout Gap (Stripe)

**Files:**

- Modify: `components/BookmarksInfiniteList.tsx`

**Step 1: Add top padding to the list container**

```tsx
// components/BookmarksInfiniteList.tsx:28
<div className="pt-2">
```

_(Note: Verification showed this already has pt-2, but we need to ensure the parent DOES NOT have padding that pushes the header down)_

**Step 2: Remove top padding from the main wrapper in home view**

_(Wait, I need to check where the `#root > .h-screen > .max-w-3xl > .pt-2` from the feedback is coming from. It matches `BookmarksInfiniteList.tsx:28` exactly in the component code I read earlier.)_

**Correction Step 1: Ensure header is truly sticky at top 0**
Modify `components/BookmarksHeader.tsx:77` to ensure no parent padding is interfering.

**Step 2: Commit changes**

```bash
git commit -m "style: fix top layout gap by ensuring header stickiness"
```

---

### Task 3: Refine List Borders and "Kumo Base" Appearance

**Files:**

- Modify: `components/BookmarkItem.tsx`

**Step 1: Remove side borders from Surface component**

```tsx
// components/BookmarkItem.tsx:35
<Surface
  className={`flex items-start gap-1 py-2 px-2 hover:bg-kumo-elevated transition-colors border-b border-kumo-line last:border-b-0 border-x-0 ${isDimmed ? 'opacity-50' : ''}`}
>
```

**Step 2: Verify build**

Run: `pnpm compile`

**Step 3: Commit changes**

```bash
git add components/BookmarkItem.tsx
git commit -m "style: remove side borders from bookmark items for cleaner list"
```
