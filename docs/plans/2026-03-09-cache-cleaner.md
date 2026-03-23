# Cache Cleaner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Maintenance" modal in the Options page allowing users to clear the bookmark cache and/or sync queue.

**Architecture:** A new section in `SettingsForm.tsx` triggers a HeroUI `Modal`. The modal manages its own selection state and executes Dexie `clear()` operations on the corresponding tables.

**Tech Stack:** React 19, HeroUI v3 (Modal, Checkbox, Button), Dexie.js.

---

### Task 1: Setup Maintenance Section and Trigger

**Files:**

- Modify: `components/SettingsForm.tsx`

**Step 1: Add "Maintenance" section to UI**

Add a new section after the Preferences block in `SettingsForm.tsx` with a "Clean Local Data..." button.

```tsx
{/* After Preferences RadioGroup block */}
<div className="h-px bg-default-200" />
<div className="flex flex-col gap-4">
  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
    Maintenance
  </h2>
  <Button variant="secondary" className="w-fit" onPress={() => setIsModalOpen(true)}>
    Clean Local Data...
  </Button>
</div>
```

**Step 2: Add state for Modal**

Add `const [isModalOpen, setIsModalOpen] = useState(false)` at the top of the component.

**Step 3: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat: add maintenance section trigger to settings form"
```

---

### Task 2: Implement Maintenance Modal Component

**Files:**

- Modify: `components/SettingsForm.tsx`

**Step 1: Define Selection State and Cleanup Logic**

Inside `SettingsForm`, add state for checkboxes and the cleanup function.

```tsx
const [cleanBookmarks, setCleanBookmarks] = useState(true)
const [cleanSyncQueue, setCleanSyncQueue] = useState(false)

const handleClean = async (close: () => void) => {
  try {
    if (cleanBookmarks) await db.bookmarks.clear()
    if (cleanSyncQueue) await db.sync_queue.clear()

    toast.success('Local data cleaned successfully')
    close()

    // Trigger sync if bookmarks were cleared
    if (cleanBookmarks) {
      browser.runtime.sendMessage({ type: 'sync-bookmarks' })
    }
  } catch (err) {
    toast.danger('Failed to clean local data')
  }
}
```

**Step 2: Add Modal UI**

Implement the HeroUI `Modal` at the bottom of the component.

```tsx
<Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
  <Modal.Backdrop variant="blur">
    <Modal.Container>
      <Modal.Dialog className="sm:max-w-[400px]">
        {({ close }) => (
          <>
            <Modal.Header>
              <Modal.Heading>Clean Local Data</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                Select which local data you want to remove. This can help resolve synchronization
                issues.
              </p>
              <Checkbox isSelected={cleanBookmarks} onChange={setCleanBookmarks}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label>Bookmark Cache</Label>
                </Checkbox.Content>
              </Checkbox>
              <Checkbox isSelected={cleanSyncQueue} onChange={setCleanSyncQueue}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label>Pending Sync Queue</Label>
                  <Description className="text-danger">
                    Warning: Unsaved changes will be lost.
                  </Description>
                </Checkbox.Content>
              </Checkbox>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={close}>
                Cancel
              </Button>
              <Button variant="danger" onPress={() => handleClean(close)}>
                Clean Selected Data
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```

**Step 3: Commit**

```bash
git add components/SettingsForm.tsx
git commit -m "feat: implement cache cleaning modal"
```

---

### Task 3: Verification and Polishing

**Files:**

- Modify: `components/SettingsForm.tsx` (Imports)

**Step 1: Ensure all imports are present**

Verify `Modal`, `Checkbox`, `Description`, `db` are imported correctly.

**Step 2: Run Type Check**

Run: `pnpm compile`
Expected: SUCCESS

**Step 3: Run Formatter**

Run: `pnpm format`
Expected: SUCCESS

**Step 4: Final Commit**

```bash
git commit -m "style: finalize cache cleaner implementation"
```
