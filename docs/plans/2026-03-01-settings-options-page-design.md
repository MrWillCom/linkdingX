# Design Doc: Options Page & Settings Refactor

Date: 2026-03-01

## Purpose

This document outlines the plan for migrating the `Settings` functionality from a modal to a separate Options page, following WXT and HeroUI best practices.

## Proposed Changes

### 1. New Options Page

- Create `entrypoints/options/` directory.
- Implement `index.html` and `main.tsx`.
- Create a `SettingsPage.tsx` component that:
  - Uses the logic from `Settings.tsx`.
  - Displays as a centered, full-page form using HeroUI.

### 2. Home Entrypoint Updates

- Replace the existing "Settings" modal trigger in `BookmarksList.tsx` with a button that calls `browser.runtime.openOptionsPage()`.
- Create a `SetupGuide.tsx` component to replace `Setup.tsx`.
- Update `entrypoints/home/App.tsx` to use `SetupGuide` if `!isSetupComplete`.

### 3. Cleanup

- Remove `components/Setup.tsx`.
- Refactor `components/Settings.tsx` into a pure form component (potentially `SettingsForm.tsx`).

## Architecture & Data Flow

- Use `useSetup` hook for storage access in all components.
- Standard WXT `browser.runtime.openOptionsPage()` for navigating to settings.

## Success Criteria

- [ ] Options page exists and is accessible.
- [ ] Home settings button opens options in a new tab.
- [ ] Users without setup are guided to the options page.
- [ ] `Setup.tsx` is removed.
- [ ] All HeroUI components use correct props and WAI-ARIA patterns.
