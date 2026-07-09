# Architecture Diagram

## Extension Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
           │
           │  1. Selects tokenized text in Splunk
           │  2. Clicks "Detokenize" button OR presses Ctrl+Shift+D
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SPLUNK WEB PAGE                               │
│  https://splunk-web.log-analytics.monitoring...                 │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  CONTENT SCRIPT (content.js)                           │    │
│  │  • Monitors text selection                             │    │
│  │  • Detects token patterns                              │    │
│  │  • Shows detokenize button                             │    │
│  │  • Displays floating panel                             │    │
│  │  • Handles keyboard shortcuts                          │    │
│  └────────────────────┬───────────────────────────────────┘    │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ chrome.runtime.sendMessage({
                         │   action: 'detokenize',
                         │   token: 'ABC123...'
                         │ })
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKGROUND SERVICE WORKER (background.js)                │
│         • Receives detokenization requests                       │
│         • Checks Salesforce authentication                       │
│         • Manages tab creation and automation                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ chrome.tabs.create({
                          │   url: 'bt1.my.salesforce.com/...',
                          │   active: false
                          │ })
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              BLACKTAB DETOKENIZER PAGE (Hidden Tab)              │
│              https://bt1.my.salesforce.com/...                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  INJECTED SCRIPT (from background.js)                  │    │
│  │  1. Finds input field                                  │    │
│  │  2. Enters token value                                 │    │
│  │  3. Clicks detokenize button                           │    │
│  │  4. Waits for result                                   │    │
│  │  5. Extracts detokenized value                         │    │
│  └────────────────────┬───────────────────────────────────┘    │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ Returns detokenized value
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKGROUND SERVICE WORKER (background.js)                │
│         • Closes hidden tab                                      │
│         • Sends result back to content script                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ sendResponse({
                          │   success: true,
                          │   detokenizedValue: 'john@example.com'
                          │ })
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SPLUNK WEB PAGE                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  CONTENT SCRIPT (content.js)                           │    │
│  │  • Receives detokenized value                          │    │
│  │  • Displays result in panel                            │    │
│  │  • Enables "Copy to Clipboard" button                  │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           │
           │  User sees detokenized value
           │  User can copy to clipboard
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         USER RESULT                              │
│                   ✓ Token Detokenized                            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Popup      │         │   Content    │         │  Background  │
│  (popup.js)  │         │ (content.js) │         │(background.js)│
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                         │
       │  User clicks           │                         │
       │  "Open Panel"          │                         │
       │────────────────────────>                         │
       │                        │                         │
       │                   Panel opens                    │
       │                   User enters token              │
       │                        │                         │
       │                        │  Detokenize request     │
       │                        │────────────────────────>│
       │                        │                         │
       │                        │                    Check auth
       │                        │                    Open hidden tab
       │                        │                    Inject script
       │                        │                    Extract result
       │                        │                         │
       │                        │<────────────────────────│
       │                        │     Return result       │
       │                        │                         │
       │                   Display result                 │
       │                        │                         │
       ▼                        ▼                         ▼
```

## File Structure and Responsibilities

```
splunk-detokenizer-extension/
│
├── manifest.json                    # Extension configuration
│   ├── Defines permissions
│   ├── Specifies content scripts
│   ├── Registers background worker
│   └── Sets host permissions
│
├── content.js                       # Injected into Splunk pages
│   ├── Text selection monitoring
│   ├── Token pattern detection
│   ├── UI panel creation
│   ├── Keyboard shortcut handling
│   └── Message passing to background
│
├── background.js                    # Service worker
│   ├── Message routing
│   ├── Tab management
│   ├── BlackTab automation
│   ├── Authentication checking
│   └── Result extraction
│
├── styles.css                       # UI styling
│   ├── Panel styling
│   ├── Button styling
│   ├── Dark mode support
│   └── Animations
│
├── popup.html & popup.js           # Extension popup
│   ├── Quick actions
│   ├── Usage instructions
│   └── Status display
│
├── icons/                          # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
└── Documentation
    ├── README.md        # Main documentation
    ├── INSTALL.md       # Installation guide
    ├── QUICKSTART.md    # Quick start
    ├── TECHNICAL.md     # Technical details
    └── ARCHITECTURE.md  # This file
```

## Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  USER'S CHROME BROWSER                                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  SANDBOXED EXTENSION ENVIRONMENT                   │    │
│  │                                                      │    │
│  │  ┌──────────────┐      ┌──────────────┐           │    │
│  │  │  Content     │      │  Background  │           │    │
│  │  │  Script      │◄────►│  Service     │           │    │
│  │  │              │      │  Worker      │           │    │
│  │  └──────────────┘      └──────┬───────┘           │    │
│  │         │                      │                    │    │
│  │         │ DOM Access          │ Tab Management     │    │
│  │         │ Limited to          │ Cookie Access      │    │
│  │         │ Splunk pages        │ Limited to         │    │
│  │         │                      │ allowed hosts      │    │
│  └─────────┼──────────────────────┼────────────────────┘    │
│            │                      │                          │
│    ┌───────▼──────────┐   ┌──────▼─────────┐              │
│    │   Splunk Page    │   │ BlackTab Page  │              │
│    │   (Read/Write)   │   │ (Automated)    │              │
│    └──────────────────┘   └────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
1. TOKEN INPUT
   ├─ User selects text: "ABC123XYZ..."
   ├─ Pattern match confirms it's a token
   └─ Token stored in variable (memory only)

2. AUTHENTICATION CHECK
   ├─ Query Chrome cookie store
   ├─ Check for Salesforce session cookies
   └─ Reject if not authenticated

3. DETOKENIZATION REQUEST
   ├─ Open hidden tab to BlackTab
   ├─ Inject automation script
   ├─ Fill form with token
   ├─ Submit and wait for result
   └─ Extract detokenized value

4. RESULT DISPLAY
   ├─ Close hidden tab
   ├─ Send result to content script
   ├─ Display in UI panel
   └─ Enable copy to clipboard

5. CLEANUP
   ├─ No persistent storage
   ├─ Data cleared from memory
   └─ Tab closed
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│  Detokenization Attempt                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ Authentication Failed
                 │  └─> "Not authenticated to Salesforce"
                 │      User directed to login
                 │
                 ├─ Network Error
                 │  └─> "Network error. Check connection."
                 │      Suggest retry
                 │
                 ├─ Timeout
                 │  └─> "Request timed out. Please try again."
                 │      Automatic retry available
                 │
                 ├─ Element Not Found
                 │  └─> "BlackTab page structure changed"
                 │      Technical error logged
                 │
                 ├─ Invalid Token
                 │  └─> "Could not detokenize value"
                 │      Display BlackTab's error message
                 │
                 └─ Success
                    └─> Display detokenized value
                        Enable copy button
```

## Extension Lifecycle

```
┌────────────────────────────────────────────────────────────┐
│  EXTENSION INSTALLATION                                     │
│  • Load unpacked extension                                  │
│  • Chrome validates manifest.json                           │
│  • Permissions requested from user                          │
│  • Background service worker registered                     │
└────────────────────┬───────────────────────────────────────┘
                     ▼
┌────────────────────────────────────────────────────────────┐
│  USER NAVIGATES TO SPLUNK                                   │
│  • Chrome detects URL matches content_scripts pattern       │
│  • content.js injected into page                            │
│  • Extension initializes UI components                      │
└────────────────────┬───────────────────────────────────────┘
                     ▼
┌────────────────────────────────────────────────────────────┐
│  ACTIVE USE                                                 │
│  • Content script monitors page                             │
│  • Background worker waits for messages                     │
│  • User interacts with extension                            │
└────────────────────┬───────────────────────────────────────┘
                     ▼
┌────────────────────────────────────────────────────────────┐
│  USER LEAVES SPLUNK                                         │
│  • Content script unloads                                   │
│  • Background worker goes idle                              │
│  • No persistent data retained                              │
└────────────────────────────────────────────────────────────┘
```

## Browser API Usage

```
┌─────────────────────────────────────────────────────────────┐
│  CHROME EXTENSION APIS USED                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  chrome.runtime                                              │
│  ├─ sendMessage()      - Content ↔ Background communication │
│  ├─ onMessage          - Listen for messages                │
│  └─ onInstalled        - Extension installation handler      │
│                                                               │
│  chrome.tabs                                                 │
│  ├─ create()           - Open BlackTab in hidden tab        │
│  ├─ remove()           - Close tab after extraction         │
│  ├─ onUpdated          - Wait for tab to load               │
│  └─ sendMessage()      - Send data to content script        │
│                                                               │
│  chrome.scripting                                            │
│  └─ executeScript()    - Inject automation script           │
│                                                               │
│  chrome.cookies                                              │
│  └─ getAll()           - Check Salesforce authentication    │
│                                                               │
│  chrome.action                                               │
│  └─ onClicked          - Extension icon click handler       │
│                                                               │
│  chrome.contextMenus                                         │
│  ├─ create()           - Add "Detokenize" menu item        │
│  └─ onClicked          - Handle menu item click             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Performance Characteristics

```
Operation                   Duration        Notes
─────────────────────────────────────────────────────────────
Extension Load              < 100ms         One-time on install
Content Script Injection    < 50ms          Per page load
Token Pattern Match         < 10ms          Per text selection
UI Panel Creation           ~50ms           First time only
Message Passing             < 5ms           Runtime messaging
Tab Creation                ~200-500ms      Network dependent
Page Load Wait              2-5 seconds     BlackTab load time
Script Injection            ~100ms          Into BlackTab page
Form Automation             ~500ms          Fill and submit
Result Extraction           ~100ms          DOM query
Tab Cleanup                 ~50ms           Tab close
Total Detokenization        10-15 seconds   Full round trip
```

---

This architecture ensures:
- ✅ Secure separation of concerns
- ✅ Minimal performance impact
- ✅ User-friendly interface
- ✅ Reliable automation
- ✅ Proper error handling
