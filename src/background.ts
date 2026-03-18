// Background service worker

// Generate a colored circle icon for the extension badge
function generateIcon(color: string, size: number): ImageData {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;

  // Background circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // "S" letter in white
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.55}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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

// Set initial icon state on startup
chrome.storage.sync.get({ extensionEnabled: true }, (result) => {
  updateIcon(result.extensionEnabled !== false);
});

// Listen for storage changes to update icon
chrome.storage.onChanged.addListener((changes) => {
  if (changes.extensionEnabled) {
    updateIcon(changes.extensionEnabled.newValue !== false);
  }
});

// Homepage Redirect Feature
chrome.webNavigation.onCommitted.addListener(
  (details) => {
    chrome.storage.sync.get({ extensionEnabled: true, redirectHomepage: true }, (result) => {
      // Only redirect if extension is enabled AND redirect homepage is on
      if (result.extensionEnabled === false || result.redirectHomepage === false) return;

      try {
        const url = new URL(details.url);
        if (url.pathname === '/' || url.pathname === '') {
          chrome.tabs.update(details.tabId, {
            url: 'https://www.youtube.com/feed/subscriptions'
          });
        }
      } catch (error) {
        // Ignore URL parse errors
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
