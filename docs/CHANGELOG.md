# Changelog

## v3.0.1 - Real Slack User IDs (2026-07-03)

### Update
- ✅ Updated with actual Slack user IDs for all team members
- Links now work correctly to open Slack profiles

### Team Members:
- Ashish Sharma: U01G1C1J3EJ
- Sourav Pradhan: U061JUXGRV5
- Ram Krishan: U05QYDW7UTW
- Sriharsha Chagarlamudi: U03P4336EKZ

---

## v3.0.0 - Glassmorphism Design & Team Credits (2026-07-03)

### 🎨 Major UI Redesign
- **Glassmorphism design**: Modern frosted glass effect with backdrop blur
- **Smooth animations**: Elevated hover effects and transitions
- **Enhanced visuals**: Gradient accents and soft shadows
- **Better spacing**: More breathing room for all elements
- **Refined colors**: Improved contrast and readability

### 👥 Team Credits
- **Footer section**: "Made with ❤️ by Team Ashish"
- **Team links**: Direct Slack profile links for feedback
  - @ashishsharma
  - @souravpradhan
  - @ramkrishan
  - @sriharshachagarlamudi
- **Interactive links**: Hover effects on Slack handles

### Design Improvements:
- **Panel**: Frosted glass background with blur effect
- **Header**: Enhanced gradient with shadow
- **Buttons**: Improved gradients and hover states
- **Input fields**: Glassmorphism styling with focus effects
- **Result box**: Success gradient with green accents
- **History items**: Glass effect cards with hover animations
- **Dark mode**: Full glassmorphism support

### Note:
- Slack user IDs are placeholders - see SLACK_USER_IDS.md to update with actual IDs
- Click team member names to message them on Slack

---

## v2.4.2 - Comprehensive Redirect Detection (2026-07-03)

### Bug Fixes
- **Added all Salesforce SSO redirects**: Now detects `/secur/frontdoor`, `/saml/`, `authn-request`
- **Better logging**: Shows truncated URLs to avoid console spam
- **Detects unrecognized pages**: Logs pages that don't match expected patterns

### Known Redirect Pages Detected:
- `?ec=302&startURL=...` - Salesforce redirect
- `/secur/frontdoor.jsp` - SSO frontdoor (NEW)
- `/saml/authn-request.jsp` - SAML authentication (NEW)
- `central.my.salesforce.com/idp/login` - Central SSO login
- `/idp/` - Identity provider pages
- `&retURL=` - Return URL parameter (NEW)

### What Was Happening:
After successful login, the page would:
1. Login at `central.my.salesforce.com/idp/login`
2. Redirect to `/saml/authn-request.jsp`
3. Redirect to `/secur/frontdoor.jsp?sid=...&retURL=...`
4. Finally redirect to `/admin/gdpr-tokenizer/tokenizer.apexp`

Extension was stopping at step 3 (frontdoor page) instead of waiting for step 4.

### Now Fixed:
Extension now recognizes ALL intermediate pages and waits for the final tokenizer page.

### Troubleshooting:
Created TROUBLESHOOTING.md with common issues and solutions.

---

## v2.4.1 - Fix Redirect Page Detection (2026-07-03)

### Bug Fixes
- **Fixed redirect page detection**: Now properly waits for actual tokenizer page, not redirect page
- **Better URL validation**: Checks for `/admin/gdpr-tokenizer/tokenizer.apexp` (not just `tokenizer.apexp`)
- **Detects redirect URLs**: Identifies `?ec=302&startURL=` as redirect pages
- **Element verification**: Checks that page has textareas and buttons before proceeding
- **Retry logic**: If page missing elements, waits 3 more seconds and retries

### What Was Wrong
- Extension detected URL with `tokenizer.apexp` in query string: 
  `https://bt1.my.salesforce.com/?ec=302&startURL=/admin/gdpr-tokenizer/tokenizer.apexp`
- This is a **redirect page**, not the actual tokenizer!
- Page had 0 textareas, 0 buttons → script couldn't work
- Timeout after 8.5 seconds

### What's Fixed Now
- Only accepts URLs like: `https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp`
- Rejects redirect URLs with: `?ec=`, `&startURL=`, `/idp/`, etc.
- Verifies page has form elements before proceeding
- If no elements found, waits and retries once

---

## v2.4.0 - Smart Login Detection (2026-07-03)

### Major Improvement: Login Flow
- **Smart page detection**: Waits for actual tokenizer page, not login page
- **Handles redirects**: Automatically detects when you're on login page vs tokenizer page
- **No timeout during login**: Script only starts after you successfully login
- **Increased timeout**: 1 minute → 3 minutes total (plenty of time to login)

### How It Works Now
1. Click "Detokenize" (not logged in)
2. Background tab opens with login page
3. Extension waits patiently (shows "Check background tab if you need to login")
4. You login in the background tab
5. Page redirects to tokenizer
6. Extension detects tokenizer page and continues automatically
7. Token gets filled and detokenized
8. Success! ✅

### What Was Fixed
- **Before**: Script would run on login page, then timeout when you login
- **After**: Script waits for tokenizer page after login, then runs

### Technical Details
- Monitors tab URL changes during loading
- Detects login pages: `/idp/`, `central.my.salesforce.com`, `login`
- Only proceeds when on `tokenizer.apexp` (the actual tool page)
- Throttles URL checks to avoid performance issues

---

## v2.3.2 - History Persistence Fix (2026-07-03)

### Bug Fixes
- **Fixed history disappearing**: History now stays visible when clicking detokenize
- **Fixed empty state**: Empty state element is recreated if needed
- **Better logging**: Added detailed console logs for debugging history issues

### What Was Fixed
- History would disappear when clicking detokenize button
- Empty state would get lost after first refresh
- History would only show up again after page refresh

### Now Works Correctly
- History stays visible at all times
- Updates in real-time when you detokenize
- Empty state shows correctly when no history exists

---

## v2.3.1 - Login & History Debug (2026-07-03)

### Improvements
- **SSO Login Support**: Added permissions for central.my.salesforce.com and all Salesforce domains
- **Longer login timeout**: 30s → 2 minutes to give you time to login
- **History debugging**: Added detailed console logs to track history save/refresh

### Bug Fixes
- Fixed permission error when redirecting to SSO login page
- Better error messages for authentication issues

---

## v2.3.0 - Integrated History + Better Auth (2026-07-03)

### Improvements
- **Integrated History**: History now shown in the same panel below the detokenizer
  - No separate floating button or panel
  - Cleaner, more compact design
  - Shows: Timestamp, Token, Value with copy buttons
  - Delete individual entries or clear all
  - Auto-updates when you detokenize
  
- **Better Authentication Handling**:
  - Extension no longer checks auth on page load
  - Only checks when you actually try to detokenize
  - Gives you time to login to bt1.my.salesforce.com
  - Shows clear error if not authenticated

- **Simplified Access**:
  - One panel for everything: `Ctrl+Shift+D`
  - Click extension icon to open
  - Right-click selected text → "Detokenize with BlackTab"

### How to Use
1. Open panel with `Ctrl+Shift+D` or click extension icon
2. Paste token and detokenize
3. View history below in the same panel
4. Copy tokens or values with one click
5. History updates automatically

---

## v2.2.0 - History Panel (2026-07-03)

### New Features
- **History Panel**: View all your detokenizations in a table
  - Shows: Timestamp, Token, Detokenized Value
  - Quick actions: Copy token, Copy value, Delete entry
  - Keeps last 100 entries automatically
  - Updates in real-time as you detokenize
  - Searchable table with scrolling
  
- **Easy Access**:
  - Floating button (bottom-right corner) 📋
  - Keyboard shortcut: `Ctrl+Shift+H` (or `Cmd+Shift+H` on Mac)
  - Right-click menu: "Show Detokenization History"
  
- **History Management**:
  - Refresh button to reload
  - Clear All button to delete history
  - Delete individual entries
  - Draggable panel (can move it around)

### How to Use
1. Detokenize tokens as usual
2. Click the 📋 button (bottom-right) to see history
3. Or press `Ctrl+Shift+H`
4. Copy values directly from the table
5. Delete entries you don't need

---

## v2.1.0 - Smart Caching (2026-07-02)

### New Features
- **Smart Cache**: Tokens detokenized once are cached for 1 hour
  - **Instant results** for repeat tokens (milliseconds instead of seconds!)
  - Cache indicator: `⚡` instead of `✅` for cached results
  - Automatic cache expiry after 1 hour
  - Automatic cache size management (max 100 entries, oldest removed first)
- **Clear Cache**: Right-click on page → "Clear Detokenization Cache"

### Performance
- Optimized tab method: **10-13s → 6-8.5s** (~50% faster)
  - Page init: 4s → 1.5s
  - Token fill wait: 2s → 1s
  - Result wait: 8s → 4s
  - Retry wait: 5s → 3s
- **Cached tokens: <100ms** ⚡

### How It Works
1. First time detokenizing a token: Normal speed (6-8.5s with tab method)
2. Second time detokenizing same token: **Instant** from cache
3. Cache automatically expires after 1 hour
4. Cache automatically clears oldest entries when full

### To Update
1. Go to `chrome://extensions/`
2. Click **Reload** on "Splunk BlackTab Detokenizer"
3. **Refresh your Splunk page**
4. Test it!

---

## v2.0.3 - Speed Optimization (2026-07-02)

### Performance
- Reduced wait times throughout the tab automation:
  - Page initialization: 4s → 1.5s
  - Token fill wait: 2s → 1s
  - Result extraction: 8s → 4s
  - Retry wait: 5s → 3s
- Total time: **~10-13s → ~6-8.5s** (50% faster)

---

## v2.0.2 - Fast POST Method (2026-07-02)

### Features
- Implemented direct POST request method (attempts to bypass UI entirely)
- Automatic fallback to tab method if POST fails
- More reliable error handling

### Known Issues
- Fast POST method cannot parse results from Ajax4jsf response
- Falls back to tab method (works perfectly)

---

## v2.0.0 - Background Processing (2026-07-02)

### Features
- Background tab processing (inactive tab, not visible)
- No visible redirections or UI changes
- Compact notifications for status and results
- Click notification to copy result
- Enhanced error handling

---

## v1.2.1 - Tab Method Revert (2026-07-02)

### Changes
- Reverted to inactive tab method (more reliable)
- Removed minimized window approach

---

## v1.2.0 - Minimized Window (2026-07-02)

### Features
- Truly invisible processing with minimized window
- No visible tabs in tab bar
- Pulsing button animation
- Fixed button positioning issue

---

## v1.1.2 - Quick Detokenize Button (2026-07-02)

### Features
- Quick detokenize button on text selection
- Fixed positioning with proper z-index
- Visual feedback on click
- Auto-hide after 5 seconds

---

## v1.0.0 - Initial Release (2026-07-02)

### Features
- Manual detokenization panel
- Copy/paste token input
- BlackTab automation
- Keyboard shortcut: Ctrl+Shift+D
