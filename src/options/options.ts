import { DEFAULT_PREFERENCES } from '../types/storage';

// Load saved preferences when page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(DEFAULT_PREFERENCES as any, (result) => {
    (document.getElementById('redirectHomepage') as HTMLInputElement).checked = result.redirectHomepage !== false;
    (document.getElementById('blockShorts') as HTMLInputElement).checked = result.blockShorts !== false;
    (document.getElementById('focusedWatch') as HTMLInputElement).checked = result.focusedWatch !== false;
    (document.getElementById('redactComments') as HTMLInputElement).checked = result.redactComments !== false;
  });

  // Add change listeners to all checkboxes
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleChange);
  });
});

function handleChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  const preferences: any = {
    [target.id]: target.checked
  };

  chrome.storage.sync.set(preferences, () => {
    showSaveStatus('Saved!');
  });
}

function showSaveStatus(message: string): void {
  const status = document.getElementById('saveStatus');
  if (!status) return;

  status.textContent = message;
  status.classList.add('visible');

  setTimeout(() => {
    status.classList.remove('visible');
  }, 2000);
}
