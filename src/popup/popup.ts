document.addEventListener('DOMContentLoaded', () => {
  const powerBtn = document.getElementById('powerBtn')!;
  const powerIcon = document.getElementById('powerIcon') as HTMLImageElement;
  const popup = document.getElementById('popup')!;
  const statusDot = document.getElementById('statusDot')!;
  const statusText = document.getElementById('statusText')!;
  const blockShortsCheckbox = document.getElementById('blockShorts') as HTMLInputElement;
  const redirectHomepageCheckbox = document.getElementById('redirectHomepage') as HTMLInputElement;
  const grayscaleModeCheckbox = document.getElementById('grayscaleMode') as HTMLInputElement;
  const hideMetricsCheckbox = document.getElementById('hideMetrics') as HTMLInputElement;
  const redactCheckbox = document.getElementById('redactComments') as HTMLInputElement;

  const featureToggles = [blockShortsCheckbox, redirectHomepageCheckbox, grayscaleModeCheckbox, hideMetricsCheckbox, redactCheckbox];

  function updateUI(enabled: boolean): void {
    if (enabled) {
      popup.classList.remove('disabled');
      statusDot.classList.remove('off');
      statusText.textContent = 'Active';
      powerIcon.src = chrome.runtime.getURL('icons/icon-on.png');
      featureToggles.forEach(t => t.disabled = false);
    } else {
      popup.classList.add('disabled');
      statusDot.classList.add('off');
      statusText.textContent = 'Paused';
      powerIcon.src = chrome.runtime.getURL('icons/icon-off.png');
      featureToggles.forEach(t => t.disabled = true);
    }
  }

  // Load saved preferences
  chrome.storage.sync.get({
    extensionEnabled: true,
    blockShorts: true,
    redirectHomepage: true,
    grayscaleMode: false,
    hideMetrics: false,
    redactComments: true
  }, (result) => {
    const enabled = result.extensionEnabled !== false;
    updateUI(enabled);
    blockShortsCheckbox.checked = result.blockShorts !== false;
    redirectHomepageCheckbox.checked = result.redirectHomepage !== false;
    grayscaleModeCheckbox.checked = result.grayscaleMode === true;
    hideMetricsCheckbox.checked = result.hideMetrics === true;
    redactCheckbox.checked = result.redactComments !== false;
  });

  // Power button toggle
  powerBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ extensionEnabled: true }, (result) => {
      const newState = result.extensionEnabled === false;
      chrome.storage.sync.set({ extensionEnabled: newState }, () => {
        updateUI(newState);
        showStatus(newState ? 'Enabled!' : 'Paused');
      });
    });
  });

  // Feature toggles
  blockShortsCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ blockShorts: blockShortsCheckbox.checked }, () => {
      showStatus('Saved!');
    });
  });

  redirectHomepageCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ redirectHomepage: redirectHomepageCheckbox.checked }, () => {
      showStatus('Saved!');
    });
  });

  grayscaleModeCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ grayscaleMode: grayscaleModeCheckbox.checked }, () => {
      showStatus('Saved!');
    });
  });

  hideMetricsCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ hideMetrics: hideMetricsCheckbox.checked }, () => {
      showStatus('Saved!');
    });
  });

  redactCheckbox.addEventListener('change', () => {
    chrome.storage.sync.set({ redactComments: redactCheckbox.checked }, () => {
      showStatus('Saved!');
    });
  });

  function showStatus(message: string): void {
    const status = document.getElementById('saveStatus')!;
    status.textContent = message;
    status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 1500);
  }
});
