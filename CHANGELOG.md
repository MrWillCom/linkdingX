# Changelog

## [1.1.0](https://github.com/MrWillCom/linkdingX/compare/v1.0.0...v1.1.0) (2026-04-06)


### Features

* add inline action buttons for bookmarks ([6b0aa7d](https://github.com/MrWillCom/linkdingX/commit/6b0aa7dc5baafa23af44152d66aed008aba46bef))

## 1.0.0 (2026-04-05)


### Features

* add bookmarkService for local-first mutations ([40bfe94](https://github.com/MrWillCom/linkdingX/commit/40bfe94b6b1a3900449ce5faadbc00708257a736))
* add delete confirmation popover using HeroUI Popover ([6c3d360](https://github.com/MrWillCom/linkdingX/commit/6c3d3609f90a8142d27bf944983451ade5861ba6))
* add fetchMetadataFrom and defaultUnread to storage ([d54b766](https://github.com/MrWillCom/linkdingX/commit/d54b76616f93ef9143e86c0de8c4a550330ae7cd))
* add initial options entrypoint ([bec5ad1](https://github.com/MrWillCom/linkdingX/commit/bec5ad1cd2b7e1897dee4d6db671c7c4fbf67cd7))
* add maintenance section and trigger to settings form ([20ac526](https://github.com/MrWillCom/linkdingX/commit/20ac5267ffd3f28b77e8416502fa72465da677a5))
* add Preferences section to SettingsForm ([3aa2bf1](https://github.com/MrWillCom/linkdingX/commit/3aa2bf1758134252ad47138fb1926ad66122f49a))
* add success toast and re-enable save button after validation ([23c19a0](https://github.com/MrWillCom/linkdingX/commit/23c19a0deb7ca6f89453d67485957c4301635e18))
* add user preferences and fix card height animation ([0f323e6](https://github.com/MrWillCom/linkdingX/commit/0f323e6c43baa8e1bb77076a016d7d50c43f5f04))
* **bookmarks:** add realtime metadata tracking for active tab ([bfa93e0](https://github.com/MrWillCom/linkdingX/commit/bfa93e0dea3f560d867d60241afc390a0b370472))
* close side panel when opening in new tab ([268affc](https://github.com/MrWillCom/linkdingX/commit/268affc77ca89b0fca38e3d8b14c795a03331975))
* extract bookmark management and SWR logic to custom hook ([b315176](https://github.com/MrWillCom/linkdingX/commit/b31517669b7f3dabc5bd18a907cfc74eba582a28))
* extract current tab tracking logic to custom hook ([9587876](https://github.com/MrWillCom/linkdingX/commit/9587876b7b1c0743b589d3ae4a88456c5ef380d3))
* **hooks:** add recursive auto-pagination to bookmarks manager ([0efc6a6](https://github.com/MrWillCom/linkdingX/commit/0efc6a61a28700e75b0c2204378372aafda570a3))
* **hooks:** add useCurrentTabBookmark for reactive DB-first state ([a221081](https://github.com/MrWillCom/linkdingX/commit/a2210817c3334fd7ea4721cd6bed2a4a94892709))
* **hooks:** use dynamic fetch limit in bookmarks manager ([b45fe19](https://github.com/MrWillCom/linkdingX/commit/b45fe194468723d9f5b32c00e7d4537f6b628499))
* implement background sync worker ([96790c0](https://github.com/MrWillCom/linkdingX/commit/96790c07d473cd1f207b956f984f7a92107e2f8e))
* implement background sync worker ([923a584](https://github.com/MrWillCom/linkdingX/commit/923a584726d4d26df217ce8f9fba07bab1058d47))
* implement bookmark service with IndexedDB ([87d1866](https://github.com/MrWillCom/linkdingX/commit/87d1866a5658e16d1d5b17c7b77b44248f628288))
* implement bookmarking preferences in handleAdd ([1fd8e7e](https://github.com/MrWillCom/linkdingX/commit/1fd8e7e3013d49a4f19808812df1e37e4c129fd2))
* implement maintenance modal for cleaning local cache ([4f86cf9](https://github.com/MrWillCom/linkdingX/commit/4f86cf9c6778bd3a82a1aee746eaa7e5cb0d7098))
* implement settings form in options page ([52440a9](https://github.com/MrWillCom/linkdingX/commit/52440a9f4e2cfb0d1f31db15a011c8fd9e608eaf))
* improve bookmark deletion reliability and sync filtering ([df2bec0](https://github.com/MrWillCom/linkdingX/commit/df2bec040ae4894e5f79c95ce9e70e3ccbcaec98))
* initialize Dexie database schema ([b38551a](https://github.com/MrWillCom/linkdingX/commit/b38551a901a5c824bef92e7dcab95d7f0e036e80))
* open options page from bookmarks list settings button ([1566668](https://github.com/MrWillCom/linkdingX/commit/1566668b5a383ca5d015460cfbbcccb9bc1bbd58))
* **options:** add Toast.Provider to options page ([aa590f6](https://github.com/MrWillCom/linkdingX/commit/aa590f6ee26ce36242a767c6e4ee2106f17bdb91))
* **options:** trigger success/danger toasts on settings save ([92704ad](https://github.com/MrWillCom/linkdingX/commit/92704ad515c5dbea5b9f29b0afd5cdcc31819ab1))
* refactor UI to use reactive IndexedDB queries ([40e2024](https://github.com/MrWillCom/linkdingX/commit/40e20248f2cbc25073dac9cda2e4f089865d3da5))
* replace setup form with setup guide card ([1471fe6](https://github.com/MrWillCom/linkdingX/commit/1471fe64adfadd67102850587ee8ce316cb238d9))
* **sidepanel:** animate current-page card visibility and status ([4fddb1b](https://github.com/MrWillCom/linkdingX/commit/4fddb1b9495d512b74a9ef026d50383f8657eccb))
* **sidepanel:** revalidate current-tab bookmark cache every 5 minutes ([fea9267](https://github.com/MrWillCom/linkdingX/commit/fea926735674000a8fa988f19dbeb09d6cf3eb6c))
* **sidepanel:** show current page bookmark card with unread toggle ([86bb206](https://github.com/MrWillCom/linkdingX/commit/86bb2060a49b1920f6ea1d197b97ba5bdb902e83))
* simplify delete confirmation with double-click button and include implementation plan ([c5c4355](https://github.com/MrWillCom/linkdingX/commit/c5c435500f1fbdbee0437170053a4c8e8841289e))
* **storage:** add fetch limit to storage and hook ([3a15828](https://github.com/MrWillCom/linkdingX/commit/3a158288a3f7912fd704b54ebd0fe21060316051))
* **ui:** add fetch limit setting to settings form ([d914e29](https://github.com/MrWillCom/linkdingX/commit/d914e2981d824fed5da0de9167924ef80ec0c67a))
* **ui:** show current tab card instantly when URL is present ([b6a440f](https://github.com/MrWillCom/linkdingX/commit/b6a440f8ee5b0b57af6dc747da980624131e97b7))
* unified current tab card with Add/Delete actions ([7af0dd8](https://github.com/MrWillCom/linkdingX/commit/7af0dd8b5e0baa28fb919db93455c9804594c39f))


### Bug Fixes

* add issues:write permission and remove skip-labeling ([c605dcc](https://github.com/MrWillCom/linkdingX/commit/c605dccf4dd7d648e3ab135ad8b849ce60d92a6a))
* address code quality issues in SettingsForm refactor ([417a026](https://github.com/MrWillCom/linkdingX/commit/417a026cfbb4ebb7175e88ac96be131270b64076))
* address code quality issues in SetupGuide component ([71d037a](https://github.com/MrWillCom/linkdingX/commit/71d037a65998ec4fd5680b9e7a60a786a7935543))
* clear current tab bookmark cache after deletion ([d0a28fb](https://github.com/MrWillCom/linkdingX/commit/d0a28fb8a867052d33e0721c94e0e143229c2b6c))
* correct kumo-ui style initialization and import order ([ae21126](https://github.com/MrWillCom/linkdingX/commit/ae21126b28d3ab130de2ea62d4bcf1d7aa07240c))
* enable full-viewport scrolling by decoupling scroll container from max-width ([e62573b](https://github.com/MrWillCom/linkdingX/commit/e62573bec036ad73c5b45510b56aefca98f22614))
* enable full-viewport scrolling in expanded view ([ba9a77f](https://github.com/MrWillCom/linkdingX/commit/ba9a77f6ec044c4ccd72dd890806a6635e3b5ca3))
* hide current tab card for internal chrome tabs by disabling SWR cache ([b90c723](https://github.com/MrWillCom/linkdingX/commit/b90c723c3f5f6d3b9a8a5323338bf202f980f769))
* **hooks:** handle race condition and improve typing in useCurrentTabBookmark ([3fc50cc](https://github.com/MrWillCom/linkdingX/commit/3fc50cceae46f94fa0e764518c13bd1fdd948337))
* manual SWR cache clear on bookmark deletion and sync notification improvements ([f73767c](https://github.com/MrWillCom/linkdingX/commit/f73767c28cf4e995b12e062666ff1d58d81af518))
* move Link overlay to BookmarkItem for full-row click coverage ([1b9ca56](https://github.com/MrWillCom/linkdingX/commit/1b9ca569026f0d17ea4e53d0f464465becf6d7e9))
* preserve metadata after bookmark deletion to show 'Not in Linkding' state ([51f95e8](https://github.com/MrWillCom/linkdingX/commit/51f95e885c3ebce799c1da39068bf26ed4efa395))
* prevent bookmark operations from reverting after sync ([bb06d59](https://github.com/MrWillCom/linkdingX/commit/bb06d5973cf64a9f48e69daad17197e72a216f3b))
* remove delete tasks from sync queue if bookmark not found on server and add toast on error ([c1ab4fa](https://github.com/MrWillCom/linkdingX/commit/c1ab4fa02ad32d3135bfedd95b13fa55e1f03444))
* remove pnpm cache from setup-node to work with Corepack ([0e21a6f](https://github.com/MrWillCom/linkdingX/commit/0e21a6fcd64003ad62e07a5db137b841026ef61b))
* reset current tab state for non-HTTP URLs ([f4bae36](https://github.com/MrWillCom/linkdingX/commit/f4bae36b1b32219058db0d64e8cf1e76cdb6b528))
* resolve popover z-index issue by forcing portal content to top layer ([99c73c2](https://github.com/MrWillCom/linkdingX/commit/99c73c25bf82185aa691c4064eb3b9ab146965a4))
* restore button z-index and use pointer-events for click-through on description ([8d65d72](https://github.com/MrWillCom/linkdingX/commit/8d65d72dc16dd504e5f2366d95aaf62a4c87a502))
* restore missing imports in BookmarksList after merge conflict ([9afc7bb](https://github.com/MrWillCom/linkdingX/commit/9afc7bb9790c6623dac8619932dc15459b1effe7))
* robust tab tracking with onCreated and onFocusChanged listeners ([db7932e](https://github.com/MrWillCom/linkdingX/commit/db7932ecb44b38b2b864439be1a1e9c537b10bb8))
* **settings:** address modal backdrop, sync queue warning, and modal render prop issues ([4a72838](https://github.com/MrWillCom/linkdingX/commit/4a728386225f962d9e60c7e20cbcc3ceeb8d19eb))
* **settings:** re-enable save button after successful save ([b6a31f4](https://github.com/MrWillCom/linkdingX/commit/b6a31f40ffee0c0f2b38611f2c5074c5a1d38cf5))
* **sidepanel:** use direct onScroll for reliable gradient mask detection ([00bb6ae](https://github.com/MrWillCom/linkdingX/commit/00bb6aee0650dfc4171b87b9b9d7cf2b0064cba3))
* skip disabled state for current tab bookmark during metadata polling ([c809ecb](https://github.com/MrWillCom/linkdingX/commit/c809ecb1b4b4ba0af5d93915eb9c62c498a86be9))
* smooth card transition using AnimatePresence wait mode ([ce3edd7](https://github.com/MrWillCom/linkdingX/commit/ce3edd7560145217065c6d3da89cace9e58210c5))
* **ui:** ensure Load More button is visible when observer fails ([f92942d](https://github.com/MrWillCom/linkdingX/commit/f92942d560b3e384d499168babae99f4987f0f95))
* **ui:** improve infinite scroll observer and add scroll revalidation ([f357c75](https://github.com/MrWillCom/linkdingX/commit/f357c75538c5f2dda5dd7a4cd0aac9f64f87551d))
* **ui:** refine BookmarksHeader transitions and accessibility ([86d84ad](https://github.com/MrWillCom/linkdingX/commit/86d84ad7dc916ef187f51a4673c85e7f052ffa93))
* **ui:** simplify parent layout transition in BookmarksList ([effa5aa](https://github.com/MrWillCom/linkdingX/commit/effa5aa346c19b1b70a2c7e5c1ad12e565003104))
* **ui:** switch CurrentTabCard to mode='wait' to prevent layout clipping ([d1ee879](https://github.com/MrWillCom/linkdingX/commit/d1ee8795056d4e764f696fcafc8ac5b126cc4113))
* **ui:** unify metadata fallback logic in CurrentTabCard ([d8d1720](https://github.com/MrWillCom/linkdingX/commit/d8d17201171512e2690beedbc18c1bdfdc09ab57))
* use HeroUI Button for error retry in BookmarksList ([345d014](https://github.com/MrWillCom/linkdingX/commit/345d0148e32568b5e6b2865d0f90bba472d9be76))
* use server bookmark data when local cache misses and persist to IndexedDB ([335cdd5](https://github.com/MrWillCom/linkdingX/commit/335cdd5462e8205ae712c525ddeca320a40edfd6))


### Performance Improvements

* optimize React components and fix performance anti-patterns ([12b968c](https://github.com/MrWillCom/linkdingX/commit/12b968cc3cf942d1d2e6014b5d98c7a85337ae03))
