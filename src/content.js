"use strict";
// Content script
// Apply or remove CSS classes based on all feature flags
function applyAllClasses() {
    chrome.storage.sync.get({
        extensionEnabled: true,
        blockShorts: true,
        redirectHomepage: true,
        grayscaleMode: false,
        hideMetrics: false,
    }, (result) => {
        const enabled = result.extensionEnabled !== false;
        // Master class (controls focused watch, explore hiding)
        document.documentElement.classList.toggle('shortsblock-active', enabled);
        // Shorts blocking (independent toggle)
        document.documentElement.classList.toggle('shortsblock-shorts-on', enabled && result.blockShorts !== false);
        // Homepage redirect (independent toggle)
        document.documentElement.classList.toggle('shortsblock-redirect-on', enabled && result.redirectHomepage !== false);
        // Grayscale mode (independent toggle)
        document.documentElement.classList.toggle('shortsblock-grayscale', enabled && result.grayscaleMode === true);
        // Hide metrics (independent toggle)
        document.documentElement.classList.toggle('shortsblock-hide-metrics', enabled && result.hideMetrics === true);
    });
}
// Apply immediately
applyAllClasses();
// Listen for storage changes (user toggled on/off from popup)
chrome.storage.onChanged.addListener((changes) => {
    if (changes.extensionEnabled || changes.blockShorts || changes.redirectHomepage || changes.grayscaleMode || changes.hideMetrics) {
        applyAllClasses();
    }
});
// Redirect Home button clicks to subscriptions
function interceptHomeClicks() {
    document.addEventListener('click', (e) => {
        // Only intercept if redirect homepage is active
        if (!document.documentElement.classList.contains('shortsblock-redirect-on'))
            return;
        const target = e.target;
        const anchor = target.closest('a[href="/"]');
        if (anchor) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'https://www.youtube.com/feed/subscriptions';
        }
    }, true);
}
interceptHomeClicks();
// Hide the Explore section by finding it via its title text
function hideExploreSection() {
    const sectionTitles = document.querySelectorAll('yt-formatted-string#guide-section-title');
    sectionTitles.forEach((title) => {
        if (title.textContent?.trim() === 'Explore') {
            const section = title.closest('ytd-guide-section-renderer');
            if (section && !section.classList.contains('shortsblock-explore-section')) {
                section.classList.add('shortsblock-explore-section');
            }
        }
    });
}
// Run on load and observe for sidebar DOM changes
function observeSidebar() {
    hideExploreSection();
    const guide = document.querySelector('ytd-guide-renderer');
    if (guide) {
        const observer = new MutationObserver(() => {
            hideExploreSection();
        });
        observer.observe(guide, { childList: true, subtree: true });
    }
}
// Try immediately, retry if sidebar not loaded yet
observeSidebar();
let sidebarAttempts = 0;
const sidebarRetry = setInterval(() => {
    sidebarAttempts++;
    observeSidebar();
    if (document.querySelector('.shortsblock-explore-section') || sidebarAttempts > 10) {
        clearInterval(sidebarRetry);
    }
}, 500);
// Re-apply on YouTube SPA navigation
document.addEventListener('yt-navigate-finish', () => {
    applyAllClasses();
    hideExploreSection();
});
// Comment Redaction
class CommentRedactor {
    constructor() {
        this.observer = null;
        this.processedNodes = new WeakSet();
    }
    init() {
        chrome.storage.sync.get({ extensionEnabled: true, redactComments: true }, (result) => {
            if (result.extensionEnabled !== false && result.redactComments !== false) {
                this.startObserving();
            }
        });
        // Listen for changes to re-init
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
    startObserving() {
        this.observer = new MutationObserver(() => {
            this.processComments();
        });
        const tryObserve = () => {
            const commentsSection = document.querySelector('ytd-comments#comments');
            if (commentsSection) {
                this.observer.observe(commentsSection, {
                    childList: true,
                    subtree: true
                });
                this.processComments();
            }
        };
        tryObserve();
        let attempts = 0;
        const retryInterval = setInterval(() => {
            attempts++;
            const commentsSection = document.querySelector('ytd-comments#comments');
            if (commentsSection || attempts > 20) {
                clearInterval(retryInterval);
                if (commentsSection)
                    tryObserve();
            }
        }, 500);
        document.addEventListener('yt-navigate-finish', () => {
            setTimeout(tryObserve, 1000);
        });
    }
    processComments() {
        const selectors = [
            '#content-text',
            'yt-attributed-string#content-text',
            '#content-text span',
            '.ytd-comment-renderer #content-text'
        ];
        let commentTexts = null;
        for (const selector of selectors) {
            commentTexts = document.querySelectorAll(selector);
            if (commentTexts.length > 0)
                break;
        }
        if (!commentTexts || commentTexts.length === 0)
            return;
        commentTexts.forEach((element) => {
            this.redactTextNodes(element);
        });
    }
    redactTextNodes(element) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
            if (this.processedNodes.has(node))
                continue;
            if (!node.textContent || !node.textContent.trim())
                continue;
            node.textContent = node.textContent
                .split(/(\s+)/)
                .map(part => part.trim() ? 'blah' : part)
                .join('');
            this.processedNodes.add(node);
        }
    }
    destroy() {
        this.observer?.disconnect();
        this.observer = null;
    }
}
const redactor = new CommentRedactor();
redactor.init();
