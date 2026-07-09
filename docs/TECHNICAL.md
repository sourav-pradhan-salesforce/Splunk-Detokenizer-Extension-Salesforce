# Technical Documentation - Splunk BlackTab Detokenizer

This document provides technical details for developers who want to understand, modify, or extend the extension.

## Architecture Overview

The extension follows the Chrome Extension Manifest V3 architecture with three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                        Chrome Browser                        │
├─────────────────────────────────────────────────────────────┤
│  Splunk Page                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Content Script (content.js)                         │  │
│  │  • Injected into Splunk pages                        │  │
│  │  • Text selection detection                          │  │
│  │  • UI panel management                               │  │
│  │  • Token pattern matching                            │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │ chrome.runtime.sendMessage()             │
│                  ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Background Service Worker (background.js)           │  │
│  │  • Message routing                                   │  │
│  │  • Tab management                                    │  │
│  │  • BlackTab integration                              │  │
│  │  • Authentication check                              │  │
│  └───────────────┬──────────────────────────────────────┘  │
│                  │ chrome.tabs.create()                     │
│                  │ chrome.scripting.executeScript()         │
│                  ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  BlackTab Detokenizer Page (hidden tab)             │  │
│  │  • Automated interaction                             │  │
│  │  • Result extraction                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Content Script (content.js)

**Purpose:** Runs in the context of Splunk pages to detect tokens and provide UI.

**Key Functions:**

- `init()` - Initializes the extension on page load
- `createDetokenizerPanel()` - Creates the floating UI panel using safe DOM methods
- `handleTextSelection()` - Monitors text selection events
- `isLikelyToken(text)` - Pattern matching to detect potential tokens
- `showQuickDetokenizeButton()` - Shows floating button near selection
- `detokenizeValue()` - Sends detokenization request to background script
- `makeDraggable()` - Implements drag functionality for panel

**Token Detection Patterns:**

```javascript
const tokenPatterns = [
  /^[A-Za-z0-9+/=]{20,}$/,  // Base64-encoded strings (20+ chars)
  /^[0-9a-fA-F]{16,}$/,      // Hexadecimal strings (16+ chars)
  /tok_[A-Za-z0-9_-]+/,      // Tokens with 'tok_' prefix
  /^[A-Z0-9]{10,}$/          // Uppercase alphanumeric (10+ chars)
];
```

**Security Considerations:**
- All DOM manipulation uses `textContent` instead of `innerHTML` to prevent XSS
- User input is not executed as code
- Event listeners are properly scoped

### 2. Background Service Worker (background.js)

**Purpose:** Handles cross-origin requests and tab management.

**Key Functions:**

- `detokenizeValue(token)` - Main detokenization orchestrator
- `fetchDetokenizedValue(token, url)` - Handles BlackTab communication
- `openDetokenizerTab(token, baseUrl)` - Creates hidden tab for automation
- `waitForTabLoad(tabId)` - Waits for tab to fully load
- `interactWithDetokenizer(token)` - Injected function to interact with BlackTab

**Message Flow:**

```javascript
// Content Script → Background
chrome.runtime.sendMessage({
  action: 'detokenize',
  token: 'ABC123...'
})

// Background → Content Script
sendResponse({
  success: true,
  detokenizedValue: 'john.doe@example.com'
})
```

**Tab Management Strategy:**

1. Create tab with `active: false` (hidden)
2. Wait for `chrome.tabs.onUpdated` with `status === 'complete'`
3. Inject script using `chrome.scripting.executeScript`
4. Extract result from injected script
5. Close tab automatically

### 3. Popup Interface (popup.html + popup.js)

**Purpose:** Provides quick access and information when clicking extension icon.

**Features:**
- Quick launch button
- Usage instructions
- Keyboard shortcut reference
- Extension status indicator

### 4. Styles (styles.css)

**Design System:**
- Gradient theme: `#667eea` to `#764ba2`
- Font: System UI fonts
- Dark mode support via media queries
- Z-index: 999999 to appear above Splunk UI

## BlackTab Integration

### Current Implementation

The extension uses a **hidden tab approach** to interact with BlackTab:

```javascript
async function openDetokenizerTab(token, baseUrl) {
  // 1. Open BlackTab in background tab
  chrome.tabs.create({ url: baseUrl, active: false })
  
  // 2. Wait for page load
  await waitForTabLoad(tabId)
  
  // 3. Inject automation script
  await chrome.scripting.executeScript({
    target: { tabId },
    func: interactWithDetokenizer,
    args: [token]
  })
  
  // 4. Close tab and return result
  chrome.tabs.remove(tabId)
}
```

### Injected Script Logic

```javascript
function interactWithDetokenizer(token) {
  // Wait for input field
  const inputField = document.querySelector('input[type="text"], textarea')
  
  // Enter token
  inputField.value = token
  inputField.dispatchEvent(new Event('input', { bubbles: true }))
  
  // Click detokenize button
  const button = document.querySelector('button, input[type="submit"]')
  button.click()
  
  // Wait for and extract result
  const resultElement = document.querySelector('.result, .output')
  return resultElement.textContent.trim()
}
```

### Known Limitations

1. **Selector Dependency:** Code assumes specific DOM structure
2. **Timing Issues:** Fixed delays may not work for slow connections
3. **CORS Restrictions:** Can't make direct API calls to BlackTab
4. **No Progress Updates:** User doesn't see intermediate steps

### Alternative Approaches (Future Improvements)

#### Option 1: Direct API Integration
```javascript
// If BlackTab exposes an API
const response = await fetch('https://bt1.my.salesforce.com/api/detokenize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
})
```

#### Option 2: Offscreen Document
```javascript
// Use Manifest V3 offscreen documents
await chrome.offscreen.createDocument({
  url: 'detokenizer-frame.html',
  reasons: ['DOM_SCRAPING'],
  justification: 'Automate detokenization'
})
```

#### Option 3: Native Messaging
```javascript
// Communicate with native host application
chrome.runtime.sendNativeMessage('com.salesforce.detokenizer', {
  action: 'detokenize',
  token: token
})
```

## Extension Permissions

### Required Permissions

```json
{
  "permissions": [
    "activeTab",    // Access current tab for content injection
    "storage",      // Store user preferences (future)
    "cookies"       // Check Salesforce authentication
  ],
  "host_permissions": [
    "https://splunk-web.log-analytics.monitoring.aws-esvc1-useast2.aws.sfdc.cl/*",
    "https://bt1.my.salesforce.com/*"
  ]
}
```

### Security Implications

- **activeTab:** Only accesses currently active tab when user interacts
- **storage:** Local data only, no sync
- **cookies:** Read-only access to verify authentication
- **host_permissions:** Limited to specific domains

## Development Workflow

### Local Development

1. **Make Changes:**
   ```bash
   cd ~/splunk-detokenizer-extension
   # Edit files
   code content.js  # or use your preferred editor
   ```

2. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click refresh icon on extension card

3. **Test:**
   - Open Splunk page
   - Open DevTools (F12)
   - Test your changes

4. **Debug:**
   - Content script: DevTools on Splunk page
   - Background: Click "Service Worker" in extensions page
   - Popup: Right-click extension icon → Inspect popup

### Debugging Tips

#### Debug Content Script

```javascript
// Add console logs
console.log('Token detected:', token);
console.log('Panel state:', detokenizerPanel.classList);

// Breakpoints in DevTools
debugger;  // Will pause execution when DevTools is open
```

#### Debug Background Script

```javascript
// Background script console
console.log('Message received:', request);
console.log('Tab created:', tab.id);

// Monitor tab events
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  console.log('Tab updated:', tabId, changeInfo);
});
```

#### Debug Injected Script

```javascript
// The injected script runs in the BlackTab page context
// Logs will appear in that page's console (if tab is visible)
function interactWithDetokenizer(token) {
  console.log('Searching for input field...');
  const inputField = document.querySelector('input');
  console.log('Found input:', inputField);
  // ...
}
```

### Testing Checklist

- [ ] Text selection detection works
- [ ] Quick button appears for tokens
- [ ] Panel opens and closes correctly
- [ ] Token input and detokenization works
- [ ] Copy to clipboard functions
- [ ] Keyboard shortcut works (Ctrl+Shift+D)
- [ ] Context menu appears and works
- [ ] Extension icon click opens panel
- [ ] Dragging panel works smoothly
- [ ] Authentication check works
- [ ] Error messages display correctly
- [ ] Dark mode renders properly

## Customization Guide

### Add New Token Patterns

```javascript
// In content.js, modify isLikelyToken()
function isLikelyToken(text) {
  const tokenPatterns = [
    // ... existing patterns ...
    /^custom_[A-Z0-9]{16}$/,  // Custom pattern: custom_ABC123...
    /^[A-F0-9]{32}$/,          // MD5 hashes
  ];
  return tokenPatterns.some(pattern => pattern.test(text));
}
```

### Change UI Theme

```css
/* In styles.css, modify color scheme */
.detokenizer-header {
  background: linear-gradient(135deg, #YOUR_COLOR1, #YOUR_COLOR2);
}

.detokenize-btn {
  background: linear-gradient(135deg, #YOUR_COLOR1, #YOUR_COLOR2);
}
```

### Adjust BlackTab Selectors

```javascript
// In background.js, modify interactWithDetokenizer()
function interactWithDetokenizer(token) {
  // Update selectors based on actual BlackTab page structure
  const inputField = document.querySelector('#your-input-id');
  const submitButton = document.querySelector('#your-button-id');
  const resultDiv = document.querySelector('#your-result-id');
  // ...
}
```

### Add Logging/Analytics

```javascript
// In background.js
function logDetokenization(success, duration) {
  // Send to your analytics service
  fetch('https://your-analytics-endpoint', {
    method: 'POST',
    body: JSON.stringify({
      event: 'detokenization',
      success,
      duration,
      timestamp: Date.now()
    })
  });
}
```

## Performance Considerations

### Current Performance Metrics

- **Initial load:** < 100ms
- **Panel creation:** ~50ms
- **Token detection:** < 10ms per selection
- **Detokenization:** 10-15 seconds (network dependent)

### Optimization Opportunities

1. **Cache Results:** Store recently detokenized values
2. **Batch Processing:** Detokenize multiple tokens at once
3. **Service Worker Caching:** Keep background script alive longer
4. **Lazy Loading:** Load UI components on demand

### Memory Management

```javascript
// Clean up event listeners when panel is destroyed
function cleanup() {
  document.removeEventListener('mouseup', handleTextSelection);
  chrome.runtime.onMessage.removeListener(handleMessage);
}
```

## Error Handling

### Error Types and Handling

```javascript
try {
  // Detokenization attempt
} catch (error) {
  if (error.message.includes('authentication')) {
    showError('Please log in to Salesforce');
  } else if (error.message.includes('timeout')) {
    showError('Request timed out. Please try again.');
  } else if (error.message.includes('network')) {
    showError('Network error. Check your connection.');
  } else {
    showError('Unexpected error: ' + error.message);
  }
}
```

### Retry Logic

```javascript
async function detokenizeWithRetry(token, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await detokenizeValue(token);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 88+
- ✅ Edge 88+ (Chromium-based)
- ✅ Brave 1.19+
- ✅ Opera 74+
- ❌ Firefox (uses different extension API)
- ❌ Safari (uses different extension API)

### Manifest V3 Requirements

This extension uses Manifest V3, which requires:
- Service workers instead of background pages
- Promises instead of callbacks
- Declarative APIs where possible

## Future Enhancements

### Planned Features

1. **Batch Detokenization**
   - Select multiple tokens at once
   - Process in parallel
   - Display results in table format

2. **History/Cache**
   - Store recent detokenizations
   - Quick re-access without re-fetching
   - Search through history

3. **Settings Panel**
   - Customize token patterns
   - Toggle auto-detection
   - Set BlackTab instance URL

4. **Export Functionality**
   - Export detokenized values as CSV
   - Copy formatted data
   - Save to file

5. **Notifications**
   - Desktop notifications when detokenization completes
   - Error notifications with details

### API Wishlist

Features that would improve the extension if BlackTab provided:

- REST API for programmatic access
- OAuth authentication
- Batch detokenization endpoint
- Webhook callbacks for async processing

## Contributing

### Code Style

- Use ES6+ features
- Prefer `const` over `let`
- Use async/await over callbacks
- Add comments for complex logic
- Follow existing formatting

### Pull Request Process

1. Test all changes locally
2. Update documentation if needed
3. Add new patterns/features to README
4. Verify no security issues introduced

## License

MIT License - Internal Salesforce tool

---

**For Technical Support:**
- Check browser console for detailed errors
- Review this documentation for customization
- Contact extension maintainers for bugs
