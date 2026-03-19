# Design: Fetch Limit Usability Improvement

**Goal:** Simplify the fetch limit setting by focusing on a single, high-precision input method.

**Context:** The current implementation uses both a `NumberField` and a `Slider`. The slider is difficult to use for a 1-1000 range, and the redundancy adds visual clutter to the settings form.

## Design Details

### 1. Remove Slider Component

The `Slider` will be removed from `components/SettingsForm.tsx`. This clarifies the UI and ensures the user only has one way to set the limit.

### 2. Configure NumberField for Precision

The `NumberField` will be configured to be the primary input method:

- `minValue={1}`
- `maxValue={1000}`
- `step={5}`: This allows the increment/decrement buttons to move in manageable chunks, while still allowing the user to type any specific number.
- Standard HeroUI v3 compound structure:
  ```tsx
  <NumberField ...>
    <Label>Fetch Limit</Label>
    <NumberField.Group>
      <NumberField.DecrementButton />
      <NumberField.Input />
      <NumberField.IncrementButton />
    </NumberField.Group>
    <Description>Number of bookmarks to fetch per page.</Description>
  </NumberField>
  ```

### 3. State Management

Continue using the existing `useReducer` and `useSetup` hooks to read from and write to WXT storage.

## Success Criteria

- [ ] Slider is removed from the UI.
- [ ] NumberField functions correctly with a step of 5.
- [ ] Fetch limit values are persisted to storage on save.
- [ ] Form remains accessible and visually consistent with HeroUI v3 standards.
