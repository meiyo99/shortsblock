# ShortsBlock: Implementation Status & Plan

## ✅ Current Status
**MVP COMPLETE** - All core features implemented and working. Extension is functional and has been built.

**What's Working:**
- ✅ Extension on/off toggle with dynamic icon generation (purple S = on, gray S = off)
- ✅ Homepage redirect to subscriptions feed
- ✅ YouTube Shorts completely blocked (network + UI)
- ✅ Focused watch page (sidebar hidden, Home button hidden/redirected)
- ✅ Comment redaction with user toggle
- ✅ Compact popup interface (300px)
- ✅ Real-time settings sync across tabs

**⏳ Planned Refinements & New Features (v1.1):**
- 🔧 Remove Explore section from YouTube side nav
- 🔧 Fix video player centering on watch page (gap on right side)
- 🔧 Independent toggles for "Block Shorts" and "Redirect Homepage"
- ✨ Grayscale Mode (reduce dopamine from colorful thumbnails)
- ✨ Hide Metrics & Clickbait (view counts, subscriber counts, publish dates)

---

## 🚀 v1.1 Quick Implementation Guide

**Goal**: Transform from "all-or-nothing" to flexible, modular focus tool with granular control.

### Changes Overview

| Component | Current (v1.0) | New (v1.1) |
|-----------|---------------|------------|
| **Storage** | 2 keys (extensionEnabled, redactComments) | 6 keys (+blockShorts, +redirectHomepage, +grayscaleMode, +hideMetrics) |
| **CSS Classes** | 1 class (shortsblock-active) | 4 classes (+shortsblock-shorts-on, +shortsblock-grayscale, +shortsblock-hide-metrics) |
| **Popup Toggles** | 1 toggle (Redact Comments) | 5 toggles (+Block Shorts, +Redirect Homepage, +Grayscale, +Hide Metrics) |
| **Feature Gating** | All features always-on when enabled | Each feature independently toggleable |

### Implementation Steps (75 min total)

#### Step 1: CSS Updates (15 min) - `src/content.css`
Add ~80 lines of new CSS:
- **Explore section hiding**: Target `ytd-guide-section-renderer:has(a[href*="/feed/trending"])`
- **Video player centering**: Flex center `#columns`, expand `#primary` to 1280px max-width
- **Shorts re-scoping**: Duplicate all Shorts rules with `shortsblock-shorts-on` prefix
- **Grayscale mode**: `html.shortsblock-grayscale { filter: grayscale(100%); }`
- **Hide metrics**: Target metadata spans, subscriber counts, dates, like counts

#### Step 2: Content Script Refactor (20 min) - `src/content.ts`
Replace `applyActiveState()` with `applyAllClasses()`:
```typescript
function applyAllClasses(): void {
  chrome.storage.sync.get({
    extensionEnabled: true,
    blockShorts: true,
    grayscaleMode: false,
    hideMetrics: false
  }, (result) => {
    const enabled = result.extensionEnabled !== false;
    document.documentElement.classList.toggle('shortsblock-active', enabled);
    document.documentElement.classList.toggle('shortsblock-shorts-on', enabled && result.blockShorts !== false);
    document.documentElement.classList.toggle('shortsblock-grayscale', enabled && result.grayscaleMode === true);
    document.documentElement.classList.toggle('shortsblock-hide-metrics', enabled && result.hideMetrics === true);
  });
}
```

#### Step 3: Background Script Update (5 min) - `src/background.ts`
Gate homepage redirect:
```typescript
chrome.storage.sync.get({ extensionEnabled: true, redirectHomepage: true }, (result) => {
  if (result.extensionEnabled !== false && result.redirectHomepage !== false) {
    // redirect logic
  }
});
```

#### Step 4: Popup UI Expansion (30 min) - `src/popup/`
- **HTML**: Add 4 new toggle blocks in `popup.html`
- **TypeScript**: Add 4 new storage listeners in `popup.ts`
- **CSS**: Adjust height if needed (may need `max-height: 600px; overflow-y: auto`)

#### Step 5: Build & Test (40 min)
```bash
npm run build
# Load dist/ folder in chrome://extensions
# Run full testing checklist (see Phase 9 section below)
```

### Quick Testing Checklist
- [ ] Explore section hidden, other nav visible
- [ ] Video player centered (no right gap)
- [ ] Block Shorts toggle works independently
- [ ] Redirect Homepage toggle works independently
- [ ] Grayscale mode desaturates page, preserves video color
- [ ] Hide Metrics removes counts/dates
- [ ] Multi-tab sync works for all toggles
- [ ] Master toggle disables all features

### Files to Modify
1. `src/content.css` - Add ~80 lines
2. `src/content.ts` - Replace 1 function, update listener
3. `src/background.ts` - Add 1 condition check
4. `src/popup/popup.html` - Add 4 toggle blocks
5. `src/popup/popup.ts` - Add 4 listeners, update init/updateUI

**Estimated Total Time**: 2 hours (75 min implementation + 40 min testing)

**For detailed implementation code, see**:
- Phase 7: Bug Fixes & Feature Refinements (line 505)
- Phase 8: New Features (line 649)
- Phase 9: Testing & Refinement (line 777)

---

## Context
Chrome extension to help users maintain focus on YouTube by eliminating distractions. Users can toggle the entire extension on/off via a power button, and independently control individual features (comment redaction, Shorts blocking, homepage redirect, grayscale, metric hiding).

## Technology Stack (March 2026)
- **Manifest Version**: V3 (mandatory)
- **Languages**: TypeScript for type safety
- **Build Tool**: Vite 5+ with `@crxjs/vite-plugin`
- **APIs**: `declarativeNetRequest`, `webNavigation`, `storage`, `scripting`
- **Styling**: Vanilla CSS injected via content scripts

## Architecture Decisions

### Permission Strategy
- **`declarativeNetRequest`**: Block/redirect Shorts URLs at network level
- **`webNavigation`**: Detect homepage visits for redirect to subscriptions
- **`storage`**: Persist user preferences for feature toggles
- **`scripting`**: Inject CSS and JavaScript into YouTube pages
- **Host permissions**: `*://*.youtube.com/*`

### Component Breakdown (As Implemented)
1. **Service Worker** (`background.ts`):
   - Dynamic icon generation using OffscreenCanvas (purple/gray "S" icons)
   - Update icon based on extension enabled/disabled state
   - Listen for `webNavigation.onCommitted` → redirect homepage when enabled
   - `declarativeNetRequest` rules defined in `public/rules.json`

2. **Content Scripts** (`content.ts`):
   - Manage `shortsblock-active` class on `<html>` element based on extension state
   - Intercept Home button clicks → redirect to subscriptions when active
   - CommentRedactor class with MutationObserver for comment text replacement
   - Listen for YouTube SPA navigation events (`yt-navigate-finish`)
   - Storage change listeners for real-time updates

3. **Content Styles** (`content.css`):
   - All CSS rules scoped under `html.shortsblock-active` selector
   - Hides: Shorts nav, Shorts shelves, Shorts tabs, Home button, recommended videos, end screen cards

4. **Popup Interface** (`popup.html/ts/css`):
   - 300px compact popup with power button
   - Visual states: purple gradient (on) / gray gradient (off)
   - Single user toggle: "Redact Comments"
   - Real-time save status indicator

## Implementation Phases

### Phase 1: Project Setup & Infrastructure ✅ COMPLETED

**1.1 Initialize Project**
```bash
npm init -y
npm install -D typescript vite @crxjs/vite-plugin
npm install -D @types/chrome
```

**Actual Project Structure**
```
shortsblock/
├── src/
│   ├── manifest.json
│   ├── background.ts        ✅ Dynamic icon generation, homepage redirect
│   ├── content.ts           ✅ Active class management, Home click intercept, comment redaction
│   ├── content.css          ✅ All hiding rules scoped under .shortsblock-active
│   └── popup/
│       ├── popup.html       ✅ Power button + comment toggle
│       ├── popup.ts         ✅ State management & UI updates
│       └── popup.css        ✅ Purple/gray visual states
├── public/
│   └── rules.json           ✅ Network-level Shorts blocking
├── docs/
│   └── project_plan.md      📝 This file
├── dist/                    ✅ Built extension output
├── vite.config.ts           ✅ @crxjs/vite-plugin configuration
├── tsconfig.json            ✅ TypeScript config
└── package.json             ✅ Dependencies & scripts
```

**Note:** Icons are dynamically generated (no icon files needed).

**Actual manifest.json Configuration**
```json
{
  "manifest_version": 3,
  "name": "ShortsBlock",
  "version": "1.0.0",
  "description": "Build focus by blocking YouTube distractions",
  "permissions": [
    "declarativeNetRequest",
    "webNavigation",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "*://*.youtube.com/*"
  ],
  "background": {
    "service_worker": "src/background.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["src/content.ts"],
      "css": ["src/content.css"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "src/popup/popup.html"
  },
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "shorts_blocker",
        "enabled": true,
        "path": "rules.json"
      }
    ]
  }
}
```

**Storage Structure** (Updated for v1.1)
- `extensionEnabled`: boolean (default: true) - Master on/off switch
- `redactComments`: boolean (default: true) - Comment redaction toggle
- `blockShorts`: boolean (default: true) - Independent Shorts blocking toggle
- `redirectHomepage`: boolean (default: true) - Independent homepage redirect toggle
- `grayscaleMode`: boolean (default: false) - Grayscale/b&w mode toggle
- `hideMetrics`: boolean (default: false) - Hide view counts, sub counts, dates toggle

---

### Phase 2: Feature 1 - Homepage Redirect ✅ COMPLETED

**Actual Implementation** in `src/background.ts`:

```typescript
chrome.webNavigation.onCommitted.addListener(
  (details) => {
    chrome.storage.sync.get({ extensionEnabled: true }, (result) => {
      if (result.extensionEnabled !== false) {
        const url = new URL(details.url);
        if (url.pathname === '/' || url.pathname === '') {
          chrome.tabs.update(details.tabId, {
            url: 'https://www.youtube.com/feed/subscriptions'
          });
        }
      }
    });
  },
  { url: [{ hostEquals: 'www.youtube.com' }, { hostEquals: 'youtube.com' }] }
);
```

**Key Change:** Checks `extensionEnabled` instead of individual `redirectHomepage` setting.

✅ **Verified Working:** Redirects homepage to subscriptions when extension is enabled.

---

### Phase 3: Feature 2 - Block YouTube Shorts ✅ COMPLETED

**Actual Implementation:**

**Network Blocking** (`public/rules.json`) - Unchanged:
```json
[
  {
    "id": 1,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": { "url": "https://www.youtube.com/feed/subscriptions" }
    },
    "condition": {
      "urlFilter": "*://www.youtube.com/shorts/*",
      "resourceTypes": ["main_frame"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": "*://www.youtube.com/shorts/*",
      "resourceTypes": ["sub_frame", "xmlhttprequest"]
    }
  }
]
```

**UI Hiding** (`src/content.css`) - All rules scoped under `.shortsblock-active`:
```css
html.shortsblock-active ytd-guide-entry-renderer[title="Shorts"],
html.shortsblock-active ytd-guide-entry-renderer a[title="Shorts"],
html.shortsblock-active ytd-mini-guide-entry-renderer[aria-label="Shorts"],
html.shortsblock-active a[title="Shorts"],
html.shortsblock-active ytd-rich-shelf-renderer[is-shorts],
html.shortsblock-active ytd-reel-shelf-renderer,
html.shortsblock-active [is-shorts],
html.shortsblock-active ytd-reel-video-renderer,
html.shortsblock-active yt-tab-shape[tab-title="Shorts"],
html.shortsblock-active tp-yt-paper-tab:has(a[href*="/shorts"]),
html.shortsblock-active yt-tab-group-shape a[href*="/shorts"],
html.shortsblock-active ytm-pivot-bar-item-renderer[pivot-identifier="SHORTS"],
html.shortsblock-active a[href*="/shorts/"] {
  display: none !important;
}
```

**Key Change:** CSS scoping allows instant enable/disable by toggling the `shortsblock-active` class.

✅ **Verified Working:** Shorts completely blocked when extension enabled.

---

### Phase 4: Feature 3 - Focused Watch Page ✅ COMPLETED

**Actual Implementation:**

**CSS** (`src/content.css`) - Simplified, scoped version:
```css
/* Hide recommended videos sidebar */
html.shortsblock-active ytd-watch-next-secondary-results-renderer {
  display: none !important;
}

/* Hide end-screen recommendations */
html.shortsblock-active .ytp-ce-element,
html.shortsblock-active .ytp-endscreen-content,
html.shortsblock-active .ytp-suggestion-set {
  display: none !important;
}

/* Hide Home button in sidebar */
html.shortsblock-active ytd-guide-entry-renderer:has(a[href="/"]),
html.shortsblock-active ytd-mini-guide-entry-renderer:has(a[href="/"]) {
  display: none !important;
}
```

**JavaScript** (`src/content.ts`) - Home click interception:
```typescript
function interceptHomeClicks(): void {
  document.addEventListener('click', (e) => {
    if (!document.documentElement.classList.contains('shortsblock-active')) return;

    const target = e.target as HTMLElement;
    const anchor = target.closest('a[href="/"]');

    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'https://www.youtube.com/feed/subscriptions';
    }
  }, true);
}
```

**Key Changes:**
- Removed complex fullscreen logic
- Added Home button hiding + click interception
- Playlists and chapters work naturally

✅ **Verified Working:** Clean, focused watch experience with no distractions.

---

### Phase 5: Feature 4 - Comment Redaction ✅ COMPLETED

**Actual Implementation** in `src/content.ts`:

```typescript
class CommentRedactor {
  private observer: MutationObserver | null = null;
  private processedNodes = new WeakSet<Node>();

  init(): void {
    chrome.storage.sync.get({ extensionEnabled: true, redactComments: true }, (result) => {
      if (result.extensionEnabled !== false && result.redactComments !== false) {
        this.startObserving();
      }
    });

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.extensionEnabled || changes.redactComments) {
        this.destroy();
        chrome.storage.sync.get({ extensionEnabled: true, redactComments: true }, (result) => {
          if (result.extensionEnabled !== false && result.redactComments !== false) {
            this.startObserving();
          }
        });
      }
    });
  }

  private startObserving(): void {
    this.observer = new MutationObserver(() => {
      this.processComments();
    });

    const tryObserve = (): void => {
      const commentsSection = document.querySelector('ytd-comments#comments');
      if (commentsSection) {
        this.observer!.observe(commentsSection, {
          childList: true,
          subtree: true
        });
        this.processComments();
      }
    };

    tryObserve();

    // Retry with fallback + navigation listener
    // ... (see content.ts for full implementation)
  }

  private processComments(): void {
    // Multiple selector fallbacks for robustness
    const selectors = [
      '#content-text',
      'yt-attributed-string#content-text',
      '#content-text span',
      '.ytd-comment-renderer #content-text'
    ];

    let commentTexts: NodeListOf<Element> | null = null;
    for (const selector of selectors) {
      commentTexts = document.querySelectorAll(selector);
      if (commentTexts.length > 0) break;
    }

    if (!commentTexts || commentTexts.length === 0) return;

    commentTexts.forEach((element) => {
      this.redactTextNodes(element);
    });
  }

  private redactTextNodes(element: Element): void {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (this.processedNodes.has(node)) continue;
      if (!node.textContent || !node.textContent.trim()) continue;

      node.textContent = node.textContent
        .split(/(\s+)/)
        .map(part => part.trim() ? 'blah' : part)
        .join('');

      this.processedNodes.add(node);
    }
  }
}
```

**Key Features:**
- WeakSet tracks processed nodes (not elements) for accurate redaction
- Multiple selector fallbacks for robustness
- TreeWalker for precise text node manipulation
- Real-time storage listener for instant updates

✅ **Verified Working:** All comments replaced with "blah" when enabled.

---

### Phase 6: Popup Interface & On/Off Toggle ✅ COMPLETED

**Design Decision:** Changed from options page to compact 300px popup with power button.

**Actual Implementation:**

**Popup HTML** (`src/popup/popup.html`):
```html
<div class="popup" id="popup">
  <header>
    <h1>ShortsBlock</h1>
    <button class="power-btn" id="powerBtn" title="Toggle extension">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="2" x2="12" y2="12"></line>
        <path d="M16.24 7.76a6 6 0 1 1-8.49-.01"></path>
      </svg>
    </button>
  </header>

  <main>
    <div class="status">
      <span class="status-dot" id="statusDot"></span>
      <span id="statusText">Active on YouTube</span>
    </div>

    <div class="divider"></div>

    <div class="option">
      <div class="option-info">
        <h3>Redact Comments</h3>
        <p>Replace comment text with "blah"</p>
      </div>
      <label class="toggle">
        <input type="checkbox" id="redactComments">
        <span class="slider"></span>
      </label>
    </div>
  </main>

  <footer>
    <div class="save-status" id="saveStatus"></div>
  </footer>
</div>
```

**Popup Logic** (`src/popup/popup.ts`):
```typescript
function updateUI(enabled: boolean): void {
  if (enabled) {
    popup.classList.remove('disabled');
    statusDot.classList.remove('off');
    statusText.textContent = 'Active on YouTube';
    redactCheckbox.disabled = false;
  } else {
    popup.classList.add('disabled');
    statusDot.classList.add('off');
    statusText.textContent = 'Paused';
    redactCheckbox.disabled = true;
  }
}

powerBtn.addEventListener('click', () => {
  chrome.storage.sync.get({ extensionEnabled: true }, (result) => {
    const newState = result.extensionEnabled === false;
    chrome.storage.sync.set({ extensionEnabled: newState }, () => {
      updateUI(newState);
      showStatus(newState ? 'Enabled!' : 'Paused');
    });
  });
});
```

**Visual States:**
- **Enabled**: Purple gradient header, green status dot, "Active on YouTube"
- **Disabled**: Gray gradient header, gray status dot, "Paused", controls disabled

**Dynamic Icons** (`src/background.ts`):
```typescript
function generateIcon(color: string, size: number): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  // Circle background
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // White "S" letter
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.55}px sans-serif`;
  ctx.fillText('S', size / 2, size / 2 + 1);
  return ctx.getImageData(0, 0, size, size);
}

function updateIcon(enabled: boolean): void {
  const color = enabled ? '#667eea' : '#999999';
  chrome.action.setIcon({
    imageData: {
      16: generateIcon(color, 16),
      32: generateIcon(color, 32),
      48: generateIcon(color, 48),
      128: generateIcon(color, 128)
    }
  });
}
```

**Key Features:**
- No image files needed (dynamic generation)
- Instant visual feedback
- Real-time sync across tabs
- Power button always accessible even when disabled

✅ **Verified Working:** Clean, intuitive interface with instant on/off toggle.

---

### Phase 7: Bug Fixes & Feature Refinements (v1.1) ⏳ PENDING

---

#### Fix 1: Remove Explore Section from Side Navigation

**Problem:** The side nav currently only hides the Shorts button. The full "Explore" group (Trending, Shopping, Music, Movies & TV, Live, Gaming, News, Sports, Learning, Fashion & Beauty, Podcasts) is still visible and provides distraction pathways away from subscriptions.

**Implementation:** Add CSS rules to `src/content.css` to hide the Explore group entirely.

**Scope (Confirmed):** Hide only the **Explore section group** — Trending, Shopping, Music, Movies & TV, Gaming, News, Sports, Learning, Fashion & Beauty, Podcasts. All other sidebar items (Subscriptions, You, History, Library, etc.) remain visible.

**Target CSS Selectors:
```css
/* Hide entire Explore section in the side nav */
/* The Explore group is wrapped in a guide section renderer - target by its child links */
html.shortsblock-active ytd-guide-section-renderer:has(a[href*="/feed/trending"]),
html.shortsblock-active ytd-guide-section-renderer:has(a[href*="/channel/UCrpQ4p1Ql_hG8rKXIKM1MOQ"]) {
  /* Shopping, Trending section */
  display: none !important;
}

/* Hide individual Explore items as a fallback */
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/feed/trending"]),
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/gaming"]),
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/news"]),
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/sports"]),
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/learning"]),
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/fashion"]),
html.shortsblock-active ytd-guide-entry-renderer:has(a[href*="/podcasts")) {
  display: none !important;
}
```

**Test Scenarios:**
- Check sidebar → Explore section (Trending, Gaming, News, Sports, etc.) should be hidden
- Subscriptions and You sections should remain visible
- Toggle extension off → Explore section should reappear

---

#### Fix 2: Video Player Centering on Watch Page

**Problem:** When the recommended videos sidebar is hidden, the video player stays left-aligned, leaving a large empty gap on the right side of the screen.

**Root Cause:** `#primary.ytd-watch-flexy` has a fixed `max-width` and is not centered because `#columns` in the watch layout uses flex/grid with an assumed two-column layout.

**Implementation:** Update CSS in `src/content.css` to center the primary column and expand it to fill available space.

```css
/* Center and expand video player when sidebar is hidden */
html.shortsblock-active ytd-watch-flexy #columns {
  display: flex !important;
  justify-content: center !important;
}

html.shortsblock-active ytd-watch-flexy #primary.ytd-watch-flexy {
  max-width: 1280px !important;
  width: 100% !important;
  margin: 0 auto !important;
}

/* Ensure the video itself scales to fill the player */
html.shortsblock-active ytd-watch-flexy #movie_player,
html.shortsblock-active ytd-watch-flexy .html5-video-container {
  width: 100% !important;
}
```

**Test Scenarios:**
- Watch any video → player should be centered or fill the width
- Video should not appear left-aligned with dead space on right
- Works on different browser window widths (responsive)
- Playlist/chapters layout still intact

---

#### Fix 3: Independent Feature Toggles

**Problem:** Currently, "Block Shorts" and "Redirect Homepage" are always-on when the extension is enabled. There's no way to use one without the other.

**Implementation Plan:**

**3.1 Storage:** Add two new keys (already reflected in the Storage Structure section above):
- `blockShorts`: boolean (default: true)
- `redirectHomepage`: boolean (default: true)

**3.2 Background Script** (`src/background.ts`): Gate the homepage redirect behind the `redirectHomepage` flag:
```typescript
chrome.storage.sync.get({ extensionEnabled: true, redirectHomepage: true }, (result) => {
  if (result.extensionEnabled && result.redirectHomepage) {
    // perform redirect
  }
});
```

**3.3 Content Script** (`src/content.ts`): Gate Shorts CSS hiding behind the `blockShorts` flag by toggling a second class (e.g., `shortsblock-shorts-on`) on `<html>` independently from `shortsblock-active`:
```typescript
// Apply a separate class for Shorts-specific rules
function applyShortsCssClass(enabled: boolean) {
  document.documentElement.classList.toggle('shortsblock-shorts-on', enabled);
}
```

**3.4 CSS** (`src/content.css`): Scope Shorts-blocking rules under the new class:
```css
/* Was: html.shortsblock-active ytd-guide-entry-renderer[title="Shorts"] */
/* Now: */
html.shortsblock-shorts-on ytd-guide-entry-renderer[title="Shorts"] { ... }
```

**3.5 Popup UI** (`src/popup/popup.html` + `popup.ts`): Add two new toggle rows below the existing "Redact Comments" toggle:
```html
<div class="option">
  <div class="option-info">
    <h3>Block Shorts</h3>
    <p>Hide Shorts buttons and redirect Shorts URLs</p>
  </div>
  <label class="toggle">
    <input type="checkbox" id="blockShorts">
    <span class="slider"></span>
  </label>
</div>

<div class="option">
  <div class="option-info">
    <h3>Redirect Homepage</h3>
    <p>Auto-redirect YouTube homepage to Subscriptions</p>
  </div>
  <label class="toggle">
    <input type="checkbox" id="redirectHomepage">
    <span class="slider"></span>
  </label>
</div>
```

**Test Scenarios:**
- Enable extension, disable Block Shorts → Shorts button and shelves visible; Shorts URLs still accessible
- Enable extension, disable Redirect Homepage → visiting `youtube.com` stays on homepage
- Both toggles work independently from each other and from the master power button
- Settings persist across page refreshes and tab closes

---

### Phase 8: New Features ⏳ PENDING

---

#### New Feature 1: Grayscale Mode

**Goal:** Inject CSS to turn YouTube (especially thumbnails) into black and white, reducing the psychological "dopamine hit" of colorful, clickbaity thumbnails.

**Storage Key:** `grayscaleMode`: boolean (default: false)

**Implementation:**

**CSS** (`src/content.css`): Add a new scoped CSS class `shortsblock-grayscale`:
```css
/* Apply grayscale to the entire YouTube interface */
html.shortsblock-grayscale {
  filter: grayscale(100%) !important;
}

/* Preserve color on the video player itself (optional UX decision) */
html.shortsblock-grayscale #movie_player,
html.shortsblock-grayscale .html5-video-container video {
  filter: grayscale(0%) !important;
}
```

> **UX Note:** The CSS above applies grayscale to the whole page but restores color on the actual video player so that video content is still enjoyed in color — only the discovery/browse UI is desaturated. If the user wants full grayscale (including the video player), the second rule block can be removed.

**Content Script** (`src/content.ts`): Toggle the class based on storage:
```typescript
function applyGrayscaleClass(enabled: boolean) {
  document.documentElement.classList.toggle('shortsblock-grayscale', enabled);
}
```

**Popup UI** (`src/popup/popup.html` + `popup.ts`): Add a toggle:
```html
<div class="option">
  <div class="option-info">
    <h3>Grayscale Mode</h3>
    <p>Turn thumbnails black & white to reduce clickbait appeal</p>
  </div>
  <label class="toggle">
    <input type="checkbox" id="grayscaleMode">
    <span class="slider"></span>
  </label>
</div>
```

**Test Scenarios:**
- Enable Grayscale Mode → entire YouTube page (thumbnails, icons, UI) turns gray
- Video player should remain in color
- Toggle off → colors immediately restored
- Works across navigation (subscribe page, watch page, channel page)
- Performance: `filter: grayscale` is GPU-accelerated, should cause no lag

---

#### New Feature 2: Hide Metrics & Clickbait

**Goal:** Inject CSS to hide view counts, subscriber counts, and publish dates, preventing users from picking videos based on popularity or recency.

**Storage Key:** `hideMetrics`: boolean (default: false)

**Elements to Hide:**
- View counts on video cards (home feed, subscriptions feed)
- Subscriber count on channel pages and in feed
- Publish date / relative time ("2 days ago") on video cards and watch page
- Like/dislike counts on the watch page

**CSS** (`src/content.css`): Scoped under `html.shortsblock-hide-metrics`:
```css
/* Hide view counts on video cards */
html.shortsblock-hide-metrics ytd-video-meta-block #metadata-line span,
html.shortsblock-hide-metrics ytd-grid-video-renderer #metadata-line span,
html.shortsblock-hide-metrics ytd-rich-grid-media #metadata-line span {
  display: none !important;
}

/* Hide subscriber count on channel pages and in sidebar */
html.shortsblock-hide-metrics #subscriber-count,
html.shortsblock-hide-metrics yt-formatted-string#subscribers {
  display: none !important;
}

/* Hide publish date / relative time under video player */
html.shortsblock-hide-metrics ytd-video-primary-info-renderer #info-strings yt-formatted-string,
html.shortsblock-hide-metrics #info .ytd-video-primary-info-renderer {
  display: none !important;
}

/* Hide like count on watch page */
html.shortsblock-hide-metrics ytd-toggle-button-renderer .ytd-toggle-button-renderer yt-formatted-string {
  display: none !important;
}
```

**Content Script** (`src/content.ts`):
```typescript
function applyHideMetricsClass(enabled: boolean) {
  document.documentElement.classList.toggle('shortsblock-hide-metrics', enabled);
}
```

**Popup UI** (`src/popup/popup.html` + `popup.ts`): Add a toggle:
```html
<div class="option">
  <div class="option-info">
    <h3>Hide Metrics</h3>
    <p>Hide view counts, subscriber counts & publish dates</p>
  </div>
  <label class="toggle">
    <input type="checkbox" id="hideMetrics">
    <span class="slider"></span>
  </label>
</div>
```

**Test Scenarios:**
- Enable Hide Metrics → view counts on feed cards disappear
- Subscriber count on channel pages hidden
- Publish dates ("3 days ago") on feed cards and watch page hidden
- Like count on video player hidden
- Toggle off → all metrics immediately reappear
- Works across SPA navigation

---

### Phase 9: Testing & Refinement ⏳ PENDING

**Manual Testing Needed:**

**9.1 Functional Testing (Existing)**
- [ ] Homepage redirect works on initial load
- [ ] Shorts URLs are blocked/redirected
- [ ] Shorts UI elements are hidden across different YouTube pages
- [ ] Watch page sidebar is hidden
- [ ] Home button hidden and clicks redirected
- [ ] Comments are redacted on load and scroll
- [ ] Comment toggle in popup works instantly
- [ ] Power button on/off works correctly
- [ ] Icon changes between purple (on) and gray (off)
- [ ] Features work after YouTube SPA navigation
- [ ] Multiple tabs sync state in real-time

**9.2 Functional Testing (New / Refined)**
- [ ] Explore section is hidden from side nav
- [ ] Subscriptions and You sections remain visible
- [ ] Video player is centered (no dead space on right)
- [ ] Block Shorts toggle works independently (can disable without affecting redirect)
- [ ] Redirect Homepage toggle works independently
- [ ] Grayscale Mode turns thumbnails/UI gray; video player stays in color
- [ ] Hide Metrics hides view counts, subscriber counts, dates
- [ ] Hide Metrics shows like counts are hidden on watch page
- [ ] All new toggles persist across page refresh and tab close

**9.3 Performance Testing**
- [ ] Extension doesn't cause page load delays
- [ ] Comment redaction doesn't cause scroll lag
- [ ] Grayscale filter doesn't cause rendering lag
- [ ] Memory usage is reasonable (check DevTools)
- [ ] No console errors during normal operation

**9.4 Edge Cases**
- [ ] Rapid navigation between pages
- [ ] YouTube A/B test UI variations (selectors may shift)
- [ ] Incognito mode (storage.sync behavior)
- [ ] Multiple YouTube tabs open simultaneously
- [ ] Toggling individual features while on YouTube page

**9.5 Cross-Browser Testing**
- [ ] Chrome (primary)
- [ ] Brave
- [ ] Edge

**Known Issues:** None currently reported.

---

### Phase 10: Build & Packaging ⏳ PARTIALLY COMPLETE

**✅ Completed:**
- ✅ Vite configuration with @crxjs/vite-plugin
- ✅ Build scripts in package.json
- ✅ Successfully built extension (dist/ folder)
- ✅ Local testing (load unpacked)
- ✅ Icons (dynamically generated, no files needed)

**Actual Build Configuration** (`vite.config.ts`):
```typescript
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json' assert { type: 'json' };

export default defineConfig({
  plugins: [crx({ manifest })],
});
```

**Build Commands**:
```bash
npm run dev    # Development mode with hot reload
npm run build  # Production build to dist/
```

**⏳ Remaining for Chrome Web Store:**
- [ ] Write privacy policy (data usage disclosure)
- [ ] Create promotional screenshots
  - 1280x800 or 640x400 pixels
  - Show extension in action on YouTube
  - Highlight: Shorts blocking, focused watch, comment redaction
- [ ] Create promotional tile (440x280)
- [ ] Write store listing description
- [ ] Verify manifest.json metadata (name, description, version)
- [ ] Test built extension thoroughly
- [ ] Create ZIP of dist/ folder
- [ ] Submit to Chrome Web Store

**⏳ Optional Enhancements:**
- [ ] Add keyboard shortcut for toggle (optional)
- [ ] Add context menu option (optional)
- [ ] Add options to customize redaction text (optional)
- [ ] Add analytics/telemetry (if desired, with privacy disclosure)

---

## Critical Files Summary (As Implemented)

| File | Purpose | Status |
|------|---------|--------|
| `src/manifest.json` | Extension config, permissions, popup action | ✅ |
| `src/background.ts` | Dynamic icon generation, homepage redirect (gated on `redirectHomepage`), storage listener | ✅→🔧 |
| `src/content.ts` | Active class mgmt, Shorts/grayscale/metrics class toggling, Home click intercept, CommentRedactor | ✅→🔧 |
| `src/content.css` | All hiding rules; adds: Explore nav, video centering, grayscale, hide-metrics scopes | ✅→🔧 |
| `public/rules.json` | Network-level Shorts URL blocking | ✅ |
| `src/popup/popup.html` | Popup UI; adds toggles for Shorts, Redirect, Grayscale, Hide Metrics | ✅→🔧 |
| `src/popup/popup.ts` | State management; adds new toggle handling for 4 new keys | ✅→🔧 |
| `src/popup/popup.css` | Purple/gray visual states, toggle switch | ✅ |
| `vite.config.ts` | Build configuration with @crxjs/vite-plugin | ✅ |
| `dist/` | Built extension output (ready for loading) | ✅ |

**Legend:** ✅ = Done, 🔧 = Needs update for v1.1, ✨ = New

## Selector Maintenance Strategy

YouTube frequently updates their DOM structure. Mitigation approach:
1. Use multiple fallback selectors for each target element
2. Prefer attribute selectors over class names (e.g., `[is-shorts]` vs `.shorts-class`)
3. Add runtime detection: if primary selector fails, try fallbacks
4. Log warnings to console when selectors fail (dev mode only)
5. Plan for quarterly selector audits after release

## Verification Testing (Updated for Current Implementation)

**End-to-End Test Flow**:
1. **Installation**
   - Open `chrome://extensions` → enable Developer mode
   - Click "Load unpacked" → select `dist/` folder
   - Verify purple "S" icon appears in toolbar

2. **Power Button Test**
   - Click extension icon → popup opens
   - Verify purple header, green dot, "Active on YouTube"
   - Click power button → should turn gray, "Paused"
   - Click again → should turn purple, "Active on YouTube"
   - Verify toolbar icon changes between purple (on) and gray (off)

3. **Homepage Redirect Test**
   - With extension enabled, navigate to `youtube.com`
   - Should immediately redirect to `/feed/subscriptions`
   - Toggle extension off → navigate to `youtube.com`
   - Should stay on homepage (no redirect)

4. **Shorts Blocking Test**
   - Attempt to visit `youtube.com/shorts/xyz`
   - Should redirect to subscriptions
   - Check sidebar → Shorts button should be hidden
   - Scroll home feed → no Shorts shelves visible
   - Visit channel page → Shorts tab hidden

5. **Focused Watch Test**
   - Watch any video → sidebar should be hidden
   - Check sidebar → Home button should be hidden
   - Try clicking where Home button was → should redirect to subscriptions
   - End screen → no video recommendations
   - Playlists and chapters should work normally

6. **Comment Redaction Test**
   - Scroll to comments → all text should be "blah"
   - Scroll to load more → new comments also "blah"ed
   - Open popup → toggle "Redact Comments" off
   - Comments should show original text
   - Toggle back on → comments redacted again

7. **Multi-Tab Sync Test**
   - Open multiple YouTube tabs
   - Toggle extension in one tab
   - Verify all tabs update simultaneously

8. **Navigation Persistence Test**
   - Navigate between YouTube pages (home, watch, channel)
   - Verify all features persist across navigation
   - Test with rapid navigation

## 🎯 Next Steps (What's Remaining)

### Immediate Tasks (v1.1):
1. **Phase 7 — Bug Fixes & Refinements** (2-3 hours)
   - Fix 1: Add CSS to hide Explore section from side nav
   - Fix 2: Add CSS to center/expand video player on watch page
   - Fix 3: Decouple Shorts blocking and homepage redirect into separate storage keys + popup toggles
   - Update `background.ts` to gate redirect on `redirectHomepage` flag
   - Update `content.ts` to apply/remove separate CSS classes for each toggle

2. **Phase 8 — New Feature: Grayscale Mode** (1 hour)
   - Add `shortsblock-grayscale` CSS class and rules to `content.css`
   - Add class toggle logic to `content.ts`
   - Add popup toggle for `grayscaleMode`

3. **Phase 9 — New Feature: Hide Metrics** (1 hour)
   - Add `shortsblock-hide-metrics` CSS class and rules to `content.css`
   - Add class toggle logic to `content.ts`
   - Add popup toggle for `hideMetrics`

4. **Phase 10: Testing & Refinement** (2-3 hours)
   - Full regression test of existing + new features
   - Performance testing with DevTools
   - Cross-browser testing

5. **Phase 11: Store Preparation** (2-3 hours)
   - Write privacy policy document
   - Create promotional screenshots (1280x800)
   - Create promotional tile (440x280)
   - Write compelling store description
   - Create ZIP package
   - Submit to Chrome Web Store

### Optional Future Enhancements:
- Keyboard shortcut for quick toggle
- Context menu integration
- Customizable redaction text (user preference)
- Statistics dashboard (videos watched, time saved)
- Whitelist specific channels for comments
- Export/import settings

## Implementation Timeline

**Completed** (March 2026):
- ✅ Phases 1-6: All core MVP features implemented
- ✅ MVP built and functional
- ✅ Dynamic icon system
- ✅ Popup interface with on/off toggle
- ✅ Real-time sync across tabs

**v1.1 Remaining** (Est. 5-7 hours):
- ⏳ Phase 7: Bug fixes & feature refinements
- ⏳ Phase 8: Grayscale Mode
- ⏳ Phase 9: Hide Metrics & Clickbait
- ⏳ Phase 10: Comprehensive testing
- ⏳ Phase 11: Chrome Web Store submission

## Open Questions
None — all architectural decisions finalized. Nav cleanup scope confirmed as Explore section only.

---

## Phase 12: UI Redesign ⏳ PENDING

### Goal
Redesign the extension popup to match a clean, premium aesthetic — consistent with the custom hourglass/pause icon branding. The design should feel like a native macOS/iOS utility app: dark, spacious, and minimal without over-relying on gradients or AI-generated-looking effects.

---

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0F0A1E` | Popup body background |
| `--bg-card` | `#1C1333` | Individual toggle card backgrounds |
| `--bg-header` | `#1A0F30` | Header background (no gradient) |
| `--accent-purple` | `#8B5CF6` | Active toggle colour, accent dots |
| `--text-primary` | `#FFFFFF` | Toggle titles, header text |
| `--text-muted` | `#9B8EC4` | Toggle subtitles / one-liners |
| `--border-card` | `#2E2050` | Subtle card border |
| `--radius-card` | `12px` | Toggle card corner radius |
| `--radius-popup` | `16px` | Outer popup corner radius |

**Typography:** System font stack (`-apple-system, BlinkMacSystemFont, "Inter", sans-serif`). No web fonts to keep the extension lightweight.

**Spacing:** 20px horizontal padding, 12px vertical gap between cards, 16px internal card padding.

---

### Header

- **Left:** Bold white `"ShortsBlock"` wordmark — no emoji, no icon inline.
- **Right:** Circular button (44×44px, `--bg-card` background, `--border-card` border) containing the custom icon:
  - **Extension ON →** hourglass icon (purple/lavender gradient outline style, matching the app icon)
  - **Extension OFF →** pause icon (two rounded rectangles in muted lavender)
  - Clicking this button **toggles the entire extension ON or OFF** (same behaviour as the current power button).
- **Below title (inline):** Small status line — a coloured dot followed by plain text:
  - ON: white dot + `"Active"`
  - OFF: gray dot + `"Paused"`
  - No pill/badge wrapper — just clean inline text.

---

### Popup States

#### ON State
- Header and body use the standard dark theme (tokens above).
- All toggle cards are fully interactive.
- Icon button displays the hourglass.

#### OFF (Paused) State
- A semi-transparent gray wash (`rgba(0,0,0,0.45)`) is applied over the entire body below the header — same approach as the current `.disabled` class.
- All toggle cards become **non-interactive** (`pointer-events: none`, reduced opacity ~0.4).
- The header itself stays fully visible and interactive (so the user can always re-enable the extension).
- Icon button displays the pause icon.

---

### Toggle Rows

Each feature toggle is rendered as its own card (`--bg-card`, `--radius-card`, `--border-card`). Layout: left-aligned label + subtitle, toggle switch pinned to the right.

| # | Title | Subtitle (one-liner) | Storage Key | Default |
|---|-------|----------------------|-------------|---------|
| 1 | Block Shorts | *"The rabbit hole, sealed."* | `blockShorts` | `true` |
| 2 | Redirect Homepage | *"Straight to what matters."* | `redirectHomepage` | `true` |
| 3 | Grayscale Mode | *"Less clickbait, more substance."* | `grayscaleMode` | `false` |
| 4 | Hide Metrics | *"The count doesn't count."* | `hideMetrics` | `false` |
| 5 | Redact Comments | *"Blah blah blah."* | `redactComments` | `true` |

---

### Toggle Switch Component

Use the **shadcn Bouncy Toggle** from 21st.dev instead of a hand-rolled CSS toggle:

**Installation:**
```bash
npx shadcn@latest add https://21st.dev/r/jatin-yadav05/bouncy-toggle
```

**Source component** (`PremiumToggle` from `@/components/ui/bouncy-toggle`):

```tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface PremiumToggleProps {
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
}

export function PremiumToggle({ defaultChecked = false, onChange, label }: PremiumToggleProps) {
  const [isChecked, setIsChecked] = useState(defaultChecked)
  const [isPressed, setIsPressed] = useState(false)

  const handleToggle = () => {
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange?.(newValue)
  }

  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className={cn(
          "text-sm font-medium transition-colors duration-300",
          isChecked ? "text-foreground" : "text-muted-foreground",
        )}>
          {label}
        </span>
      )}
      <button
        role="switch"
        aria-checked={isChecked}
        onClick={handleToggle}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={cn(
          "group relative h-8 w-14 rounded-full p-1 transition-all duration-500 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isChecked ? "bg-foreground" : "bg-muted-foreground/20",
        )}
      >
        <div className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-500",
          isChecked ? "opacity-100 shadow-[0_0_20px_rgba(0,0,0,0.15)]" : "opacity-0",
        )} />
        <div className={cn(
          "absolute inset-[2px] rounded-full transition-all duration-500",
          isChecked ? "bg-gradient-to-b from-foreground to-foreground/90" : "bg-transparent",
        )} />
        <div className={cn(
          "relative h-6 w-6 rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
          "bg-background",
          isChecked ? "translate-x-6" : "translate-x-0",
          isPressed && "scale-90 duration-150",
        )}>
          <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-background via-background to-muted/30" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-background/80 via-transparent to-transparent" />
          <div className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500",
            isChecked
              ? "h-2 w-2 bg-foreground opacity-100 scale-100"
              : "h-1.5 w-1.5 bg-muted-foreground/40 opacity-100 scale-100",
          )} />
          <div
            className={cn(
              "absolute inset-0 rounded-full transition-all duration-700",
              isChecked ? "animate-ping bg-foreground/20 scale-150 opacity-0" : "scale-100 opacity-0",
            )}
            key={isChecked ? "on" : "off"}
          />
        </div>
      </button>
    </div>
  )
}
```

**Integration notes:**
- Wire `defaultChecked` from `chrome.storage.sync` on popup load.
- Wire `onChange` to call `chrome.storage.sync.set({ [key]: newValue })`.
- When the extension is paused, wrap each `PremiumToggle` in a container with `pointer-events: none; opacity: 0.4` — do not pass a disabled prop directly since the component does not expose one natively.
- The `bg-foreground` active colour should map to `--accent-purple` (`#8B5CF6`) via the shadcn CSS variable theme, or override with a custom Tailwind colour if needed.

---

### Files to Create / Modify (UI Redesign)

| File | Change |
|------|--------|
| `src/popup/popup.html` | Full restructure — header with icon button, status line, card-based toggle rows |
| `src/popup/popup.css` | Replace existing styles with new design token system; add `.disabled` overlay |
| `src/popup/popup.ts` | Update `updateUI()` to swap hourglass/pause icon; wire all 5 toggles |
| `src/background.ts` | Update `updateIcon()` to use the new PNG icon assets instead of the generated "S" |
| `public/icons/` | Replace existing icon PNGs with the new hourglass (ON) icon at 16, 32, 48, 128px |

> **Decision: Option A — Port to vanilla JS/CSS.**
> The popup stays as vanilla HTML/CSS/TS (no React, no Tailwind, no build changes). The `PremiumToggle` animation logic (bouncy cubic-bezier thumb, ripple ping, status dot) should be hand-translated into plain CSS transitions and a small JS class toggle. The component code above serves as the animation reference spec.
