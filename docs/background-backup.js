// Background service worker for Chrome extension
console.log('Splunk Detokenizer Background Script loaded');

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request.action === 'detokenize') {
    console.log('Processing detokenize request for token:', request.token?.substring(0, 10) + '...');

    detokenizeValue(request.token)
      .then(result => {
        console.log('Detokenization complete, sending response:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Detokenization error in listener:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async response
  }

  // For any other message
  console.log('Unknown action:', request.action);
  return false;
});

// Detokenize value using BlackTab Detokenizer
async function detokenizeValue(token) {
  try {
    console.log('Detokenizing token:', token);

    // BlackTab Detokenizer URL - Updated to correct GDPR tokenizer page
    const detokenizerUrl = 'https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp';

    // Strategy 1: Try to use iframe communication
    // We'll need to open the detokenizer in a new way

    // For now, we'll use a simpler approach: open in iframe and scrape
    // Note: This may require additional permissions and CORS handling

    const result = await fetchDetokenizedValue(token, detokenizerUrl);

    return {
      success: true,
      detokenizedValue: result
    };

  } catch (error) {
    console.error('Detokenization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Fetch detokenized value from BlackTab
async function fetchDetokenizedValue(token, url) {
  // Method 1: Try direct API call (if available)
  // Method 2: Use offscreen document with iframe
  // Method 3: Instruct user to manually detokenize

  // Since BlackTab is a Salesforce tool, we'll need to handle authentication
  // and potentially use an offscreen document or new tab approach

  try {
    // Check if user is authenticated to Salesforce
    const cookies = await chrome.cookies.getAll({
      domain: '.salesforce.com'
    });

    if (cookies.length === 0) {
      throw new Error('Not authenticated to Salesforce. Please login to bt1.my.salesforce.com first.');
    }

    // Approach: Open detokenizer in a hidden iframe/tab and extract result
    // This requires creating an offscreen document (Manifest V3)

    // For MVP, we'll use a simpler approach with user interaction
    const detokenizedValue = await openDetokenizerTab(token, url);

    return detokenizedValue;

  } catch (error) {
    throw new Error(`Failed to fetch detokenized value: ${error.message}`);
  }
}

// Open detokenizer in a managed tab
async function openDetokenizerTab(token, baseUrl) {
  return new Promise((resolve, reject) => {
    console.log('Opening BlackTab tab with token:', token.substring(0, 10) + '...');

    // Create a new tab with the detokenizer (visible for debugging)
    chrome.tabs.create({
      url: baseUrl,
      active: true  // Changed to true so you can see what's happening
    }, async (tab) => {
      console.log('Tab created:', tab.id);

      try {
        // Wait for tab to load
        console.log('Waiting for tab to load...');
        await waitForTabLoad(tab.id);
        console.log('Tab loaded, injecting script...');

        // First, let's inspect the page structure
        const inspectionResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: inspectPageStructure
        });

        console.log('Page structure:', inspectionResults[0].result);

        // Inject script to interact with the detokenizer page
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: interactWithDetokenizer,
          args: [token]
        });

        console.log('Script execution results:', results);

        // Don't close tab immediately - keep it open for 5 seconds so you can see
        setTimeout(() => {
          chrome.tabs.remove(tab.id);
        }, 5000);

        if (results && results[0] && results[0].result) {
          if (results[0].result.success) {
            resolve(results[0].result.value);
          } else {
            reject(new Error(results[0].result.error || 'Failed to extract detokenized value'));
          }
        } else {
          reject(new Error('No result returned from injected script'));
        }

      } catch (error) {
        console.error('Error in openDetokenizerTab:', error);
        setTimeout(() => {
          chrome.tabs.remove(tab.id);
        }, 5000);
        reject(error);
      }
    });
  });
}

// Wait for tab to load
function waitForTabLoad(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Tab load timeout'));
    }, 30000);

    chrome.tabs.onUpdated.addListener(function listener(id, changeInfo) {
      if (id === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        // Wait additional time for page to fully initialize
        setTimeout(() => resolve(), 2000);
      }
    });
  });
}

// Function to inspect page structure
function inspectPageStructure() {
  const info = {
    title: document.title,
    url: window.location.href,
    inputs: [],
    textareas: [],
    buttons: [],
    allElements: []
  };

  // Find all inputs
  document.querySelectorAll('input').forEach(input => {
    info.inputs.push({
      type: input.type,
      id: input.id,
      name: input.name,
      className: input.className,
      placeholder: input.placeholder
    });
  });

  // Find all textareas
  document.querySelectorAll('textarea').forEach(textarea => {
    info.textareas.push({
      id: textarea.id,
      name: textarea.name,
      className: textarea.className,
      placeholder: textarea.placeholder
    });
  });

  // Find all buttons
  document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(btn => {
    info.buttons.push({
      text: btn.textContent || btn.value,
      id: btn.id,
      className: btn.className,
      type: btn.type
    });
  });

  // Get all elements with IDs (helpful for identifying structure)
  document.querySelectorAll('[id]').forEach(el => {
    info.allElements.push({
      tag: el.tagName,
      id: el.id,
      className: el.className
    });
  });

  return info;
}

// Function injected into detokenizer page
function interactWithDetokenizer(token) {
  console.log('Starting interaction with token:', token.substring(0, 10) + '...');

  return new Promise((resolve, reject) => {
    try {
      // Wait for page to be ready
      const waitForElement = (selectors, timeout = 10000) => {
        return new Promise((resolve, reject) => {
          const startTime = Date.now();
          const check = () => {
            // Try multiple selectors
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element && element.offsetParent !== null) { // Check if visible
                console.log('Found element with selector:', selector);
                resolve(element);
                return;
              }
            }

            if (Date.now() - startTime > timeout) {
              reject(new Error(`None of these selectors found: ${selectors.join(', ')}`));
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      };

      console.log('Step 1: Looking for operation selector (Detokenize)...');

      // Step 1: Select "Detokenize" operation
      // This could be a dropdown, radio button, or select element
      const operationSelectors = [
        'select[name*="operation"]',
        'select[id*="operation"]',
        'select',
        'input[type="radio"][value*="detokenize"]',
        'input[type="radio"][value*="Detokenize"]'
      ];

      waitForElement(operationSelectors)
        .then(operationElement => {
          console.log('Found operation selector:', operationElement.tagName);

          if (operationElement.tagName === 'SELECT') {
            // It's a dropdown
            const options = operationElement.querySelectorAll('option');
            for (let option of options) {
              if (option.textContent.toLowerCase().includes('detokenize') ||
                  option.value.toLowerCase().includes('detokenize')) {
                operationElement.value = option.value;
                console.log('Selected Detokenize operation from dropdown');
                break;
              }
            }
            operationElement.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (operationElement.tagName === 'INPUT' && operationElement.type === 'radio') {
            // It's a radio button
            operationElement.checked = true;
            operationElement.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Selected Detokenize radio button');
          }

          console.log('Step 2: Looking for Token input field...');

          // Step 2: Find the Token input field
          const tokenInputSelectors = [
            'textarea[name*="token" i]',
            'textarea[id*="token" i]',
            'input[name*="token" i]',
            'input[id*="token" i]',
            'textarea[placeholder*="token" i]',
            'input[placeholder*="token" i]',
            'textarea',
            'input[type="text"]'
          ];

          return waitForElement(tokenInputSelectors);
        })
        .then(tokenInput => {
          console.log('Found token input:', tokenInput.tagName, tokenInput.id || tokenInput.name);

          // Enter the token
          tokenInput.value = token;
          tokenInput.focus();
          tokenInput.dispatchEvent(new Event('input', { bubbles: true }));
          tokenInput.dispatchEvent(new Event('change', { bubbles: true }));
          tokenInput.dispatchEvent(new Event('keyup', { bubbles: true }));

          console.log('Token entered successfully');
          console.log('Step 3: Looking for "Perform Operation" button...');

          // Step 3: Find and click "Perform Operation" button
          const buttonSelectors = [
            'button:contains("Perform Operation")', // Won't work, but leaving for reference
            'input[value*="Perform Operation"]',
            'input[value*="perform" i]',
            'button[value*="perform" i]',
            'input[type="submit"]',
            'input[type="button"]',
            'button[type="submit"]',
            'button'
          ];

          // Since :contains() doesn't work in querySelector, check buttons by text
          const allButtons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
          for (let btn of allButtons) {
            const btnText = (btn.textContent || btn.value || '').toLowerCase();
            if (btnText.includes('perform') && btnText.includes('operation')) {
              console.log('Found "Perform Operation" button by text');
              return Promise.resolve(btn);
            }
          }

          // Fallback to selector-based search
          return waitForElement(buttonSelectors);
        })
        .then(button => {
          console.log('Found button:', button.textContent || button.value);
          button.click();

          console.log('Button clicked! Waiting for result...');

          // Step 4: Wait for and extract result
          const resultSelectors = [
            'textarea[name*="result" i]',
            'textarea[id*="result" i]',
            'div[id*="result" i]',
            'div[class*="result" i]',
            'pre',
            'code',
            '.output',
            '[id*="output" i]',
            '[class*="output" i]',
            'textarea[readonly]',
            'input[readonly]'
          ];

          return waitForElement(resultSelectors, 20000); // Wait up to 20 seconds for result
        })
        .then(resultElement => {
          console.log('Found result element:', resultElement.tagName, resultElement.id || resultElement.className);

          // Get the detokenized value
          let detokenizedValue = '';
          if (resultElement.tagName === 'TEXTAREA' || resultElement.tagName === 'INPUT') {
            detokenizedValue = resultElement.value;
          } else {
            detokenizedValue = resultElement.textContent || resultElement.innerText;
          }

          detokenizedValue = detokenizedValue.trim();
          console.log('Detokenized value:', detokenizedValue);

          if (!detokenizedValue) {
            throw new Error('Result element found but empty');
          }

          resolve({ success: true, value: detokenizedValue });
        })
        .catch(error => {
          console.error('Error during interaction:', error);

          // Return detailed error with page structure
          const pageInfo = {
            url: window.location.href,
            title: document.title,
            allInputs: Array.from(document.querySelectorAll('input')).map(i => ({
              type: i.type,
              id: i.id,
              name: i.name,
              value: i.value?.substring(0, 50)
            })),
            allButtons: Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(b => ({
              text: (b.textContent || b.value)?.substring(0, 50),
              id: b.id,
              type: b.type
            })),
            allTextareas: Array.from(document.querySelectorAll('textarea')).map(t => ({
              id: t.id,
              name: t.name,
              value: t.value?.substring(0, 50)
            }))
          };

          resolve({
            success: false,
            error: error.message,
            pageInfo: pageInfo
          });
        });

    } catch (error) {
      console.error('Caught exception:', error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to open panel
  chrome.tabs.sendMessage(tab.id, {
    action: 'openPanel'
  });
});

// Context menu for quick detokenization
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
