import { DEFAULT_PREFERENCES } from '../types/storage';
// Load saved preferences when page opens
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(DEFAULT_PREFERENCES, (result) => {
        document.getElementById('redirectHomepage').checked = result.redirectHomepage !== false;
        document.getElementById('blockShorts').checked = result.blockShorts !== false;
        document.getElementById('focusedWatch').checked = result.focusedWatch !== false;
        document.getElementById('redactComments').checked = result.redactComments !== false;
    });
    // Add change listeners to all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleChange);
    });
});
function handleChange(e) {
    const target = e.target;
    const preferences = {
        [target.id]: target.checked
    };
    chrome.storage.sync.set(preferences, () => {
        showSaveStatus('Saved!');
    });
}
function showSaveStatus(message) {
    const status = document.getElementById('saveStatus');
    if (!status)
        return;
    status.textContent = message;
    status.classList.add('visible');
    setTimeout(() => {
        status.classList.remove('visible');
    }, 2000);
}
