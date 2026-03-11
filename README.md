# linkdingX

The persistent, offline-first sidepanel companion for your linkding instance.

[ ![linkdingX Sidepanel Preview](public/icon/128.png) ] _(Placeholder for high-quality sidepanel screenshot)_

## Getting Started

### Build the Extension

1. **Install dependencies**:

```sh
pnpm install
```

2. **Build for production**:

```sh
pnpm build
```

The compiled extension will be in the `dist/` directory.

### Install in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from your build output
5. linkdingX will appear in your extensions list and sidebar

### Coming to Extension Stores

> [!NOTE]
> linkdingX is not yet available on the Chrome Web Store or other extension marketplaces. We're preparing for official store submission soon! For now, follow the manual installation steps above.

## Why linkdingX?

Standard extensions vanish the moment you click away. linkdingX is built for power users who need a persistent, high-performance workspace while browsing.

### Instant Local Search

Powered by IndexedDB, linkdingX caches your entire library locally. Search thousands of bookmarks in sub-milliseconds, even if your self-hosted server is slow or offline.

### Persistent Sidepanel

Built using the Side Panel. Open it once, and it stays with you across tabs. No more losing your search or tags when you click back into the webpage.

### Fire-and-Forget Sync

Add, delete, or toggle unread status instantly. Your changes are queued locally and synchronized automatically in the background via a robust sync queue.

### Modern Aesthetic

A polished, native-feeling interface built with HeroUI, featuring full dark mode support and smooth animations.

## Features in Depth

### Unified Bookmarks View

Seamlessly toggle between All/Unread/Read bookmarks using the integrated filter tabs.

### Current Tab Intelligence

linkdingX automatically detects if the website you're visiting is already in your bookmarks.

## Quick Commands

- `pnpm build`: Build production extension.
- `pnpm compile`: Run TypeScript type checks.
- `pnpm format`: Format code with Prettier.
