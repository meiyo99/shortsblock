"use strict";
// Background service worker
function updateIcon(enabled) {
    const iconPath = enabled ? 'icons/icon-on.png' : 'icons/icon-off.png';
    chrome.action.setIcon({
        path: {
            "16": iconPath,
            "32": iconPath,
            "48": iconPath,
            "128": iconPath
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
chrome.webNavigation.onCommitted.addListener((details) => {
    chrome.storage.sync.get({ extensionEnabled: true, redirectHomepage: true }, (result) => {
        // Only redirect if extension is enabled AND redirect homepage is on
        if (result.extensionEnabled === false || result.redirectHomepage === false)
            return;
        try {
            const url = new URL(details.url);
            if (url.pathname === '/' || url.pathname === '') {
                chrome.tabs.update(details.tabId, {
                    url: 'https://www.youtube.com/feed/subscriptions'
                });
            }
        }
        catch (error) {
            // Ignore URL parse errors
        }
    });
}, {
    url: [
        { hostEquals: 'www.youtube.com' },
        { hostEquals: 'youtube.com' }
    ]
});
