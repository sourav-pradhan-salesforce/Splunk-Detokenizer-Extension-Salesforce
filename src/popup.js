// Popup script for extension action
document.addEventListener('DOMContentLoaded', () => {
  const openPanelBtn = document.getElementById('open-panel');
  const themeToggle = document.getElementById('theme-toggle');
  const autoToggle = document.getElementById('auto-toggle');
  const body = document.body;

  // Load saved theme preference
  chrome.storage.local.get(['theme', 'autoDetokenize'], (result) => {
    const theme = result.theme || 'dark';
    body.className = `${theme}-mode`;
    updateThemeIcon(theme);
    if (autoToggle) autoToggle.checked = !!result.autoDetokenize;
  });

  // Auto-detokenize toggle
  if (autoToggle) {
    autoToggle.addEventListener('change', () => {
      const enabled = autoToggle.checked;
      chrome.storage.local.set({ autoDetokenize: enabled });
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url && activeTab.url.includes('splunk-web.log-analytics.monitoring')) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'setAutoDetokenize', enabled }).catch(() => {});
        }
      });
    });
  }

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.className = `${newTheme}-mode`;
    updateThemeIcon(newTheme);

    // Save theme preference
    chrome.storage.local.set({ theme: newTheme });
  });

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  openPanelBtn.addEventListener('click', () => {
    // Get active tab and send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (activeTab && activeTab.url.includes('splunk-web.log-analytics.monitoring')) {
        chrome.tabs.sendMessage(activeTab.id, { action: 'openPanel' }).catch(() => {});
        window.close();
      } else {
        alert('Please navigate to the Splunk page first.');
      }
    });
  });
});
