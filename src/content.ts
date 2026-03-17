// Content script
// This will handle focused watch mode and comment redaction

console.log('ShortsBlock content script loaded');

// Phase 4: Redirect Home button clicks to subscriptions
// Intercept clicks on the Home button in sidebar navigation

function interceptHomeClicks(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[href="/"]');

    if (anchor) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'https://www.youtube.com/feed/subscriptions';
    }
  }, true);
}

interceptHomeClicks();

// Re-apply on YouTube SPA navigation
document.addEventListener('yt-navigate-finish', () => {
  console.log('ShortsBlock: YouTube navigation detected');
});

// Comment redaction will be implemented in Phase 5
