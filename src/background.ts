// Background service worker
// This will handle homepage redirects and declarativeNetRequest rules

console.log('ShortsBlock background service worker loaded');

// Phase 2: Homepage Redirect Feature
// Redirect YouTube homepage to subscriptions feed

chrome.webNavigation.onCommitted.addListener(
  (details) => {
    // Check if the redirect feature is enabled in user preferences
    chrome.storage.sync.get(['redirectHomepage'], (result) => {
      // Default to true if preference not set
      if (result.redirectHomepage !== false) {
        try {
          const url = new URL(details.url);

          // Only redirect if on exact homepage (not /feed, /watch, etc.)
          if (url.pathname === '/' || url.pathname === '') {
            console.log('ShortsBlock: Redirecting homepage to subscriptions');

            chrome.tabs.update(details.tabId, {
              url: 'https://www.youtube.com/feed/subscriptions'
            });
          }
        } catch (error) {
          console.error('ShortsBlock: Error parsing URL', error);
        }
      }
    });
  },
  {
    url: [
      { hostEquals: 'www.youtube.com' },
      { hostEquals: 'youtube.com' }
    ]
  }
);

console.log('ShortsBlock: Homepage redirect listener registered');
