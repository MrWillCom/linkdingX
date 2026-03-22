# Design Doc: BookmarksHeader Surface Consistency

Date: 2026-03-22

## Purpose

Standardize the visual look of the header by using a `Surface` container to match the `BookmarkItem` styling, including its subtle box-shadow and border treatment.

## Architecture

- Replace the root `div` in `BookmarksHeader.tsx` with a `Surface` component.
- Ensure the sticky positioning (`sticky top-0 z-30`) and background color (`bg-kumo-base`) are correctly applied to the `Surface`.

## Success Criteria

- Header includes the standard Kumo `Surface` shadow/border.
- Expansion of `CurrentTabCard` is smoothly integrated within the `Surface`.
- No regression in sticky alignment or layout spacing.
