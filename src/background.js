// Background service worker for Chrome extension
console.log('Splunk Detokenizer Background Script loaded');

// Cache configuration
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 100; // Prevent unlimited growth

// Batch queue — collect tokens for a short window then process all in one tab
const batchQueue = []; // [{token, resolve, reject}]
let batchTimer = null;
let batchRunning = false;

function enqueueBatch(token) {
  return new Promise((resolve, reject) => {
    batchQueue.push({ token, resolve, reject });
    if (!batchTimer) {
      batchTimer = setTimeout(flushBatch, 300); // wait 300ms to collect more tokens
    }
  });
}

async function flushBatch() {
  batchTimer = null;
  if (batchRunning || batchQueue.length === 0) return;
  batchRunning = true;

  // Drain the current queue snapshot
  const batch = batchQueue.splice(0, batchQueue.length);
  console.log(`🚀 Processing batch of ${batch.length} tokens in one tab`);

  // Separate cached vs uncached
  const results = {};
  const uncached = [];
  for (const item of batch) {
    const cached = await getCachedResult(item.token);
    if (cached) {
      results[item.token] = { success: true, detokenizedValue: cached, fromCache: true };
    } else {
      uncached.push(item.token);
    }
  }

  // Detokenize all uncached in one tab
  if (uncached.length > 0) {
    try {
      const batchResults = await detokenizeBatch(uncached);
      for (const [token, value] of Object.entries(batchResults)) {
        await cacheResult(token, value);
        results[token] = { success: true, detokenizedValue: value };
      }
      // Mark failed ones
      for (const token of uncached) {
        if (!results[token]) {
          results[token] = { success: false, error: 'Not found in response' };
        }
      }
    } catch (err) {
      for (const token of uncached) {
        results[token] = { success: false, error: err.message };
      }
    }
  }

  // Resolve all promises
  for (const item of batch) {
    item.resolve(results[item.token] || { success: false, error: 'Unknown error' });
  }

  batchRunning = false;

  // If more items arrived while we were running, flush again
  if (batchQueue.length > 0) {
    batchTimer = setTimeout(flushBatch, 100);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  if (request.action === 'detokenize') {
    enqueueBatch(request.token)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'detokenizeBatch') {
    // Clear previous results, then process — results pushed progressively via storage
    chrome.storage.local.set({ autoDetokenResults: {} });
    handleBatchDetokenize(request.tokens).catch(err => console.error('Batch error:', err));
    sendResponse({ started: true });
    return false;
  }

  return false;
});

// Handle a batch of tokens — open ONE tab, process each token sequentially, close tab
async function handleBatchDetokenize(tokens) {
  const results = {};

  // Serve cached tokens immediately
  const uncached = [];
  for (const token of tokens) {
    const cached = await getCachedResult(token);
    if (cached) {
      results[token] = cached;
    } else {
      uncached.push(token);
    }
  }

  if (uncached.length === 0) {
    console.log('✅ All tokens served from cache');
    await chrome.storage.local.set({ autoDetokenResults: results });
    return results;
  }

  console.log(`🚀 Processing ${uncached.length} tokens in ONE tab sequentially`);

  const url = 'https://bt1.my.salesforce.com/admin/framework/action.apexp?entryPoint=BlackTab_UI&actionName=Detokenizer';

  await new Promise((resolve, reject) => {
    chrome.windows.create({ url, type: 'popup', focused: false, width: 500, height: 400 }, async (win) => {
      if (!win || !win.tabs || !win.tabs[0]) { reject(new Error('Failed to create window')); return; }
      const tabId = win.tabs[0].id;
      const windowId = win.id;

      try {
        await waitForTabComplete(tabId);
        await sleep(3000);

        // Set Action to Read once
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const selects = document.querySelectorAll('select');
            for (const select of selects) {
              const opts = Array.from(select.options);
              if (opts.some(o => o.value === 'Read' || o.textContent.trim() === 'Read')) {
                select.value = 'Read';
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return;
              }
            }
          }
        });
        await sleep(2000);

        // Set Strategy once
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const selects = document.querySelectorAll('select');
            for (const select of selects) {
              const opts = Array.from(select.options);
              const shortTerm = opts.find(o => o.value.includes('SHORT_TERM') || o.textContent.includes('SHORT_TERM'));
              if (shortTerm) { select.value = shortTerm.value; select.dispatchEvent(new Event('change', { bubbles: true })); return; }
            }
          }
        });
        await sleep(2000);

        // Flush cached results immediately to storage so content script can start replacing
        if (Object.keys(results).length > 0) {
          await chrome.storage.local.set({ autoDetokenResults: { ...results } });
        }

        // Process each token one at a time in the same tab
        for (const token of uncached) {
          const cleanToken = token.replace(/\s+/g, '');
          console.log(`Processing token ${uncached.indexOf(token) + 1}/${uncached.length}: ${cleanToken.substring(0, 20)}...`);

          // Fill textarea and click Run
          const fillResult = await chrome.scripting.executeScript({
            target: { tabId },
            func: (t) => {
              const textareas = document.querySelectorAll('textarea');
              for (const ta of textareas) {
                const style = window.getComputedStyle(ta);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                  ta.value = t;
                  ta.dispatchEvent(new Event('input', { bubbles: true }));
                  ta.dispatchEvent(new Event('change', { bubbles: true }));
                  const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
                  for (const btn of buttons) {
                    if ((btn.textContent || btn.value || '').toLowerCase().includes('run')) {
                      btn.click();
                      return true;
                    }
                  }
                }
              }
              return false;
            },
            args: [cleanToken]
          });

          if (!fillResult?.[0]?.result) { console.warn('Could not fill/run for token', cleanToken.substring(0, 20)); continue; }

          // Wait for result
          let found = false;
          for (let i = 0; i < 20; i++) {
            await sleep(1000);
            const check = await chrome.scripting.executeScript({
              target: { tabId },
              func: () => {
                const html = document.body.innerHTML || '';
                const resultsMatch = html.match(/Unique Run ID[\s\S]{100,}/i);
                if (resultsMatch && (resultsMatch[0].includes('@') || resultsMatch[0].match(/<td[^>]*>[^<]{10,}<\/td>/))) return true;
                if (html.match(/Errors[^<]*<[^>]*>([A-Z_]+)</i)) return true;
                return false;
              }
            });
            if (check?.[0]?.result) { found = true; break; }
          }

          // Extract result
          const extract = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
              const html = document.body.innerHTML || '';
              const section = html.match(/Unique Run ID[\s\S]{0,50000}/i);
              if (section) {
                const cellMatch = section[0].match(/<td[^>]*class="dataCell"[^>]*>([\s\S]*?)<\/td>/i);
                if (cellMatch) {
                  const val = cellMatch[1].replace(/<[^>]+>/g, '').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
                  if (val) return val;
                }
                const emails = section[0].replace(/<[^>]+>/g,' ').match(/([\w.-]+@[\w.-]+\.\w+)/g);
                if (emails) { const nonSF = emails.find(e => !e.includes('salesforce.com')); return nonSF || emails[0]; }
              }
              return null;
            }
          });

          const value = extract?.[0]?.result;
          if (value) {
            results[token] = value;
            await cacheResult(token, value);
            console.log(`✅ Token ${uncached.indexOf(token) + 1}: ${value}`);
            // Push result immediately so content script can replace inline without waiting
            const current = (await chrome.storage.local.get(['autoDetokenResults'])).autoDetokenResults || {};
            current[token] = value;
            await chrome.storage.local.set({ autoDetokenResults: current });
          }
        }

        chrome.windows.remove(windowId).catch(() => {});
        resolve();
      } catch (err) {
        chrome.windows.remove(windowId).catch(() => {});
        reject(err);
      }
    });
  });

  return results;
}

// Main detokenization handler
async function handleDetokenize(token) {
  try {
    console.log('Starting detokenization for token:', token.substring(0, 10) + '...');

    // Check cache first
    const cachedResult = await getCachedResult(token);
    if (cachedResult) {
      console.log('✅ Cache hit! Returning cached result:', cachedResult.substring(0, 50) + '...');
      return {
        success: true,
        detokenizedValue: cachedResult,
        fromCache: true
      };
    }

    console.log('Cache miss, proceeding with detokenization...');

    // Open BlackTab page and automate it
    const result = await automateBlackTab(token);

    // Cache the successful result
    await cacheResult(token, result);
    console.log('✅ Result cached for future use');

    return {
      success: true,
      detokenizedValue: result
    };

  } catch (error) {
    console.error('Detokenization failed:', error);

    // Check if error is authentication-related
    if (error.message && error.message.includes('Insufficient Privileges')) {
      return {
        success: false,
        error: 'Not authenticated to Salesforce. Please login to bt1.my.salesforce.com and try again.'
      };
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Get cached result if available and not expired
async function getCachedResult(token) {
  try {
    const result = await chrome.storage.local.get(['detokenCache']);
    const cache = result.detokenCache || {};

    const entry = cache[token];
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > CACHE_EXPIRY_MS) {
      console.log('Cache entry expired, removing...');
      delete cache[token];
      await chrome.storage.local.set({ detokenCache: cache });
      return null;
    }

    return entry.value;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

// Cache a detokenization result
async function cacheResult(token, value) {
  try {
    const result = await chrome.storage.local.get(['detokenCache']);
    let cache = result.detokenCache || {};

    // Add new entry
    cache[token] = {
      value: value,
      timestamp: Date.now()
    };

    // Enforce max cache size (LRU: remove oldest entries)
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Keep only the newest MAX_CACHE_ENTRIES
      const entriesToKeep = entries.slice(-MAX_CACHE_ENTRIES);
      cache = Object.fromEntries(entriesToKeep);

      console.log(`Cache pruned from ${entries.length} to ${MAX_CACHE_ENTRIES} entries`);
    }

    await chrome.storage.local.set({ detokenCache: cache });
  } catch (error) {
    console.error('Error caching result:', error);
  }
}

// Detokenize multiple tokens in ONE tab — returns {token: value} map
async function detokenizeBatch(tokens) {
  const cleanTokens = tokens.map(t => t.replace(/\s+/g, ''));
  const combined = cleanTokens.join('\n');
  console.log(`🚀 Batch: ${cleanTokens.length} tokens in one tab`);

  const raw = await detokenizeWithTab(combined);
  // raw is a newline-separated list of results matching token order
  const lines = (raw || '').split('\n').map(l => l.trim()).filter(Boolean);
  const map = {};
  for (let i = 0; i < cleanTokens.length; i++) {
    map[cleanTokens[i]] = lines[i] || raw; // fallback to full result if single token
  }
  return map;
}

// Automate BlackTab page using tab method
async function automateBlackTab(token) {
  console.log('🚀 Starting detokenization via tab method...');
  return await detokenizeWithTab(token);
}

// Detokenize using automated tab (works with new dynamic form)
async function detokenizeWithTab(token) {
  // Strip all whitespace (newlines, spaces, tabs) except intentional newlines between tokens
  token = token.replace(/[ \t\r]+/g, '');
  console.log('Cleaned token:', token.substring(0, 50) + '...', 'length:', token.length);

  const url = 'https://bt1.my.salesforce.com/admin/framework/action.apexp?entryPoint=BlackTab_UI&actionName=Detokenizer';

  return new Promise(async (resolve, reject) => {
    console.log('Opening BlackTab in background window...');

    // Create new window with focused: false - tab active in its window but user stays on current window
    chrome.windows.create({
      url: url,
      type: 'popup',
      focused: false,  // Don't steal focus from user's window
      width: 500,
      height: 400
    }, async (window) => {
      if (!window || !window.tabs || !window.tabs[0]) {
        reject(new Error('Failed to create background window'));
        return;
      }

      const tabId = window.tabs[0].id;
      const windowId = window.id;
      console.log('Background window created:', windowId, 'tab:', tabId);

      try {
        // Wait for tab to load
        console.log('Waiting for page to load...');
        await waitForTabComplete(tabId);
        console.log('✅ Page loaded!');

        // Get current URL to confirm we're on the right page
        const currentTab = await chrome.tabs.get(tabId);
        console.log('Current URL:', currentTab.url);

        if (!currentTab.url.includes('/admin/framework/action.apexp')) {
          throw new Error('Not on detokenizer page. Current URL: ' + currentTab.url);
        }

        // Wait for page to initialize
        await sleep(3000);
        console.log('Page initialized, starting form fill...');

        // Step 1: Set Action dropdown to "Read"
        console.log('Step 1: Setting Action to Read...');
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const selects = document.querySelectorAll('select');
            for (let select of selects) {
              const options = Array.from(select.querySelectorAll('option'));
              const hasRead = options.some(opt => opt.value === 'Read' || opt.textContent.trim() === 'Read');
              if (hasRead) {
                select.value = 'Read';
                select.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Set Action to Read');
                return true;
              }
            }
            console.error('❌ Could not find Action dropdown');
            return false;
          }
        });

        // Wait for dynamic form to load
        await sleep(2000);

        // Step 2: Set Tokenization Strategy
        console.log('Step 2: Setting Tokenization Strategy...');
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            const selects = document.querySelectorAll('select');
            for (let select of selects) {
              const options = Array.from(select.querySelectorAll('option'));
              const hasShortTerm = options.some(opt =>
                opt.value.includes('SHORT_TERM') || opt.textContent.includes('SHORT_TERM')
              );
              if (hasShortTerm) {
                const option = Array.from(options).find(opt =>
                  opt.value.includes('SHORT_TERM') || opt.textContent.includes('SHORT_TERM')
                );
                if (option) {
                  select.value = option.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  console.log('✅ Set Strategy to', option.value);
                  return true;
                }
              }
            }
            console.log('⚠️ Strategy dropdown not found (might not be required)');
            return true;
          }
        });

        // Wait for dynamic form to fully load after strategy selection
        await sleep(2000);
        console.log('Dynamic form should be stable now');

        // Step 3: Fill token textarea and click Run immediately
        console.log('Step 3: Filling token and clicking Run...');
        console.log('Token to fill:', token.substring(0, 50) + '...', 'length:', token.length);

        const fillAndRunResult = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (tokenValue) => {
            console.log('Filling token, length:', tokenValue.length);
            const textareas = document.querySelectorAll('textarea');
            console.log('Found textareas:', textareas.length);

            let filled = false;
            for (let ta of textareas) {
              const style = window.getComputedStyle(ta);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                ta.value = tokenValue;
                ta.focus();
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                ta.dispatchEvent(new Event('change', { bubbles: true }));

                // Verify value was set
                const verifyValue = ta.value;
                console.log('✅ Token filled. Verify length:', verifyValue.length, 'matches:', verifyValue === tokenValue);
                filled = true;
                break;
              }
            }

            if (!filled) {
              console.error('❌ Could not find visible token textarea');
              return { success: false, error: 'No textarea found' };
            }

            // Immediately find and click Run button to prevent form reset
            const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
            for (let btn of buttons) {
              const text = (btn.textContent || btn.value || '').toLowerCase();
              if (text.includes('run')) {
                btn.click();
                console.log('✅ Clicked Run button immediately after fill');
                return { success: true, clicked: true };
              }
            }

            console.error('❌ Could not find Run button');
            return { success: false, error: 'No Run button found' };
          },
          args: [token]
        });

        console.log('Fill and run result:', fillAndRunResult[0]?.result);
        if (!fillAndRunResult[0]?.result?.success) {
          throw new Error('Failed to fill token or click Run: ' + (fillAndRunResult[0]?.result?.error || 'unknown'));
        }

        console.log('Waiting for AJAX result...');

        // Poll for Results or Errors section with actual content (not just header)
        let resultsFound = false;
        for (let i = 0; i < 20; i++) {
          await sleep(1000);

          const checkResult = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              const bodyHTML = document.body.innerHTML || '';
              const bodyText = document.body.textContent || '';

              // Check for Errors section with content
              if (bodyHTML.match(/Errors[^<]*<[^>]*>([A-Z_]+)</i)) {
                return true; // Error present
              }

              // Check for Results section with actual data (email or content after "Unique Run ID")
              const resultsMatch = bodyHTML.match(/Unique Run ID[\s\S]{100,}/i);
              if (resultsMatch) {
                // Verify it has actual content, not just buttons/headers
                const content = resultsMatch[0];
                // Look for @ symbol (email) or substantial text content
                if (content.includes('@') || content.match(/<td[^>]*>[^<]{10,}<\/td>/)) {
                  return true; // Results with data
                }
              }

              return false; // Still loading
            }
          });

          if (checkResult?.[0]?.result) {
            console.log('✅ Results/Errors detected after', (i + 1), 'seconds');
            resultsFound = true;
            break;
          }
        }

        if (!resultsFound) {
          console.warn('⚠️ Results not detected after 20s, attempting extraction anyway');
        }

        await sleep(500); // Brief wait for final render

        // Extract result
        const resultScript = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            console.log('=== EXTRACTING RESULT ===');

            // Get page HTML and text
            const bodyHTML = document.body.innerHTML || '';
            const bodyText = document.body.textContent || '';
            console.log('Page text (first 500 chars):', bodyText.substring(0, 500));

            // Check for Errors section (appears when token is invalid or permission denied)
            // Match "Errors" followed by error text up to next major HTML tag or form element
            const errorsMatch = bodyHTML.match(/Errors[^<]*<[^>]*>([^<]+)</i);
            if (errorsMatch && errorsMatch[1]) {
              const errorText = errorsMatch[1].trim();
              console.log('Extracted error:', errorText);
              return { error: errorText };
            }

            // Fallback: look for "Errors" in text and grab next word
            const errorsTextMatch = bodyText.match(/Errors\s+([A-Z_]+)/);
            if (errorsTextMatch && errorsTextMatch[1]) {
              console.log('Extracted error (text fallback):', errorsTextMatch[1]);
              return { error: errorsTextMatch[1] };
            }

            // Check in body text as fallback
            if (bodyText.includes('Insufficient Privileges') || bodyText.includes('not allowed')) {
              const errorMatch = bodyText.match(/(Insufficient Privileges[^.]*\.)/i) ||
                                bodyText.match(/(You are not allowed[^.]*\.)/i);
              if (errorMatch) {
                return { error: errorMatch[0] };
              }
              return { error: 'Insufficient Privileges' };
            }

            if (bodyText.includes('INVALID_TOKEN')) {
              return { error: 'INVALID_TOKEN' };
            }

            // Look in Results table after "Unique Run ID"
            // Search HTML first (has better structure), fallback to text
            // Increased range to capture full Results table (up to 50KB for large results)
            let resultsSection = bodyHTML.match(/Unique Run ID[\s\S]{0,50000}/i);
            if (!resultsSection) {
              resultsSection = bodyText.match(/Unique Run ID[\s\S]{0,25000}/i);
            }
            console.log('Results section found:', !!resultsSection);
            if (resultsSection) {
              const resultHTML = resultsSection[0];
              console.log('Results section length:', resultHTML.length);
              console.log('Results section content (first 800 chars):', resultHTML.substring(0, 800));

              // Extract first dataCell content (contains the detokenized result)
              const dataCellMatch = resultHTML.match(/<td[^>]*class="dataCell"[^>]*>([\s\S]*?)<\/td>/i);
              console.log('DataCell found:', !!dataCellMatch);
              if (dataCellMatch) {
                console.log('DataCell raw content:', dataCellMatch[1]);
              }

              if (dataCellMatch && dataCellMatch[1]) {
                // Extract ALL dataCell values (one per token when batch)
                const allDataCells = [...resultHTML.matchAll(/<td[^>]*class="dataCell"[^>]*>([\s\S]*?)<\/td>/gi)];
                const decodeCell = (raw) => raw
                  .replace(/<[^>]+>/g, '')
                  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
                  .trim();
                if (allDataCells.length > 1) {
                  const values = allDataCells.map(m => decodeCell(m[1])).filter(Boolean);
                  console.log('✅ Batch extracted', values.length, 'values');
                  return { value: values.join('\n') };
                }
                const result = decodeCell(dataCellMatch[1]);
                if (result.length === 0) {
                  console.log('⚠️ DataCell empty after decoding. Raw:', dataCellMatch[1].substring(0, 200));
                } else {
                  console.log('✅ Extracted from dataCell:', result.substring(0, 100));
                }
                return { value: result };
              }

              // Fallback: text-based email extraction
              const resultText = resultHTML.replace(/<[^>]+>/g, ' '); // Strip tags for text search

              // 1. Look for email in angle brackets: "Name <email@domain.com>"
              let emailMatch = resultText.match(/<([\w.-]+@[\w.-]+\.\w+)>/);
              if (emailMatch && emailMatch[1]) {
                const result = emailMatch[1];
                console.log('Found result (angle bracket pattern):', result);
                return { value: result };
              }

              // 2. Look for "noreply=" pattern (keep full value including noreply=)
              emailMatch = resultText.match(/noreply=([\w.-]+@[\w.-]+\.\w+)/i);
              if (emailMatch && emailMatch[0]) {
                const result = emailMatch[0]; // Keep full match including "noreply="
                console.log('Found result (noreply= pattern):', result);
                return { value: result };
              }

              // 3. Any email NOT from salesforce.com (prefer non-relay)
              const allEmails = resultText.match(/([\w.-]+@[\w.-]+\.\w+)/g);
              if (allEmails) {
                const nonSalesforceEmail = allEmails.find(email => !email.includes('salesforce.com'));
                if (nonSalesforceEmail) {
                  // Clean email - strip any non-email characters
                  const cleanEmail = nonSalesforceEmail.match(/([\w.-]+@[\w.-]+\.\w+)/)[0];
                  console.log('Found result (non-salesforce email):', cleanEmail);
                  return { value: cleanEmail };
                }

                // 3b. If only salesforce.com emails found, accept first one
                if (allEmails.length > 0) {
                  const cleanEmail = allEmails[0].match(/([\w.-]+@[\w.-]+\.\w+)/)[0];
                  console.log('Found result (salesforce email):', cleanEmail);
                  return { value: cleanEmail };
                }
              }

              // 4. Last resort: accept relay address
              if (emailMatch && emailMatch[1]) {
                console.log('Found result (relay address fallback):', emailMatch[1]);
                return { value: emailMatch[1] };
              }
            }

            // Fallback: search entire page for email not from salesforce
            const emailMatch = bodyText.match(/([\w.-]+@[\w.-]+\.\w+)/);
            console.log('Fallback email match:', emailMatch);
            if (emailMatch && !emailMatch[0].includes('salesforce.com')) {
              console.log('Found result (fallback):', emailMatch[0]);
              return { value: emailMatch[0] };
            }

            console.error('No result found. Full page contains @ symbol:', bodyText.includes('@'));

            // Return debug info
            return {
              error: 'Could not find result in response',
              debug: {
                hasResultsSection: !!resultsSection,
                resultsSectionPreview: resultsSection ? resultsSection[0].substring(0, 200) : 'N/A',
                pageHasAtSymbol: bodyText.includes('@'),
                pagePreview: bodyText.substring(0, 500)
              }
            };
          }
        });

        const result = resultScript?.[0]?.result;

        // Process result BEFORE closing tab
        let finalResult;
        let finalError;

        if (result?.error) {
          console.error('Error:', result.error);
          if (result.debug) {
            console.error('Debug info:', JSON.stringify(result.debug, null, 2));
          }
          finalError = new Error(result.error);
        } else if (result?.value) {
          console.log('✅ SUCCESS! Result:', result.value);
          finalResult = result.value;
        } else {
          finalError = new Error('No result found');
        }

        // Close window after processing result
        chrome.windows.remove(windowId).catch(() => {
          console.log('Window already closed');
        });

        // Resolve/reject after tab close initiated
        if (finalError) {
          reject(finalError);
        } else {
          resolve(finalResult);
        }

      } catch (error) {
        console.error('Error:', error);
        // Close window on error
        try {
          await chrome.windows.remove(windowId);
        } catch (e) {
          console.log('Window already closed');
        }
        reject(error);
      }
    });
  });
}

// Wait for tab to load the correct page (not login/redirect pages)
function waitForTabComplete(tabId) {
  return new Promise(async (resolve, reject) => {
    // Increase timeout to 2 minutes to give user time to login
    const timeout = setTimeout(() => {
      reject(new Error('Tab load timeout after 2 minutes. Please ensure you are logged into bt1.my.salesforce.com'));
    }, 120000);

    // Poll tab status every second instead of relying on onUpdated events
    // onUpdated can miss events for unfocused windows
    const pollInterval = setInterval(async () => {

      try {
        // Get current tab info
        const currentTab = await chrome.tabs.get(tabId);
        const url = currentTab.url;
        const status = currentTab.status;

        console.log('Polling tab - status:', status, 'URL:', url ? url.substring(0, 100) : 'N/A');

        // Check if we're on the actual tokenizer page (not login/redirect)
        const isTokenizerPage = url && url.includes('/admin/framework/action.apexp');

        // All known redirect/auth URLs
        const isRedirect = url && (
          url.includes('?ec=') ||
          url.includes('&startURL=') ||
          url.includes('&retURL=') ||
          url.includes('/idp/') ||
          url.includes('/saml/') ||
          url.includes('/secur/frontdoor') ||
          url.includes('central.my.salesforce.com') ||
          url.includes('login') ||
          url.includes('authn-request')
        );

        if (isTokenizerPage && !isRedirect && status === 'complete') {
          console.log('✅ Tokenizer page loaded and complete!');
          clearTimeout(timeout);
          clearInterval(pollInterval);
          setTimeout(() => resolve(), 2000);
        }
      } catch (error) {
        console.error('Error polling tab:', error);
        // Tab might be closed, stop polling
        clearTimeout(timeout);
        clearInterval(pollInterval);
        reject(error);
      }
    }, 1000); // Poll every second
  });
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'openPanel' }).catch(() => {});
});

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'detokenize-selection',
    title: 'Detokenize with BlackTab',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'clear-cache',
    title: 'Clear Detokenization Cache',
    contexts: ['page', 'action']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'detokenize-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'openPanel',
      token: info.selectionText
    }).catch(() => {});
  } else if (info.menuItemId === 'clear-cache') {
    try {
      const result = await chrome.storage.local.get(['detokenCache']);
      const cache = result.detokenCache || {};
      const count = Object.keys(cache).length;

      await chrome.storage.local.set({ detokenCache: {} });
      console.log(`✅ Cache cleared! Removed ${count} entries.`);

      // Notify user
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: `Cache cleared! Removed ${count} cached tokens.`,
        type: 'info'
      }).catch(() => {
        // If content script not available, just log
        console.log('Cache cleared but could not show notification (content script not loaded)');
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
});
