# 🔖 linkdingX

**The persistent, offline-first sidepanel companion for your linkding instance.**

[ ![linkdingX Sidepanel Preview](public/icon/128.png) ] _(Placeholder for high-quality sidepanel screenshot)_

## Why linkdingX?

Standard extensions vanish the moment you click away. **linkdingX** is built for power users who need a persistent, high-performance workspace while browsing.

### Instant Local Search

Powered by **Dexie.js (IndexedDB)**, linkdingX caches your entire library locally. Search thousands of bookmarks in sub-milliseconds, even if your self-hosted server is slow or offline.

### Persistent Sidepanel

Built using the **Chrome Side Panel API**. Open it once, and it stays with you across tabs. No more losing your search or tags when you click back into the webpage.

### Fire-and-Forget Sync

Add, delete, or toggle unread status instantly. Your changes are queued locally and synchronized automatically in the background via a robust sync queue.

### Modern Aesthetic

A polished, native-feeling interface built with **HeroUI v3** and **React 19**, featuring full dark mode support and smooth animations.

---

## Getting Started

### 1. Installation

[ ![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue?style=for-the-badge&logo=google-chrome) ](https://chrome.google.com/webstore)
[ ![Firefox Add-ons](https://img.shields.io/badge/Firefox-Add--ons-orange?style=for-the-badge&logo=firefox-browser) ](https://addons.mozilla.org)
[ ![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge-Add--ons-0078D4?style=for-the-badge&logo=microsoft-edge) ](https://microsoftedge.microsoft.com/addons)

### 2. Connection Setup

When you first open linkdingX, you'll be guided through the connection process:

1.  **Server URL**: The address of your linkding instance (e.g., `https://bookmarks.example.com`).
2.  **API Token**: Found in your linkding server settings under **Settings > API Token**.

[ ![Setup Guide Screenshot](public/icon/128.png) ] _(Placeholder for setup interface screenshot)_

---

## Features in Depth

### Unified Bookmarks View

Seamlessly toggle between **All**, **Unread**, and **Archived** bookmarks using the integrated filter tabs.

### Current Tab Intelligence

linkdingX automatically detects if the website you're visiting is already in your bookmarks.

- **Real-time Status**: Instant visual feedback if the tab is saved.
- **Quick Actions**: One-click to save, edit, or delete the current page.
- **Metadata Detection**: Automatically pulls page titles and descriptions.

---

## Developer Information

For detailed development guidelines, project structure, and coding standards, please refer to [AGENTS.md](./AGENTS.md).

### Quick Commands

- `pnpm dev`: Start development server (Chrome).
- `pnpm build`: Build production extension.
- `pnpm compile`: Run TypeScript type checks.
- `pnpm format`: Format code with Prettier.

---
