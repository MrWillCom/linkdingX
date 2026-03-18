# Design Doc: Close side panel on "Open in new tab"

## Summary

When the user clicks the "Open in new tab" button in the side panel header, the extension should open the extension's home page in a new tab AND close the current side panel.

## Context

The side panel provides a compact view of bookmarks. Users often want to "expand" this view into a full tab. Once the new tab is opened, the side panel is redundant for that specific workflow and should be dismissed to free up screen real estate.

## Design

The `BookmarksHeader` component contains the "Open in new tab" button. We will modify its `onPress` handler.

### Approach: Direct `window.close()`

As the side panel is an extension page context, calling `window.close()` is the most reliable and direct way to dismiss it.

1.  Trigger `browser.tabs.create({ url: browser.runtime.getURL('/home.html') })`.
2.  Immediately follow with `window.close()`.

## Success Criteria

- Clicking the "Open in new tab" button opens `/home.html` in a new tab.
- The side panel closes immediately after the new tab is created.
- Other interactions (like clicking settings or bookmarks) do NOT close the side panel.

## Testing

1.  Open the side panel.
2.  Click the "Open in new tab" button.
3.  Verify the side panel is closed.
4.  Verify the new tab is open at the correct URL.
