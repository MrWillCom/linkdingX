# Close side panel on "Open in new tab" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the side panel immediately after opening the home page in a new tab when the "Open in new tab" button is clicked.

**Architecture:** Modify the `onPress` handler of the "Open in new tab" button in the `BookmarksHeader` component to call `window.close()` after `browser.tabs.create()`.

**Tech Stack:** React, WXT, Browser Extension APIs.

---

### Task 1: Update BookmarksHeader onPress handler

**Files:**

- Modify: `components/BookmarksHeader.tsx:134-137`

**Step 1: Modify the onPress handler**

```typescript
// components/BookmarksHeader.tsx
// ...
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              aria-label="Open in new tab"
              onPress={async () => {
                const url = browser.runtime.getURL('/home.html')
                await browser.tabs.create({ url })
                window.close() // Close the side panel
              }}
            >
// ...
```

**Step 2: Verify compilation**

Run: `pnpm compile`
Expected: Success

**Step 3: Commit**

```bash
git add components/BookmarksHeader.tsx
git commit -m "feat: close side panel when opening in new tab"
```
