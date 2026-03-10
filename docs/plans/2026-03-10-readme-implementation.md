# Comprehensive README Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overwrite the generic README.md with a professional, user-centric guide for the linkdingX extension.

**Architecture:** A "Visual Guide" structure focusing on key differentiators discovered during codebase analysis (Sidepanel, Caching, Sync Queue).

**Tech Stack:** Markdown, GFM.

---

### Task 1: Create the new README.md structure

**Files:**

- Modify: `README.md`

**Step 1: Write the minimal structure**
Write the following content to `README.md`:

```markdown
# linkdingX

[![WXT](https://img.shields.io/badge/built%20with-WXT-blue?style=flat-square)](https://wxt.dev)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![HeroUI](https://img.shields.io/badge/HeroUI-v3-orange?style=flat-square)](https://v3.heroui.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38b2ac?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

**The persistent, offline-first sidepanel companion for your linkding instance.**

[ ![linkdingX Sidepanel Preview](public/icon/128.png) ] _(Placeholder for high-quality sidepanel screenshot)_

## Why linkdingX?

Standard extensions vanish the moment you click away. **linkdingX** is built for power users who need a persistent, high-performance workspace while browsing.

### ⚡️ Instant Local Search

Powered by **Dexie.js (IndexedDB)**, linkdingX caches your entire library locally. Search thousands of bookmarks in sub-milliseconds, even if your self-hosted server is slow or offline.

### 🧱 Persistent Sidepanel

Built using the **Chrome Side Panel API**. Open it once, and it stays with you across tabs. No more losing your search or tags when you click back into the webpage.

### 📡 Fire-and-Forget Sync

Add, delete, or toggle unread status instantly. Your changes are queued locally and synchronized automatically in the background via a robust sync queue.

### 💎 Modern Aesthetic

A polished, native-feeling interface built with **HeroUI v3** and **React 19**, featuring full dark mode support and smooth animations.

---

## 🚀 Getting Started

### 1. Installation

_Currently in development. Load the unpacked extension from the `dist/` folder after running `pnpm build`._

### 2. Connection Setup

When you first open linkdingX, you'll be guided through the connection process:

1.  **Server URL**: The address of your linkding instance (e.g., `https://bookmarks.example.com`).
2.  **API Token**: Found in your linkding server settings under **Settings > API Token**.

[ ![Setup Guide Screenshot](public/icon/128.png) ] _(Placeholder for setup interface screenshot)_

---

## 🛠 Features in Depth

### Unified Bookmarks View

Seamlessly toggle between **All**, **Unread**, and **Archived** bookmarks using the integrated filter tabs.

### Real-time Tab Tracking

linkdingX automatically detects if the website you are currently visiting is already in your collection, allowing for quick unread toggling or deletion.

### Maintenance & Health

Built-in tools to manage your local state:

- **Cache Cleaning**: Re-sync your entire library from the server if local state becomes inconsistent.
- **Sync Status**: Real-time visual feedback on background synchronization progress.

---

## 💻 Developer Information

For detailed development guidelines, project structure, and coding standards, please refer to [AGENTS.md](./AGENTS.md).

### Quick Commands

- `pnpm dev`: Start development server (Chrome).
- `pnpm build`: Build production extension.
- `pnpm compile`: Run TypeScript type checks.
- `pnpm format`: Format code with Prettier.

---

_linkdingX is an unofficial companion and is not affiliated with the official linkding project._
```

**Step 2: Verify content**
Check that the file reflects the new structure.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: implement comprehensive user-centric README"
```
