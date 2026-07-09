// Background service worker for Chrome extension - SIMPLIFIED VERSION
console.log('Splunk Detokenizer Background Script loaded (SIMPLE VERSION)');

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'detokenize') {
    console.log('Processing detokenize request for token:', request.token?.substring(0, 10) + '...');

    // Instead of automating, just open the page with the token pre-filled in URL
    const token = request.token;
    const url = `https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp`;

    // Open in a new tab
    chrome.tabs.create({ url: url, active: true }, (tab) => {
      console.log('Opened BlackTab page in tab:', tab.id);

      // For now, just tell user to manually complete
      setTimeout(() => {
        sendResponse({
          success: false,
          error: 'Please manually: 1) Select "Detokenize", 2) Paste token: ' + token.substring(0, 20) + '..., 3) Click "Perform Operation"'
        });
      }, 1000);
    });

    return true; // Keep channel open
  }

  return false;
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {
    action: 'openPanel'
  });
});

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'detokenize-selection',
    title: 'Detokenize with BlackTab',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'detokenize-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'openPanel',
      token: info.selectionText
    });
  }
});
