document.addEventListener('DOMContentLoaded', () => {
  const powerBtn = document.getElementById('powerBtn')!;
  const popup = document.getElementById('popup')!;
  const statusDot = document.getElementById('statusDot')!;
  const statusText = document.getElementById('statusText')!;
  const redactCheckbox = document.getElementById('redactComments') as HTMLInputElement;

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

  // Load saved preferences
  chrome.storage.sync.get({ extensionEnabled: true, redactComments: true }, (result) => {
    const enabled = result.extensionEnabled !== false;
    updateUI(enabled);
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

  // Redact comments toggle
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
