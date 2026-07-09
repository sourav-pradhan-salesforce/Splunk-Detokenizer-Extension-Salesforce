// Content script that runs on Splunk pages
(function() {
  'use strict';

  let detokenizerPanel = null;
  let isDetokenizing = false;
  let lastClickTime = 0;
  let buttonTimeout = null;

  // Splunk separates raw log fields with backtick characters as literal text.
  // Consecutive tokens share a backtick: ...`token1`token2`token3`...
  // Using a lookahead for the closing backtick means it is NOT consumed, so it
  // remains available as the opening backtick for the next adjacent token.
  // match[0] = "`token"  (opening backtick consumed, closing backtick NOT consumed)
  // match[1] = "token"   (the token value, no backticks)
  const TOKEN_PATTERN = /`(A-[^`]+)(?=`)/g;

  // Return the token value from a TOKEN_PATTERN match (always group 1).
  function tokenFromMatch(match) {
    return match[1];
  }

  // Tooltip timing constants
  const TOOLTIP_SHOW_DELAY = 1500;  // 1.5 seconds before showing tooltip
  const TOOLTIP_HIDE_DELAY = 300;   // 300ms before hiding tooltip (quick hide when mouse leaves)

  let hoverTooltip = null;
  let currentHoveredToken = null;
  let currentTokenElement = null;  // Track the container element for the current token
  let tooltipHideTimeout = null;
  let tooltipShowTimeout = null;
  let isHoveringTooltip = false;
  let isHoveringToken = false;
  let pendingToken = null;
  let hasMouseMovedSincePageLoad = false;
  let isTooltipDetokenizing = false;  // Track if tooltip is actively detokenizing

  // Initialize the extension
  function init() {
    console.log('Splunk Detokenizer Extension loaded');

    // Add context menu on text selection - REMOVED: Using hover detection only
    // document.addEventListener('mouseup', handleTextSelection);

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);

    // Create floating panel with integrated history
    createDetokenizerPanel();

    // Add hover detection for tokens
    initHoverDetection();
  }

  // Create a floating panel for detokenization results - using safe DOM methods
  function createDetokenizerPanel() {
    detokenizerPanel = document.createElement('div');
    detokenizerPanel.id = 'detokenizer-panel';
    detokenizerPanel.className = 'detokenizer-panel hidden';

    // Create header
    const header = document.createElement('div');
    header.className = 'detokenizer-header';

    const title = document.createElement('span');
    title.className = 'detokenizer-title';
    title.textContent = '🔓 BlackTab Detokenizer';

    const headerButtons = document.createElement('div');
    headerButtons.style.display = 'flex';
    headerButtons.style.gap = '8px';
    headerButtons.style.alignItems = 'center';

    const themeToggle = document.createElement('button');
    themeToggle.className = 'detokenizer-theme-toggle';
    themeToggle.id = 'theme-toggle';
    themeToggle.innerHTML = '🌙';
    themeToggle.title = 'Toggle theme';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'detokenizer-close';
    closeBtn.id = 'close-panel';
    closeBtn.textContent = '✕';

    headerButtons.appendChild(themeToggle);
    headerButtons.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(headerButtons);

    // Create content container
    const content = document.createElement('div');
    content.className = 'detokenizer-content';

    // Input section
    const inputSection = document.createElement('div');
    inputSection.className = 'detokenizer-input-section';

    const inputLabel = document.createElement('label');
    inputLabel.setAttribute('for', 'token-input');
    inputLabel.textContent = 'Token to Detokenize:';

    const inputTextarea = document.createElement('textarea');
    inputTextarea.id = 'token-input';
    inputTextarea.placeholder = 'Paste or select tokenized value...';

    const detokenizeBtn = document.createElement('button');
    detokenizeBtn.id = 'detokenize-btn';
    detokenizeBtn.className = 'detokenize-btn';
    detokenizeBtn.textContent = 'Detokenize';

    inputSection.appendChild(inputLabel);
    inputSection.appendChild(inputTextarea);
    inputSection.appendChild(detokenizeBtn);

    // Result section
    const resultSection = document.createElement('div');
    resultSection.className = 'detokenizer-result-section hidden';

    const resultLabel = document.createElement('label');
    resultLabel.textContent = 'Detokenized Value:';

    const resultValue = document.createElement('div');
    resultValue.id = 'detokenized-value';
    resultValue.className = 'detokenized-value';

    const copyBtn = document.createElement('button');
    copyBtn.id = 'copy-result';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy to Clipboard';

    resultSection.appendChild(resultLabel);
    resultSection.appendChild(resultValue);
    resultSection.appendChild(copyBtn);

    // Loading section
    const loadingSection = document.createElement('div');
    loadingSection.className = 'detokenizer-loading hidden';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    const loadingText = document.createElement('p');
    loadingText.id = 'loading-text';
    loadingText.textContent = 'Detokenizing...';

    const loadingHint = document.createElement('p');
    loadingHint.style.fontSize = '12px';
    loadingHint.style.color = '#718096';
    loadingHint.style.marginTop = '8px';
    loadingHint.textContent = '(Check background tab if you need to login)';

    loadingSection.appendChild(spinner);
    loadingSection.appendChild(loadingText);
    loadingSection.appendChild(loadingHint);

    // Error section
    const errorSection = document.createElement('div');
    errorSection.className = 'detokenizer-error hidden';

    const errorMessage = document.createElement('p');
    errorMessage.id = 'error-message';

    errorSection.appendChild(errorMessage);

    // History section
    const historySection = document.createElement('div');
    historySection.className = 'detokenizer-history-section';

    const historyHeader = document.createElement('div');
    historyHeader.className = 'history-header';

    const historyTitle = document.createElement('h3');
    historyTitle.textContent = 'History';

    const historyClearBtn = document.createElement('button');
    historyClearBtn.className = 'history-clear-btn';
    historyClearBtn.textContent = 'Clear All';
    historyClearBtn.addEventListener('click', clearHistory);

    historyHeader.appendChild(historyTitle);
    historyHeader.appendChild(historyClearBtn);

    const historyList = document.createElement('div');
    historyList.id = 'history-list';
    historyList.className = 'history-list';

    const emptyState = document.createElement('div');
    emptyState.className = 'history-empty-state';
    emptyState.id = 'history-empty-state';
    emptyState.textContent = 'No history yet. Detokenize a value to see it here!';

    historyList.appendChild(emptyState);

    historySection.appendChild(historyHeader);
    historySection.appendChild(historyList);

    // Assemble content
    content.appendChild(inputSection);
    content.appendChild(resultSection);
    content.appendChild(loadingSection);
    content.appendChild(errorSection);
    content.appendChild(historySection);

    // Footer section
    const footer = document.createElement('div');
    footer.className = 'detokenizer-footer';

    const madeWith = document.createElement('div');
    madeWith.className = 'footer-made-with';
    madeWith.appendChild(document.createTextNode('Made with ❤️ by '));
    const madeWithStrong = document.createElement('strong');
    madeWithStrong.textContent = 'Sales AMER Team';
    madeWith.appendChild(madeWithStrong);

    // Create a single row for feedback and links
    const footerRow = document.createElement('div');
    footerRow.className = 'footer-content-row';

    const feedbackText = document.createElement('span');
    feedbackText.className = 'footer-feedback-text';
    feedbackText.textContent = 'For feedback, reach out to:';

    const teamLinks = document.createElement('span');
    teamLinks.className = 'footer-team-links';

    // Team members with Slack links
    const team = [
      { name: 'Ashish Sharma', slack: 'https://salesforce.enterprise.slack.com/team/U01G1C1J3EJ' },
      { name: 'Sourav Pradhan', slack: 'https://salesforce.enterprise.slack.com/team/U061JUXGRV5' },
      { name: 'Ram Krishan', slack: 'https://salesforce.enterprise.slack.com/team/U05QYDW7UTW' },
      { name: 'Sriharsha Chagarlamudi', slack: 'https://salesforce.enterprise.slack.com/team/U03P4336EKZ' }
    ];

    team.forEach((member, index) => {
      const link = document.createElement('a');
      link.href = member.slack;
      link.textContent = '@' + member.name.toLowerCase().replace(' ', '');
      link.className = 'footer-slack-link';
      link.target = '_blank';
      link.title = 'Message ' + member.name + ' on Slack';

      teamLinks.appendChild(link);

      // Add separator except for last item
      if (index < team.length - 1) {
        const separator = document.createElement('span');
        separator.textContent = ' • ';
        separator.className = 'footer-separator';
        teamLinks.appendChild(separator);
      }
    });

    footerRow.appendChild(feedbackText);
    footerRow.appendChild(teamLinks);

    footer.appendChild(madeWith);
    footer.appendChild(footerRow);

    // Assemble panel
    detokenizerPanel.appendChild(header);
    detokenizerPanel.appendChild(content);
    detokenizerPanel.appendChild(footer);

    document.body.appendChild(detokenizerPanel);

    // Add event listeners
    closeBtn.addEventListener('click', hidePanel);
    detokenizeBtn.addEventListener('click', detokenizeValue);
    copyBtn.addEventListener('click', copyResult);
    themeToggle.addEventListener('click', togglePanelTheme);

    // Make panel draggable
    makeDraggable(detokenizerPanel);

    // Load saved theme
    chrome.storage.local.get(['panelTheme'], (result) => {
      const theme = result.panelTheme || 'light';
      detokenizerPanel.setAttribute('data-theme', theme);
      updateThemeIcon(theme);
    });

    // Load initial history
    refreshHistory();
  }

  // Handle text selection
  function handleTextSelection(event) {
    // Don't show button if we're currently detokenizing or clicked recently
    if (isDetokenizing || (Date.now() - lastClickTime < 1000)) {
      return;
    }

    const selectedText = window.getSelection().toString().trim();

    if (selectedText && selectedText.length > 0) {
      // Check if it looks like a token (adjust pattern as needed)
      if (isLikelyToken(selectedText)) {
        showQuickDetokenizeButton(event.pageX, event.pageY, selectedText);
      }
    }
  }

  // Check if text looks like a token
  function isLikelyToken(text) {
    // Common token patterns - adjusted for Salesforce GDPR tokens
    const tokenPatterns = [
      /^A-\d{6}-[A-Za-z0-9_-]{20,}$/,  // Salesforce GDPR format: A-YYMMDD-base64string
      /^[A-Za-z0-9+/=]{40,}$/,         // Long Base64-like strings (40+ chars)
      /^[0-9a-fA-F]{32,}$/,            // Hex strings (32+ chars)
      /tok_[A-Za-z0-9_-]+/,            // Token prefixes
      /^[A-Z0-9_-]{30,}$/              // Long uppercase alphanumeric with dashes/underscores
    ];

    return tokenPatterns.some(pattern => pattern.test(text));
  }

  // Refresh history list
  async function refreshHistory() {
    try {
      console.log('🔄 Refreshing history...');

      const result = await chrome.storage.local.get(['detokenHistory']);
      const history = result.detokenHistory || [];

      console.log('History entries found:', history.length);

      const historyList = document.getElementById('history-list');
      let emptyState = document.getElementById('history-empty-state');

      if (!historyList) {
        console.error('❌ History list element not found!');
        return;
      }

      // Clear existing items - remove all children
      while (historyList.firstChild) {
        historyList.removeChild(historyList.firstChild);
      }

      if (history.length === 0) {
        console.log('No history, showing empty state');

        // Recreate empty state if it doesn't exist
        if (!emptyState) {
          emptyState = document.createElement('div');
          emptyState.className = 'history-empty-state';
          emptyState.id = 'history-empty-state';
          emptyState.textContent = 'No history yet. Detokenize a value to see it here!';
        }

        emptyState.classList.remove('hidden');
        historyList.appendChild(emptyState);
        return;
      }

      console.log('Rendering', history.length, 'history items');

      // Sort by timestamp (newest first)
      history.sort((a, b) => b.timestamp - a.timestamp);

      // Hide empty state since we have items
      if (emptyState) {
        emptyState.classList.add('hidden');
      }

      // Add history items
      history.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';

        // Header with timestamp and delete
        const itemHeader = document.createElement('div');
        itemHeader.className = 'history-item-header';

        const timestamp = document.createElement('span');
        timestamp.className = 'history-timestamp';
        const date = new Date(entry.timestamp);
        timestamp.textContent = date.toLocaleString();

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-delete-btn-small';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete';
        deleteBtn.addEventListener('click', () => deleteHistoryEntry(index));

        itemHeader.appendChild(timestamp);
        itemHeader.appendChild(deleteBtn);

        // Token row
        const tokenRow = document.createElement('div');
        tokenRow.className = 'history-row';

        const tokenLabel = document.createElement('span');
        tokenLabel.className = 'history-label';
        tokenLabel.textContent = 'Token:';

        const tokenValue = document.createElement('span');
        tokenValue.className = 'history-token-value';
        tokenValue.textContent = truncateText(entry.token, 50);
        tokenValue.title = entry.token;

        const copyTokenBtn = document.createElement('button');
        copyTokenBtn.className = 'history-copy-btn';
        copyTokenBtn.textContent = '📋';
        copyTokenBtn.title = 'Copy token';
        copyTokenBtn.addEventListener('click', () => copyToClipboard(entry.token));

        tokenRow.appendChild(tokenLabel);
        tokenRow.appendChild(tokenValue);
        tokenRow.appendChild(copyTokenBtn);

        // Value row
        const valueRow = document.createElement('div');
        valueRow.className = 'history-row';

        const valueLabel = document.createElement('span');
        valueLabel.className = 'history-label';
        valueLabel.textContent = 'Value:';

        const valueValue = document.createElement('span');
        valueValue.className = 'history-value-text';
        valueValue.textContent = truncateText(entry.value, 50);
        valueValue.title = entry.value;

        const copyValueBtn = document.createElement('button');
        copyValueBtn.className = 'history-copy-btn';
        copyValueBtn.textContent = '📋';
        copyValueBtn.title = 'Copy value';
        copyValueBtn.addEventListener('click', () => copyToClipboard(entry.value));

        valueRow.appendChild(valueLabel);
        valueRow.appendChild(valueValue);
        valueRow.appendChild(copyValueBtn);

        // Assemble item
        item.appendChild(itemHeader);
        item.appendChild(tokenRow);
        item.appendChild(valueRow);

        historyList.appendChild(item);
      });

      console.log('✅ History rendered successfully');

    } catch (error) {
      console.error('❌ Error loading history:', error);
    }
  }

  // Delete history entry
  async function deleteHistoryEntry(index) {
    try {
      const result = await chrome.storage.local.get(['detokenHistory']);
      const history = result.detokenHistory || [];

      // Sort to match display order
      history.sort((a, b) => b.timestamp - a.timestamp);

      // Remove entry
      history.splice(index, 1);

      await chrome.storage.local.set({ detokenHistory: history });
      refreshHistory();

      showNotificationMessage('Entry deleted', 'info');
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }

  // Clear all history
  async function clearHistory() {
    if (!confirm('Are you sure you want to clear all detokenization history?')) {
      return;
    }

    try {
      await chrome.storage.local.set({ detokenHistory: [] });
      refreshHistory();
      showNotificationMessage('History cleared', 'info');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  // Copy to clipboard helper
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showNotificationMessage('Copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }

  // Truncate text helper
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Show notification message (shorter version)
  function showNotificationMessage(message, type) {
    const notification = showNotification(message, type);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Save to history
  async function saveToHistory(token, value) {
    try {
      console.log('💾 Saving to history:', token.substring(0, 20) + '...', '→', value.substring(0, 30) + '...');

      const result = await chrome.storage.local.get(['detokenHistory']);
      let history = result.detokenHistory || [];

      console.log('Current history length:', history.length);

      // Check if already exists (avoid duplicates)
      const existingIndex = history.findIndex(entry => entry.token === token);
      if (existingIndex !== -1) {
        // Update timestamp and value
        console.log('Updating existing entry at index:', existingIndex);
        history[existingIndex].value = value;
        history[existingIndex].timestamp = Date.now();
      } else {
        // Add new entry
        console.log('Adding new entry to history');
        history.push({
          token: token,
          value: value,
          timestamp: Date.now()
        });
      }

      // Keep only last 100 entries
      if (history.length > 100) {
        history.sort((a, b) => b.timestamp - a.timestamp);
        history = history.slice(0, 100);
      }

      await chrome.storage.local.set({ detokenHistory: history });
      console.log('✅ History saved! New length:', history.length);
    } catch (error) {
      console.error('❌ Error saving to history:', error);
    }
  }

  // Quick detokenize without showing panel (runs in background, no visible tab switches)
  async function quickDetokenize(token) {
    console.log('=== QUICK DETOKENIZE FUNCTION ===');
    console.log('Token:', token.substring(0, 30) + '...');
    console.log('Token length:', token.length);

    // Show a compact loading notification
    const notification = showNotification('🔓 Detokenizing... (Check background tab if you need to login)', 'loading');
    console.log('✅ Notification shown');

    try {
      console.log('📤 Sending message to background script...');

      // Send message to background script (tab opens hidden, processes, and closes automatically)
      const messagePromise = chrome.runtime.sendMessage({
        action: 'detokenize',
        token: token
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 3 minutes. If you needed to login, please try again.')), 180000);
      });

      console.log('⏳ Waiting for response...');
      const response = await Promise.race([messagePromise, timeoutPromise]);
      console.log('📥 Response received:', response);

      if (!response) {
        throw new Error('No response from background script');
      }

      if (response.success) {
        console.log('✅ SUCCESS! Detokenized value:', response.detokenizedValue);

        // Save to history and refresh
        console.log('💾 About to save to history from quick detokenize');
        await saveToHistory(token, response.detokenizedValue);

        // Always refresh history (so it's ready when panel opens)
        console.log('🔄 Refreshing history after quick detokenize');
        await refreshHistory();

        // Show result in notification with cache indicator
        const prefix = response.fromCache ? '⚡ ' : '✅ ';
        updateNotification(notification, `${prefix}${response.detokenizedValue}`, 'success', true);
      } else {
        console.error('❌ FAILED:', response.error);
        const errorMsg = response.error || 'Failed to detokenize value';
        updateNotification(notification, `❌ ${errorMsg}`, 'error');
      }
    } catch (error) {
      console.error('❌ Quick detokenization error:', error);
      updateNotification(notification, `❌ Error: ${error.message}`, 'error');
    }
  }

  // Show a floating notification
  function showNotification(message, type = 'info', autoHideMs = null) {
    const notification = document.createElement('div');
    notification.className = `detokenizer-notification detokenizer-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto-hide for loading notifications as a safety net (3 minutes max)
    if (type === 'loading' && !autoHideMs) {
      autoHideMs = 180000; // 3 minutes timeout
    }

    // Auto-hide if specified
    if (autoHideMs) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.classList.remove('show');
          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove();
            }
          }, 300);
        }
      }, autoHideMs);
    }

    return notification;
  }

  // Update notification content
  function updateNotification(notification, message, type = 'info', copyable = false) {
    // Ensure notification still exists in DOM
    if (!notification || !notification.parentNode) {
      console.log('⚠️ Notification already removed, cannot update');
      return;
    }

    notification.className = `detokenizer-notification detokenizer-notification-${type} show`;
    notification.textContent = message;

    if (copyable) {
      notification.style.cursor = 'pointer';
      notification.title = 'Click to copy';

      notification.addEventListener('click', () => {
        const textToCopy = message.replace(/^✅\s*/, '').replace(/^⚡\s*/, ''); // Remove emojis
        navigator.clipboard.writeText(textToCopy).then(() => {
          notification.textContent = '✅ Copied to clipboard!';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.classList.remove('show');
              setTimeout(() => {
                if (notification.parentNode) {
                  notification.remove();
                }
              }, 300);
            }
          }, 1500);
        });
      });
    }

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 10000);
  }

  // Show quick detokenize button near selection
  function showQuickDetokenizeButton(x, y, text) {
    // Clear any existing timeout
    if (buttonTimeout) {
      clearTimeout(buttonTimeout);
      buttonTimeout = null;
    }

    // Remove existing button if any
    const existingBtn = document.getElementById('quick-detokenize-btn');
    if (existingBtn) {
      existingBtn.remove();
    }

    const btn = document.createElement('button');
    btn.id = 'quick-detokenize-btn';
    btn.className = 'quick-detokenize-btn';
    btn.textContent = '🔓 Detokenize';

    document.body.appendChild(btn);

    // Use fixed positioning relative to viewport to prevent scrolling issues
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate initial position
    let left = x - scrollX;
    let top = y - scrollY + 20;

    // Get button dimensions (need to append first to measure)
    const btnRect = btn.getBoundingClientRect();
    const btnWidth = btnRect.width || 120; // fallback if not measured yet
    const btnHeight = btnRect.height || 40;

    // Adjust horizontal position if button goes off screen
    if (left + btnWidth > viewportWidth) {
      // Position to the left of the cursor instead
      left = viewportWidth - btnWidth - 10; // 10px margin from edge
    }

    // Adjust vertical position if button goes off screen
    if (top + btnHeight > viewportHeight) {
      // Position above the selection instead of below
      top = y - scrollY - btnHeight - 10;
    }

    // Ensure button doesn't go off left edge
    if (left < 10) {
      left = 10;
    }

    // Ensure button doesn't go off top edge
    if (top < 10) {
      top = 10;
    }

    btn.style.position = 'fixed';
    btn.style.left = `${left}px`;
    btn.style.top = `${top}px`;
    btn.style.zIndex = '2147483647';

    // Flag to prevent double clicks
    let hasBeenClicked = false;

    // Store the token value in the button dataset for debugging
    btn.dataset.token = text;

    // Handle click with multiple event types for better compatibility
    const handleClick = async (e) => {
      console.log('=== BUTTON CLICK EVENT ===');
      console.log('Event type:', e.type);
      console.log('Token:', text.substring(0, 30) + '...');

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Prevent double clicks
      if (hasBeenClicked) {
        console.log('⚠️ Button already clicked, ignoring duplicate click');
        return;
      }

      hasBeenClicked = true;
      lastClickTime = Date.now();

      console.log('✅ Processing click - Token length:', text.length);

      // Visual feedback - change button appearance immediately
      btn.style.opacity = '0.5';
      btn.textContent = '⏳ Processing...';
      btn.style.pointerEvents = 'none';

      // Wait a tiny bit to show the visual change
      await new Promise(resolve => setTimeout(resolve, 100));

      // Remove button
      if (btn.parentNode) {
        btn.remove();
        console.log('✅ Button removed from DOM');
      }

      // Clear the timeout
      if (buttonTimeout) {
        clearTimeout(buttonTimeout);
        buttonTimeout = null;
      }

      // Clear any text selection to prevent re-triggering
      try {
        window.getSelection().removeAllRanges();
        console.log('✅ Text selection cleared');
      } catch (e) {
        console.log('⚠️ Could not clear selection:', e);
      }

      // Start detokenization in the background
      console.log('🚀 Starting detokenization...');
      isDetokenizing = true;
      try {
        await quickDetokenize(text);
        console.log('✅ Detokenization complete');
      } catch (error) {
        console.error('❌ Detokenization failed:', error);
      } finally {
        isDetokenizing = false;
      }
    };

    // Add both click and mouseup handlers for better compatibility
    btn.addEventListener('click', handleClick, { capture: true });
    btn.addEventListener('mouseup', handleClick, { capture: true });

    // Prevent mousedown from propagating (prevents selection changes)
    btn.addEventListener('mousedown', (e) => {
      console.log('Button mousedown event');
      e.preventDefault();
      e.stopPropagation();
    }, { capture: true });

    // Button already appended earlier to measure dimensions

    // Remove button after 5 seconds if not clicked
    buttonTimeout = setTimeout(() => {
      if (btn.parentNode) {
        btn.remove();
      }
      buttonTimeout = null;
    }, 5000);

    // Remove button on click anywhere else
    const removeOnOutsideClick = (e) => {
      if (e.target !== btn && btn.parentNode) {
        btn.remove();
        if (buttonTimeout) {
          clearTimeout(buttonTimeout);
          buttonTimeout = null;
        }
        document.removeEventListener('mousedown', removeOnOutsideClick, true);
      }
    };

    // Add listener on next tick to avoid immediate trigger
    setTimeout(() => {
      document.addEventListener('mousedown', removeOnOutsideClick, true);
    }, 100);
  }

  // Show the detokenizer panel
  function showPanel() {
    detokenizerPanel.classList.remove('hidden');
    document.getElementById('token-input').focus();
    refreshHistory();
  }

  // Hide the detokenizer panel
  function hidePanel() {
    detokenizerPanel.classList.add('hidden');
    resetPanel();
  }

  // Reset panel state
  function resetPanel() {
    document.querySelector('.detokenizer-result-section').classList.add('hidden');
    document.querySelector('.detokenizer-loading').classList.add('hidden');
    document.querySelector('.detokenizer-error').classList.add('hidden');
  }

  // Detokenize value using BlackTab
  async function detokenizeValue() {
    const tokenInput = document.getElementById('token-input').value.trim();

    if (!tokenInput) {
      showError('Please paste a token in the input field first');
      return;
    }

    // Validate token is not an error message
    if (tokenInput.toLowerCase().includes('invalid argument') ||
        tokenInput.toLowerCase().includes('empty token') ||
        tokenInput.toLowerCase().includes('no action will be taken') ||
        tokenInput.toLowerCase().includes('error:') ||
        tokenInput.toLowerCase().includes('insufficient privileges')) {
      showError('Invalid token format. Please provide a valid tokenized value.');
      return;
    }

    console.log('Starting detokenization for token:', tokenInput.substring(0, 10) + '...');

    resetPanel();
    document.querySelector('.detokenizer-loading').classList.remove('hidden');
    isDetokenizing = true;

    try {
      // Send message to background script to handle the detokenization
      console.log('Sending message to background script...');

      // Add timeout to prevent hanging
      const messagePromise = chrome.runtime.sendMessage({
        action: 'detokenize',
        token: tokenInput
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 3 minutes. If you needed to login, please try again.')), 180000);
      });

      const response = await Promise.race([messagePromise, timeoutPromise]);

      console.log('Received response:', response);

      if (!response) {
        throw new Error('No response from background script. Check if background worker is running (chrome://extensions/ → Service Worker)');
      }

      if (response.success) {
        showResult(response.detokenizedValue);

        // Save to history and refresh
        const tokenValue = document.getElementById('token-input').value.trim();
        console.log('💾 About to save to history from manual detokenize');
        await saveToHistory(tokenValue, response.detokenizedValue);
        console.log('🔄 About to refresh history display');
        await refreshHistory();
        console.log('✅ History refreshed');
      } else {
        const errorMsg = response.error || 'Failed to detokenize value. Check browser console for details.';
        showError(errorMsg);

        // Also log to console for debugging
        console.error('Detokenization failed:', response);
      }
    } catch (error) {
      console.error('Detokenization error:', error);

      if (error.message.includes('Could not establish connection')) {
        showError('Background script not responding. Try reloading the extension at chrome://extensions/');
      } else {
        showError(`Error: ${error.message}. Check browser console (F12) for details.`);
      }
    } finally {
      isDetokenizing = false;
      document.querySelector('.detokenizer-loading').classList.add('hidden');
    }
  }

  // Show detokenized result
  function showResult(value) {
    document.querySelector('.detokenizer-result-section').classList.remove('hidden');
    document.getElementById('detokenized-value').textContent = value;
  }

  // Show error message
  function showError(message) {
    document.querySelector('.detokenizer-error').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
  }

  // Show info message (for manual mode)
  function showInfo(message) {
    // Reuse result section for info
    document.querySelector('.detokenizer-result-section').classList.remove('hidden');
    const resultDiv = document.getElementById('detokenized-value');
    resultDiv.textContent = message;
    resultDiv.style.background = '#e8f4fd';
    resultDiv.style.color = '#0066cc';
    resultDiv.style.border = '1px solid #0066cc';
  }

  // Copy result to clipboard
  function copyResult() {
    const value = document.getElementById('detokenized-value').textContent;
    navigator.clipboard.writeText(value).then(() => {
      const btn = document.getElementById('copy-result');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    });
  }

  // Make panel draggable
  function makeDraggable(element) {
    const header = element.querySelector('.detokenizer-header');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;

    // Only drag when clicking on the title or empty header space
    header.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
      // Don't drag if clicking on buttons
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      isDragging = true;

      // Disable transitions during drag
      element.style.transition = 'none';

      // Get initial mouse position
      pos3 = e.clientX;
      pos4 = e.clientY;

      document.addEventListener('mouseup', closeDragElement);
      document.addEventListener('mousemove', elementDrag);

      // Change cursor
      document.body.style.cursor = 'grabbing';
      header.style.cursor = 'grabbing';
    }

    function elementDrag(e) {
      if (!isDragging) return;

      e.preventDefault();
      e.stopPropagation();

      // Calculate new position
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      // Set new position
      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;

      element.style.top = newTop + "px";
      element.style.left = newLeft + "px";
      element.style.right = 'auto'; // Remove right positioning
      element.style.transform = 'none'; // Remove any transforms
    }

    function closeDragElement() {
      if (!isDragging) return;

      isDragging = false;

      // Re-enable transitions
      element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

      // Restore cursor
      document.body.style.cursor = '';
      header.style.cursor = 'move';

      document.removeEventListener('mouseup', closeDragElement);
      document.removeEventListener('mousemove', elementDrag);
    }
  }

  // Handle messages from background script
  function handleMessage(request, sender, sendResponse) {
    if (request.action === 'openPanel') {
      showPanel();
      if (request.token) {
        document.getElementById('token-input').value = request.token;
      }
    } else if (request.action === 'showNotification') {
      const notification = showNotification(request.message, request.type || 'info');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    } else if (request.action === 'setAutoDetokenize') {
      autoDetokenizeEnabled = request.enabled;
      if (request.enabled) {
        startAutoDetokenize();
      } else {
        stopAutoDetokenize();
      }
    }
    return false;
  }

  // Toggle panel theme
  function togglePanelTheme() {
    const currentTheme = detokenizerPanel.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    detokenizerPanel.setAttribute('data-theme', newTheme);
    updateThemeIcon(newTheme);

    // Save theme preference
    chrome.storage.local.set({ panelTheme: newTheme });
  }

  function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
    }
  }

  // Initialize hover detection for tokens
  function initHoverDetection() {
    console.log('🔍 Initializing hover detection for token pattern: A-[^`\\s]+');

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleTooltipClick);
  }

  // Check if token already displayed in detokenizer panel
  function isTokenAlreadyDisplayed(token) {
    if (!detokenizerPanel || detokenizerPanel.classList.contains('hidden')) {
      return false;
    }

    // Check if panel has result section visible
    const resultSection = detokenizerPanel.querySelector('.detokenizer-result-section');
    if (!resultSection || resultSection.classList.contains('hidden')) {
      return false;
    }

    // Check if input field contains this token
    const tokenInput = document.getElementById('token-input');
    if (tokenInput && tokenInput.value.includes(token)) {
      return true;
    }

    return false;
  }

  // Handle mouse movement to detect tokens
  function handleMouseMove(e) {
    // Mark that mouse has moved (ignore tooltips on initial page load)
    if (!hasMouseMovedSincePageLoad) {
      hasMouseMovedSincePageLoad = true;
      return; // Skip first movement to avoid showing tooltip for static mouse position
    }

    // Check if hovering over tooltip
    if (e.target.closest('.detokenizer-tooltip')) {
      isHoveringTooltip = true;
      isHoveringToken = false;  // Not over token text, just the tooltip
      clearTooltipHideTimeout();
      return;
    } else {
      isHoveringTooltip = false;
    }

    // Skip if hovering over other UI elements (including detokenized values block)
    if (e.target.closest('.detokenizer-panel, .detokenizer-notification, .detokenized-values-block')) {
      isHoveringToken = false;
      scheduleTooltipHide();
      return;
    }

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) {
      isHoveringToken = false;
      scheduleTooltipHide();
      return;
    }

    // Double-check: skip if element is inside panel or detokenized block (safety check)
    if (element.closest('.detokenizer-panel, .detokenized-values-block')) {
      isHoveringToken = false;
      scheduleTooltipHide();
      return;
    }

    // Find parent .raw-event container (this has full textContent with backtick delimiters)
    const rawEventContainer = element.closest('.raw-event') || element.closest('td.event');
    const searchRoot = rawEventContainer || element;
    const fullText = searchRoot.textContent || '';
    const hoveredText = (element.textContent || '').trim();

    // Find a token whose value contains the hovered element's text fragment.
    // With backtick delimiters the full token is always in group 1 of the match.
    let foundToken = null;
    let isActuallyOverToken = false;
    for (const match of fullText.matchAll(TOKEN_PATTERN)) {
      const token = tokenFromMatch(match); // group 1 — the actual token string
      if (hoveredText.length > 0 && token.includes(hoveredText)) {
        foundToken = token;
        isActuallyOverToken = true;
        break;
      }
    }

    // Only mark as hovering if we found a token AND the mouse is over token text
    if (foundToken && isActuallyOverToken) {
      // Check if token already displayed in panel
      if (isTokenAlreadyDisplayed(foundToken)) {
        isHoveringToken = false;
        clearTooltipShowTimeout();
        scheduleTooltipHide();
        return;
      }

      isHoveringToken = true;
      clearTooltipHideTimeout();

      // If it's a different token, schedule showing it after delay
      if (foundToken !== currentHoveredToken && foundToken !== pendingToken) {
        clearTooltipShowTimeout();
        // Use viewport coordinates directly for fixed positioning
        scheduleTooltipShow(foundToken, e.clientX, e.clientY, searchRoot);
      }
      // If tooltip already showing for this token, keep it visible
      else if (foundToken === currentHoveredToken) {
        clearTooltipShowTimeout();
      }
    } else {
      // Not over token text anymore
      isHoveringToken = false;
      clearTooltipShowTimeout();
      scheduleTooltipHide();
    }
  }

  // Show tooltip when hovering over a token
  function showHoverTooltip(token, x, y, tokenElement) {
    // Don't show new tooltip if actively detokenizing
    if (isTooltipDetokenizing) {
      return;
    }

    // If showing a different token, remove old tooltip and create new one
    if (hoverTooltip && currentHoveredToken !== token) {
      hoverTooltip.remove();
      hoverTooltip = null;
      currentHoveredToken = null;
      currentTokenElement = null;
    }

    // If tooltip already exists for same token, just return (don't recreate)
    if (hoverTooltip && currentHoveredToken === token) {
      return;
    }

    // Update current token and its container element
    currentHoveredToken = token;
    currentTokenElement = tokenElement;

    // Create tooltip
    hoverTooltip = document.createElement('div');
    hoverTooltip.className = 'detokenizer-tooltip';
    hoverTooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-header">
          <span class="tooltip-icon">🔓</span>
          <span class="tooltip-title">Tokenized Value Detected</span>
          <button class="tooltip-close-btn">✕</button>
        </div>
        <div class="tooltip-token">${escapeHtml(token)}</div>
        <button class="tooltip-detokenize-btn">Click to Detokenize</button>
      </div>
    `;

    // Append to body first to measure dimensions
    document.body.appendChild(hoverTooltip);

    // Position tooltip near mouse with boundary checking
    // Using absolute positioning, so work with page coordinates (x, y are clientX, clientY)
    const tooltipRect = hoverTooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Calculate initial position (offset from cursor in page coordinates)
    let left = x + scrollX + 15;
    let top = y + scrollY + 15;

    // Calculate position relative to viewport for boundary checking
    let viewportLeft = x + 15;
    let viewportTop = y + 15;

    // Adjust horizontal position if tooltip goes off right edge of viewport
    if (viewportLeft + tooltipWidth > viewportWidth - 10) {
      // Try positioning to the left of cursor
      viewportLeft = x - tooltipWidth - 15;
      left = viewportLeft + scrollX;
      // If still off screen, clamp to right edge
      if (viewportLeft < 10) {
        viewportLeft = viewportWidth - tooltipWidth - 10;
        left = viewportLeft + scrollX;
      }
    }

    // Adjust vertical position if tooltip goes off bottom edge of viewport
    if (viewportTop + tooltipHeight > viewportHeight - 10) {
      // Try positioning above cursor
      viewportTop = y - tooltipHeight - 15;
      top = viewportTop + scrollY;
      // If still off screen, clamp to bottom edge
      if (viewportTop < 10) {
        viewportTop = viewportHeight - tooltipHeight - 10;
        top = viewportTop + scrollY;
      }
    }

    // Final safety checks - ensure tooltip is fully visible in viewport
    viewportLeft = Math.max(10, Math.min(viewportLeft, viewportWidth - tooltipWidth - 10));
    viewportTop = Math.max(10, Math.min(viewportTop, viewportHeight - tooltipHeight - 10));
    left = viewportLeft + scrollX;
    top = viewportTop + scrollY;

    hoverTooltip.style.position = 'absolute';
    hoverTooltip.style.left = left + 'px';
    hoverTooltip.style.top = top + 'px';

    // Add click handler for detokenize button
    const btn = hoverTooltip.querySelector('.tooltip-detokenize-btn');
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();

      // Mark as actively detokenizing
      isTooltipDetokenizing = true;

      // Hide tooltip immediately
      hideHoverTooltip();

      // Create or find the detokenized block with loading state
      const rowContainer = tokenElement.closest('.raw-event') || tokenElement.closest('td.event');
      if (!rowContainer) {
        console.log('⚠️  Could not find row container');
        isTooltipDetokenizing = false;
        return;
      }

      let detokenizedBlock = rowContainer.querySelector('.detokenized-values-block');
      if (!detokenizedBlock) {
        // Create new block with loading state
        detokenizedBlock = document.createElement('div');
        detokenizedBlock.className = 'detokenized-values-block';
        detokenizedBlock.innerHTML = `
          <div class="detokenized-block-header">
            <span class="detokenized-block-icon">🔓</span>
            <span class="detokenized-block-label">Detokenized Values:</span>
            <button class="detokenized-block-close" title="Close">✕</button>
          </div>
          <div class="detokenized-values-list"></div>
        `;

        const closeBtn = detokenizedBlock.querySelector('.detokenized-block-close');
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          detokenizedBlock.remove();
        });

        rowContainer.appendChild(detokenizedBlock);
      }

      const valuesList = detokenizedBlock.querySelector('.detokenized-values-list');

      // Add loading entry
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'detokenized-value-entry detokenized-loading-entry';
      loadingDiv.setAttribute('data-token', escapeHtml(token));
      loadingDiv.innerHTML = `
        <div class="detokenized-pair">
          <div class="detokenized-pair-row">
            <span class="detokenized-label">Original:</span>
            <span class="detokenized-original-value">${escapeHtml(token)}</span>
          </div>
          <div class="detokenized-pair-row">
            <span class="detokenized-label">Detokenized:</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
              <span style="color: #718096; font-size: 13px;">Loading...</span>
            </div>
          </div>
        </div>
      `;

      valuesList.appendChild(loadingDiv);

      // Start detokenization
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'detokenize',
          token: token
        });

        if (!response) {
          throw new Error('No response from background script');
        }

        if (response.success) {
          console.log('✅ SUCCESS! Detokenized value:', response.detokenizedValue);

          // Save to history
          await saveToHistory(token, response.detokenizedValue);
          await refreshHistory();

          // Replace loading entry with result
          loadingDiv.className = 'detokenized-value-entry';
          loadingDiv.innerHTML = `
            <div class="detokenized-pair">
              <div class="detokenized-pair-row">
                <span class="detokenized-label">Original:</span>
                <span class="detokenized-original-value">${escapeHtml(token)}</span>
                <button class="detokenized-copy-btn" data-value="${escapeHtml(token)}" title="Copy original">📋</button>
              </div>
              <div class="detokenized-pair-row">
                <span class="detokenized-label">Detokenized:</span>
                <span class="detokenized-result-value">${escapeHtml(response.detokenizedValue)}</span>
                <button class="detokenized-copy-btn" data-value="${escapeHtml(response.detokenizedValue)}" title="Copy detokenized">📋</button>
              </div>
            </div>
          `;

          // Add copy button handlers
          const copyButtons = loadingDiv.querySelectorAll('.detokenized-copy-btn');
          copyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              const valueToCopy = btn.getAttribute('data-value');
              copyToClipboard(valueToCopy);
            });
          });

          // Mark detokenization complete
          isTooltipDetokenizing = false;
        } else {
          console.error('❌ FAILED:', response.error);
          const errorMsg = response.error || 'Failed to detokenize value';

          // Replace loading entry with error
          loadingDiv.className = 'detokenized-value-entry detokenized-error-entry';
          loadingDiv.innerHTML = `
            <div class="detokenized-pair">
              <div class="detokenized-pair-row">
                <span class="detokenized-label">Original:</span>
                <span class="detokenized-original-value">${escapeHtml(token)}</span>
              </div>
              <div class="detokenized-pair-row">
                <span class="detokenized-label">Error:</span>
                <span style="color: #f56565; font-size: 13px;">${escapeHtml(errorMsg)}</span>
                <button class="detokenized-retry-btn" title="Retry">🔄</button>
              </div>
            </div>
          `;

          // Add retry button handler
          const retryBtn = loadingDiv.querySelector('.detokenized-retry-btn');
          retryBtn.addEventListener('click', () => {
            loadingDiv.remove();
            isTooltipDetokenizing = false;
            // Trigger hover tooltip again
            showHoverTooltip(token, 0, 0, tokenElement);
          });

          // Mark detokenization complete
          isTooltipDetokenizing = false;
        }
      } catch (error) {
        console.error('❌ Detokenization error:', error);

        // Replace loading entry with error
        loadingDiv.className = 'detokenized-value-entry detokenized-error-entry';
        loadingDiv.innerHTML = `
          <div class="detokenized-pair">
            <div class="detokenized-pair-row">
              <span class="detokenized-label">Original:</span>
              <span class="detokenized-original-value">${escapeHtml(token)}</span>
            </div>
            <div class="detokenized-pair-row">
              <span class="detokenized-label">Error:</span>
              <span style="color: #f56565; font-size: 13px;">${escapeHtml(error.message)}</span>
              <button class="detokenized-retry-btn" title="Retry">🔄</button>
            </div>
          </div>
        `;

        // Add retry button handler
        const retryBtn = loadingDiv.querySelector('.detokenized-retry-btn');
        retryBtn.addEventListener('click', () => {
          loadingDiv.remove();
          isTooltipDetokenizing = false;
          // Trigger hover tooltip again
          showHoverTooltip(token, 0, 0, tokenElement);
        });

        // Mark detokenization complete
        isTooltipDetokenizing = false;
      }
    });

    // Add click handler for close button
    const closeBtn = hoverTooltip.querySelector('.tooltip-close-btn');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideHoverTooltip();
    });

    // Track mouse enter/leave on tooltip
    hoverTooltip.addEventListener('mouseenter', () => {
      isHoveringTooltip = true;
      clearTooltipHideTimeout();
    });

    hoverTooltip.addEventListener('mouseleave', () => {
      isHoveringTooltip = false;
      scheduleTooltipHide();
    });
  }

  // Helper to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Clear tooltip hide timeout
  function clearTooltipHideTimeout() {
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
      tooltipHideTimeout = null;
    }
  }

  // Clear tooltip show timeout
  function clearTooltipShowTimeout() {
    if (tooltipShowTimeout) {
      clearTimeout(tooltipShowTimeout);
      tooltipShowTimeout = null;
    }
    pendingToken = null;
  }

  // Schedule tooltip to show after delay
  function scheduleTooltipShow(token, x, y, tokenElement) {
    // Don't schedule new tooltip if actively detokenizing
    if (isTooltipDetokenizing) {
      return;
    }
    
    clearTooltipShowTimeout();
    pendingToken = token;
    tooltipShowTimeout = setTimeout(() => {
      if (pendingToken === token && isHoveringToken && !isTooltipDetokenizing) {
        showHoverTooltip(token, x, y, tokenElement);
      }
      tooltipShowTimeout = null;
      pendingToken = null;
    }, TOOLTIP_SHOW_DELAY);
  }

  // Schedule tooltip to hide after delay
  function scheduleTooltipHide() {
    clearTooltipHideTimeout();
    tooltipHideTimeout = setTimeout(() => {
      if (!isHoveringTooltip && !isHoveringToken && !isTooltipDetokenizing) {
        hideHoverTooltip();
      }
    }, TOOLTIP_HIDE_DELAY);
  }

  // Hide hover tooltip
  function hideHoverTooltip() {
    clearTooltipHideTimeout();
    clearTooltipShowTimeout();
    if (hoverTooltip) {
      hoverTooltip.remove();
      hoverTooltip = null;
      currentHoveredToken = null;
    }
    isHoveringTooltip = false;
    isHoveringToken = false;
    isTooltipDetokenizing = false;
  }

  // Handle clicks on tooltips
  function handleTooltipClick(e) {
    if (!e.target.closest('.detokenizer-tooltip')) {
      hideHoverTooltip();
    }
  }

  // Quick detokenize and append to Splunk row
  async function quickDetokenizeAndAppend(token, tokenElement) {
    console.log('=== QUICK DETOKENIZE AND APPEND ===');
    console.log('Token:', token.substring(0, 30) + '...');
    console.log('Token element:', tokenElement);

    // Show a compact loading notification
    const notification = showNotification('🔓 Detokenizing...', 'loading', 10000);

    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'detokenize',
        token: token
      });

      if (!response) {
        throw new Error('No response from background script');
      }

      if (response.success) {
        console.log('✅ SUCCESS! Detokenized value:', response.detokenizedValue);

        // Save to history
        await saveToHistory(token, response.detokenizedValue);
        await refreshHistory();

        // Append detokenized value to Splunk row
        appendDetokenizedValue(token, response.detokenizedValue, tokenElement);

        // Update notification
        const prefix = response.fromCache ? '⚡ ' : '✅ ';
        updateNotification(notification, `${prefix}Detokenized and appended`, 'success');
      } else {
        console.error('❌ FAILED:', response.error);
        const errorMsg = response.error || 'Failed to detokenize value';
        updateNotification(notification, `❌ ${errorMsg}`, 'error');
      }
    } catch (error) {
      console.error('❌ Detokenization error:', error);
      updateNotification(notification, `❌ Error: ${error.message}`, 'error');
    }
  }

  // Append detokenized value to Splunk row block
  function appendDetokenizedValue(token, detokenizedValue, tokenElement) {
    console.log('📌 Appending detokenized value to row');

    // Find the parent row container (raw-event or td.event)
    const rowContainer = tokenElement.closest('.raw-event') || tokenElement.closest('td.event');

    if (!rowContainer) {
      console.log('⚠️  Could not find row container');
      return;
    }

    // Find or create the detokenized block for this row
    let detokenizedBlock = rowContainer.querySelector('.detokenized-values-block');

    if (!detokenizedBlock) {
      // Create new block
      detokenizedBlock = document.createElement('div');
      detokenizedBlock.className = 'detokenized-values-block';
      detokenizedBlock.innerHTML = `
        <div class="detokenized-block-header">
          <span class="detokenized-block-icon">🔓</span>
          <span class="detokenized-block-label">Detokenized Values:</span>
          <button class="detokenized-block-close" title="Close">✕</button>
        </div>
        <div class="detokenized-values-list"></div>
      `;

      // Add close button handler
      const closeBtn = detokenizedBlock.querySelector('.detokenized-block-close');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        detokenizedBlock.remove();
      });

      // Append to row container
      rowContainer.appendChild(detokenizedBlock);
      console.log('✅ Created new detokenized values block');
    }

    const valuesList = detokenizedBlock.querySelector('.detokenized-values-list');

    // Check if this token already exists in the list
    const existingEntry = valuesList.querySelector(`[data-token="${escapeHtml(token)}"]`);

    if (existingEntry) {
      console.log('⚠️  Token already in list, updating value...');
      existingEntry.querySelector('.detokenized-result-value').textContent = detokenizedValue;
      return;
    }

    // Create new token entry
    const entryDiv = document.createElement('div');
    entryDiv.className = 'detokenized-value-entry';
    entryDiv.setAttribute('data-token', escapeHtml(token));
    entryDiv.innerHTML = `
      <div class="detokenized-pair">
        <div class="detokenized-pair-row">
          <span class="detokenized-label">Original:</span>
          <span class="detokenized-original-value">${escapeHtml(token)}</span>
          <button class="detokenized-copy-btn" data-value="${escapeHtml(token)}" title="Copy original">📋</button>
        </div>
        <div class="detokenized-pair-row">
          <span class="detokenized-label">Detokenized:</span>
          <span class="detokenized-result-value">${escapeHtml(detokenizedValue)}</span>
          <button class="detokenized-copy-btn" data-value="${escapeHtml(detokenizedValue)}" title="Copy detokenized">📋</button>
        </div>
      </div>
    `;

    // Add copy button handlers
    const copyButtons = entryDiv.querySelectorAll('.detokenized-copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const valueToCopy = btn.getAttribute('data-value');
        copyToClipboard(valueToCopy);
      });
    });

    // Append to values list
    valuesList.appendChild(entryDiv);

    console.log('✅ Detokenized value entry added to block');
  }

  // ── Auto-Detokenize ────────────────────────────────────────────────────────

  let autoDetokenizeEnabled = false;
  const autoProcessed = new Set();
  const autoQueue = [];
  let autoRunning = false;
  let autoObserver = null;

  chrome.storage.local.get(['autoDetokenize'], (result) => {
    if (result.autoDetokenize) {
      autoDetokenizeEnabled = true;
      startAutoDetokenize();
    }
  });

  function startAutoDetokenize() {
    if (autoObserver) return; // already running
    autoProcessed.clear();
    autoQueue.length = 0;
    console.log('🔄 Auto-detokenize started, scanning page...');
    scanAndQueueTokens(document.body);
    console.log('🔍 Scan complete. Queue length:', autoQueue.length);
    autoObserver = new MutationObserver((mutations) => {
      if (!autoDetokenizeEnabled) return;
      let hasNew = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scanAndQueueTokens(node);
            hasNew = true;
          }
        }
      }
      if (hasNew) drainQueue();
    });
    autoObserver.observe(document.body, { childList: true, subtree: true });
    drainQueue();
  }

  function stopAutoDetokenize() {
    if (autoObserver) {
      autoObserver.disconnect();
      autoObserver = null;
    }
    autoQueue.length = 0;
  }

  // Scan in reverse document order (deepest elements first) to find the tightest
  // container whose textContent has the full token. Mark ancestors so they are skipped.
  // Include root itself so MutationObserver-added .raw-event nodes are not missed.
  function scanAndQueueTokens(root) {
    const SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'];
    const descendants = root.querySelectorAll ? [...root.querySelectorAll('*')] : [];
    const all = [...descendants.reverse(), root]; // deepest children first, then root itself
    for (const el of all) {
      if (SKIP_TAGS.includes(el.tagName)) continue;
      if (el.closest('.detokenizer-panel, .detokenizer-notification, .detokenized-values-block, .detokenizer-tooltip')) continue;
      if (el.classList && (el.classList.contains('tooltip-token') || el.classList.contains('detokenizer-tooltip'))) continue;
      if (autoProcessed.has(el)) continue;
      TOKEN_PATTERN.lastIndex = 0;
      if (!TOKEN_PATTERN.test(el.textContent || '')) continue;
      // This is the deepest element containing the full token — queue it
      console.log('📌 Queued:', el.tagName, el.className.toString().substring(0, 40), '| text:', (el.textContent || '').substring(0, 60));
      autoProcessed.add(el);
      autoQueue.push(el);
      // Mark all ancestors so they don't get queued as well
      let parent = el.parentElement;
      while (parent) { autoProcessed.add(parent); parent = parent.parentElement; }
    }
  }

  async function drainQueue() {
    if (autoRunning) return;
    autoRunning = true;

    // Collect ALL pending elements and their token/placeholder pairs at once
    const allPending = []; // [{token, placeholder}]

    while (autoQueue.length > 0) {
      const el = autoQueue.shift();
      if (!el.parentNode || !document.contains(el)) continue;

      const text = el.textContent || '';
      TOKEN_PATTERN.lastIndex = 0;
      const matches = [...text.matchAll(TOKEN_PATTERN)];
      if (matches.length === 0) continue;

      const frag = document.createDocumentFragment();
      let lastIndex = 0;

      for (const match of matches) {
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        // match[0] = "`token`" (with backticks), match[1] = "token" (without)
        const token = tokenFromMatch(match);
        const placeholder = document.createElement('span');
        placeholder.textContent = '⏳';
        placeholder.title = token;
        placeholder.style.cssText = 'opacity:0.6; font-size:0.85em;';
        frag.appendChild(placeholder);
        allPending.push({ token, placeholder });
        lastIndex = match.index + match[0].length; // skip the whole `token` including backticks
      }

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      while (el.firstChild) el.removeChild(el.firstChild);
      el.appendChild(frag);
    }

    if (allPending.length > 0 && autoDetokenizeEnabled) {
      const uniqueTokens = [...new Set(allPending.map(p => p.token))];

      // Build a map of token → [placeholders] for fast lookup
      const placeholderMap = {};
      for (const { token, placeholder } of allPending) {
        if (!placeholderMap[token]) placeholderMap[token] = [];
        placeholderMap[token].push(placeholder);
      }

      // Check cache first
      const cacheData = await chrome.storage.local.get(uniqueTokens);
      const cachedResults = {};
      const uncachedTokens = [];

      for (const token of uniqueTokens) {
        const cached = cacheData[token];
        if (cached && cached.value && Date.now() - cached.timestamp < 3600000) {
          // Valid cache hit
          cachedResults[token] = cached.value;
          const placeholders = placeholderMap[token] || [];
          for (const placeholder of placeholders) {
            if (!placeholder.isConnected) continue;
            const span = document.createElement('span');
            span.textContent = cached.value;
            span.title = 'Detokenized from: ' + token;
            span.style.cssText = 'background:#FFE033; border-radius:3px; padding:2px 6px; margin:0 2px; font-weight:700; color:#000000; font-size:0.95em; outline:1px solid #B8A000;';
            placeholder.parentNode.replaceChild(span, placeholder);
            saveToHistory(token, cached.value);
          }
        } else {
          uncachedTokens.push(token);
        }
      }

      console.log(`🚀 ${Object.keys(cachedResults).length} tokens from cache, ${uncachedTokens.length} need fetch`);

      // Only send uncached tokens to background
      if (uncachedTokens.length > 0) {
        // Listen for progressive results via storage changes
        const resolved = new Set();
        const storageListener = (changes) => {
          if (!changes.autoDetokenResults) return;
          const results = changes.autoDetokenResults.newValue || {};
          for (const [token, value] of Object.entries(results)) {
            if (resolved.has(token)) continue;
            resolved.add(token);
            const placeholders = placeholderMap[token] || [];
            for (const placeholder of placeholders) {
              if (!placeholder.isConnected) continue;
              const span = document.createElement('span');
              span.textContent = value;
              span.title = 'Detokenized from: ' + token;
              span.style.cssText = 'background:#FFE033; border-radius:3px; padding:2px 6px; margin:0 2px; font-weight:700; color:#000000; font-size:0.95em; outline:1px solid #B8A000;';
              placeholder.parentNode.replaceChild(span, placeholder);
              saveToHistory(token, value);
            }
          }
        };
        chrome.storage.onChanged.addListener(storageListener);

        // Kick off background processing — fire and forget
        chrome.runtime.sendMessage({ action: 'detokenizeBatch', tokens: uncachedTokens }).catch(() => {});

        // Clean up listener after 5 minutes max
        setTimeout(() => {
          chrome.storage.onChanged.removeListener(storageListener);
          // Restore any unresolved placeholders for uncached tokens only
          for (const token of uncachedTokens) {
            const placeholders = placeholderMap[token] || [];
            for (const placeholder of placeholders) {
              if (placeholder.isConnected && placeholder.textContent === '⏳') {
                placeholder.textContent = token;
              }
            }
          }
        }, 300000);
      }
    }

    autoRunning = false;
  }

  async function autoResolveAndReplace(token, placeholder) {
    const MAX_RETRIES = 3;
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
        const response = await chrome.runtime.sendMessage({ action: 'detokenize', token });
        if (response && response.success) {
          console.log('✅ Auto-replacing token in DOM:', token.substring(0, 20), '→', response.detokenizedValue);
          if (placeholder.isConnected) {
            const span = document.createElement('span');
            span.textContent = response.detokenizedValue;
            span.title = 'Detokenized from: ' + token;
            span.style.cssText = 'background:#FFE033; border-radius:3px; padding:2px 6px; margin:0 2px; font-weight:700; color:#000000; font-size:0.95em; outline:1px solid #B8A000;';
            placeholder.parentNode.replaceChild(span, placeholder);
          } else {
            console.warn('⚠️ Placeholder no longer in DOM — Splunk re-rendered the row');
          }
          return;
        }
        lastError = (response && response.error) || 'Failed';
        break;
      } catch (e) {
        lastError = e.message || 'Error';
        if (!e.message || !e.message.includes('message channel closed')) break;
      }
    }
    if (placeholder.isConnected) {
      const span = document.createElement('span');
      span.textContent = token;
      span.title = lastError;
      placeholder.parentNode.replaceChild(span, placeholder);
    }
  }

  // ── End Auto-Detokenize ────────────────────────────────────────────────────

  // Add keyboard shortcut
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D or Cmd+Shift+D - Open detokenizer panel
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      const selectedText = window.getSelection().toString().trim();
      if (selectedText) {
        document.getElementById('token-input').value = selectedText;
      }
      showPanel();
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
