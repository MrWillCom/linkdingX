# Design Doc: Full-Viewport Scrolling for Expanded View

## Problem

In the "expanded" view (new tab), the `BookmarksList` component uses `max-w-3xl mx-auto` on the scrollable container. This results in left and right margins that are not part of the scrollable area. When a user's mouse is over these margins, scrolling the mouse wheel does not scroll the content, which feels unintuitive and "broken" to users.

## Proposed Solution

Decouple the scrollable container's width from the content's visual layout.

1.  **Main Container**: The container with `overflow-y-auto` should always be full-width (`w-full`) to capture scroll events across the entire viewport.
2.  **Content Wrapper**: Introduce a wrapper `div` inside the scrollable container. This wrapper will apply the `max-w-3xl mx-auto` constraint ONLY when the `variant` is `expanded`.

## Affected Components

- `components/BookmarksList.tsx`: Modify the JSX structure to introduce the content wrapper and move the layout classes.

## Verification Plan

- **Manual Verification**: Open the extension in a new tab ("expanded" view). Ensure scrolling works when the mouse is over the left/right margins.
- **Layout Consistency**: Ensure the centered layout remains identical to the current implementation.
- **Side Panel Verification**: Ensure the "default" variant (side panel) remains unaffected and full-width as expected.
