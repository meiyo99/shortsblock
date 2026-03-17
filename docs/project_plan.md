# ShortsBlock: Comprehensive Implementation Plan

## Context
Building a Chrome extension to help users maintain focus on YouTube by eliminating distractions. The extension will filter content to show only subscriptions, block Shorts entirely, create a focused watch experience, and redact comments. This addresses the growing problem of algorithmic content discovery pulling users away from intentional content consumption.

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

### Component Breakdown
1. **Service Worker** (`background.js`):
   - Listen for `webNavigation.onCommitted` → redirect homepage to subscriptions
   - Define `declarativeNetRequest` rules for Shorts URL blocking

2. **Content Scripts** (`content.js`):
   - Inject CSS to hide UI elements (Shorts nav, recommended videos sidebar)
   - Initialize MutationObserver for comment text replacement
   - Listen for YouTube SPA navigation events (`yt-navigate-finish`)

3. **Options Page** (`options.html`):
   - Simple toggle switches for each of the 4 features
   - Save preferences to `chrome.storage.sync`

## Implementation Phases

### Phase 1: Project Setup & Infrastructure (Est: 1-2 hours)

**1.1 Initialize Project**
```bash
npm init -y
npm install -D typescript vite @crxjs/vite-plugin
npm install -D @types/chrome
```

**1.2 Create Project Structure**
```
shortsblock/
├── src/
│   ├── manifest.json
│   ├── background.ts
│   ├── content.ts
│   ├── content.css
│   ├── options/
│   │   ├── options.html
│   │   ├── options.ts
│   │   └── options.css
│   └── types/
│       └── storage.ts
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**1.3 Configure manifest.json**
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
  "options_page": "src/options/options.html",
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

**1.4 Define Storage Types**
```typescript
// src/types/storage.ts
export interface UserPreferences {
  redirectHomepage: boolean;
  blockShorts: boolean;
  focusedWatch: boolean;
  redactComments: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  redirectHomepage: true,
  blockShorts: true,
  focusedWatch: true,
  redactComments: true,
};
```

---

### Phase 2: Feature 1 - Homepage Redirect (Est: 30 min)

**Implementation**: Background service worker with `webNavigation.onCommitted`

**Critical File**: `src/background.ts`

```typescript
chrome.webNavigation.onCommitted.addListener(
  (details) => {
    chrome.storage.sync.get(['redirectHomepage'], (result) => {
      if (result.redirectHomepage !== false) {
        const url = new URL(details.url);
        // Only redirect if on exact homepage (not /feed, /watch, etc.)
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

**Test Scenarios**:
- Navigate to `youtube.com` → should redirect to `/feed/subscriptions`
- Navigate to `youtube.com/watch?v=xyz` → should NOT redirect
- Disable feature in options → should NOT redirect

---

### Phase 3: Feature 2 - Block YouTube Shorts (Est: 1 hour)

**Implementation**: Network-level blocking via `declarativeNetRequest` + UI hiding via CSS

**Critical Files**:
- `public/rules.json`
- `src/content.css`
- `src/background.ts`

**3.1 Network Blocking** (`public/rules.json`)
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

**3.2 UI Element Hiding** (`src/content.css`)
```css
/* Hide Shorts navigation button in sidebar */
ytd-guide-entry-renderer[title="Shorts"],
ytd-guide-entry-renderer a[title="Shorts"],
ytd-mini-guide-entry-renderer[aria-label="Shorts"] {
  display: none !important;
}

/* Hide Shorts shelves in feeds (multiple selectors for robustness) */
ytd-rich-shelf-renderer[is-shorts],
ytd-reel-shelf-renderer,
[is-shorts] {
  display: none !important;
}

/* Hide Shorts tab on channel pages */
yt-tab-shape[tab-title="Shorts"],
tp-yt-paper-tab:has(a[href*="/shorts"]) {
  display: none !important;
}

/* Mobile bottom navigation Shorts button */
ytm-pivot-bar-item-renderer[pivot-identifier="SHORTS"] {
  display: none !important;
}
```

**Test Scenarios**:
- Click Shorts URL → should redirect to subscriptions
- Check sidebar → Shorts button should be hidden
- Scroll home feed → Shorts shelf should not appear
- Visit channel page → Shorts tab should be hidden

---

### Phase 4: Feature 3 - Focused Watch Page (Est: 30 min)

**Implementation**: CSS injection to hide recommended videos sidebar

**Critical File**: `src/content.css`

```css
/* Hide related videos sidebar on watch page */
/* Primary selector */
#secondary.ytd-watch-flexy {
  display: none !important;
}

/* Fallback selectors for robustness */
ytd-watch-next-secondary-results-renderer,
#related {
  display: none !important;
}

/* Expand primary content to full width */
#primary.ytd-watch-flexy {
  max-width: 100% !important;
}

/* Hide end-screen video recommendations */
.ytp-ce-element,
.ytp-cards-teaser {
  display: none !important;
}
```

**Enhancement**: Add dynamic check in content script to re-apply on navigation

```typescript
// In src/content.ts
function applyFocusedWatchMode() {
  chrome.storage.sync.get(['focusedWatch'], (result) => {
    if (result.focusedWatch !== false) {
      const secondary = document.querySelector('#secondary');
      if (secondary) {
        (secondary as HTMLElement).style.display = 'none';
      }
    }
  });
}

// Re-apply on YouTube SPA navigation
document.addEventListener('yt-navigate-finish', applyFocusedWatchMode);
```

**Test Scenarios**:
- Watch any video → sidebar should be hidden
- Navigate to another video → sidebar should remain hidden
- Check video end screen → recommendations should be hidden

---

### Phase 5: Feature 4 - Comment Redaction (Est: 2 hours)

**Implementation**: MutationObserver to detect and replace comment text

**Critical File**: `src/content.ts`

```typescript
class CommentRedactor {
  private observer: MutationObserver | null = null;
  private enabled: boolean = true;
  private processedComments = new WeakSet<Element>();

  init() {
    chrome.storage.sync.get(['redactComments'], (result) => {
      this.enabled = result.redactComments !== false;
      if (this.enabled) {
        this.startObserving();
      }
    });
  }

  private startObserving() {
    this.observer = new MutationObserver((mutations) => {
      this.processComments();
    });

    // Observe comments section
    const observe = () => {
      const commentsSection = document.querySelector('ytd-comments#comments');
      if (commentsSection) {
        this.observer!.observe(commentsSection, {
          childList: true,
          subtree: true
        });
        this.processComments(); // Process existing comments
      }
    };

    // Initial attempt
    observe();

    // Retry on navigation
    document.addEventListener('yt-navigate-finish', () => {
      setTimeout(observe, 500);
    });
  }

  private processComments() {
    const commentElements = document.querySelectorAll(
      'yt-attributed-string#content-text span.yt-core-attributed-string--link-inherit-color'
    );

    commentElements.forEach((element) => {
      if (!this.processedComments.has(element)) {
        this.redactComment(element);
        this.processedComments.add(element);
      }
    });
  }

  private redactComment(element: Element) {
    const textContent = element.textContent || '';
    // Split by whitespace, replace each word with "blah"
    const redacted = textContent
      .split(/(\s+)/)
      .map(part => part.trim() ? 'blah' : part)
      .join('');

    element.textContent = redacted;
  }

  destroy() {
    this.observer?.disconnect();
  }
}

// Initialize
const redactor = new CommentRedactor();
redactor.init();
```

**Performance Optimizations**:
- Use `WeakSet` to track processed comments (avoid re-processing)
- Debounce mutation callback if needed (test first)
- Limit observer scope to comments section only

**Test Scenarios**:
- Load video with comments → comments should be "blah"ed
- Scroll to load more comments → new comments should be "blah"ed
- Navigate to different video → comments should be "blah"ed
- Monitor performance → no frame drops during scroll

---

### Phase 6: Options Page (Est: 1 hour)

**Implementation**: Simple toggle UI with sync storage

**Critical Files**:
- `src/options/options.html`
- `src/options/options.ts`
- `src/options/options.css`

**6.1 HTML Structure**
```html
<!DOCTYPE html>
<html>
<head>
  <title>ShortsBlock Options</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="container">
    <h1>ShortsBlock Settings</h1>

    <div class="option">
      <label>
        <input type="checkbox" id="redirectHomepage">
        Redirect homepage to subscriptions
      </label>
      <p class="description">Automatically show your subscriptions when opening YouTube</p>
    </div>

    <div class="option">
      <label>
        <input type="checkbox" id="blockShorts">
        Block YouTube Shorts
      </label>
      <p class="description">Hide Shorts buttons and redirect Shorts URLs</p>
    </div>

    <div class="option">
      <label>
        <input type="checkbox" id="focusedWatch">
        Focused watch mode
      </label>
      <p class="description">Hide recommended videos sidebar while watching</p>
    </div>

    <div class="option">
      <label>
        <input type="checkbox" id="redactComments">
        Redact comments
      </label>
      <p class="description">Replace all comment text with "blah"</p>
    </div>

    <div class="save-status" id="saveStatus"></div>
  </div>

  <script src="options.ts" type="module"></script>
</body>
</html>
```

**6.2 Options Logic** (`src/options/options.ts`)
```typescript
import { UserPreferences, DEFAULT_PREFERENCES } from '../types/storage';

// Load saved preferences
chrome.storage.sync.get(DEFAULT_PREFERENCES, (result) => {
  (document.getElementById('redirectHomepage') as HTMLInputElement).checked = result.redirectHomepage;
  (document.getElementById('blockShorts') as HTMLInputElement).checked = result.blockShorts;
  (document.getElementById('focusedWatch') as HTMLInputElement).checked = result.focusedWatch;
  (document.getElementById('redactComments') as HTMLInputElement).checked = result.redactComments;
});

// Save on change
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const preferences: Partial<UserPreferences> = {
      [target.id]: target.checked
    };

    chrome.storage.sync.set(preferences, () => {
      showSaveStatus('Settings saved!');
    });
  });
});

function showSaveStatus(message: string) {
  const status = document.getElementById('saveStatus')!;
  status.textContent = message;
  status.style.opacity = '1';
  setTimeout(() => {
    status.style.opacity = '0';
  }, 2000);
}
```

**Test Scenarios**:
- Toggle each option → should save immediately
- Reload options page → settings should persist
- Change setting → content script should respect new preference

---

### Phase 7: Testing & Refinement (Est: 2 hours)

**7.1 Functional Testing**
- [ ] Homepage redirect works on initial load
- [ ] Shorts URLs are blocked/redirected
- [ ] Shorts UI elements are hidden
- [ ] Watch page sidebar is hidden
- [ ] Comments are redacted on load and scroll
- [ ] All features respect options page toggles
- [ ] Features work after YouTube SPA navigation

**7.2 Performance Testing**
- [ ] Extension doesn't cause page load delays
- [ ] Comment redaction doesn't cause scroll lag
- [ ] Memory usage is reasonable (check DevTools)

**7.3 Edge Cases**
- [ ] Rapid navigation between pages
- [ ] YouTube A/B test UI variations
- [ ] Incognito mode (storage.sync may differ)
- [ ] Multiple YouTube tabs open simultaneously

**7.4 Cross-Browser Testing**
- [ ] Chrome (primary)
- [ ] Brave
- [ ] Edge

---

### Phase 8: Build & Packaging (Est: 1 hour)

**8.1 Build Configuration** (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [crx({ manifest })],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
```

**8.2 Build Commands** (`package.json`)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**8.3 Pre-Publishing Checklist**
- [ ] Generate icons (16x16, 32x32, 48x48, 128x128)
- [ ] Test built extension (load unpacked from `dist/`)
- [ ] Write privacy policy (no data collection statement)
- [ ] Create promotional screenshots (1280x800, 640x400)
- [ ] Verify manifest version is correct
- [ ] Create ZIP for Chrome Web Store upload

---

## Critical Files Summary

| File | Purpose |
|------|---------|
| `src/manifest.json` | Extension configuration and permissions |
| `src/background.ts` | Homepage redirect & declarativeNetRequest rules |
| `src/content.ts` | Comment redaction & dynamic feature application |
| `src/content.css` | Hide Shorts UI & recommended videos |
| `public/rules.json` | Network-level Shorts URL blocking rules |
| `src/options/options.html` | User settings interface |
| `src/options/options.ts` | Settings persistence logic |
| `src/types/storage.ts` | TypeScript types for user preferences |

## Selector Maintenance Strategy

YouTube frequently updates their DOM structure. Mitigation approach:
1. Use multiple fallback selectors for each target element
2. Prefer attribute selectors over class names (e.g., `[is-shorts]` vs `.shorts-class`)
3. Add runtime detection: if primary selector fails, try fallbacks
4. Log warnings to console when selectors fail (dev mode only)
5. Plan for quarterly selector audits after release

## Verification Testing

**End-to-End Test Flow**:
1. Install extension in Chrome
2. Open `chrome://extensions` → enable Developer mode → Load unpacked
3. Navigate to `youtube.com` → verify redirect to subscriptions
4. Attempt to visit `youtube.com/shorts/xyz` → verify redirect
5. Check sidebar → verify Shorts button is hidden
6. Watch any video → verify sidebar is hidden, comments are "blah"ed
7. Open options page → toggle features off one by one → verify each stops working
8. Navigate between multiple YouTube pages → verify features persist

## Next Steps After Approval

1. **Phase 1**: Set up project structure (15 min)
2. **Phase 2-5**: Implement features in order (4-5 hours)
3. **Phase 6**: Build options page (1 hour)
4. **Phase 7**: Test thoroughly (2 hours)
5. **Phase 8**: Build and package (1 hour)

**Total Estimated Time**: 8-10 hours for complete MVP

## Open Questions
None - all architectural decisions have been clarified based on audit feedback.
