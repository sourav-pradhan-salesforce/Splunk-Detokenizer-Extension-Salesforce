# 🚨 IMMEDIATE FIX - Background Not Responding

## Your Issue:
```
Starting detokenization for token: A-202607-1...
Sending message to background script...
(nothing happens)
```

---

## DO THIS NOW (3 Steps):

### ✅ Step 1: Reload Extension
```
1. Open: chrome://extensions/
2. Find: "Splunk BlackTab Detokenizer"
3. Click: 🔄 RELOAD button
4. Check: "Errors: 0"
```

### ✅ Step 2: Open Service Worker Console
```
1. Stay on chrome://extensions/
2. Find your extension
3. Click: "Service Worker" (blue link)
4. Console opens → Keep it open!
5. Should see: "Splunk Detokenizer Background Script loaded"
```

### ✅ Step 3: Test Again
```
1. Go to Splunk page
2. Press F12 (open console here too)
3. Click extension icon or press Ctrl+Shift+D
4. Enter test token: A-202607-test123
5. Click "Detokenize"
6. WATCH BOTH CONSOLES (Splunk + Service Worker)
```

---

## What You Should See:

### In Splunk Page Console (F12):
```
Starting detokenization for token: A-202607-1...
Sending message to background script...
Received response: {success: true, detokenizedValue: "..."}
```

### In Service Worker Console:
```
Background received message: {action: "detokenize", ...}
Processing detokenize request for token: A-202607-1...
Detokenizing token: A-202607-1...
Opening BlackTab tab with token: A-202607-1...
```

---

## If Still Nothing Happens:

### Check Service Worker Status:
Look at chrome://extensions/ under your extension:
- ✅ "Service Worker" (active) → Good!
- ❌ "Service Worker (Inactive)" → Click it to wake up

### Nuclear Option:
1. Remove extension (click "Remove")
2. Close ALL Chrome windows (quit Chrome completely)
3. Restart Chrome
4. Load extension again (Load unpacked)
5. Test immediately

---

## Use Test Page:

I created a diagnostic page:
```
1. Open in Chrome: ~/splunk-detokenizer-extension/test-background.html
2. Run all 4 tests
3. See which one fails
4. Follow the solution shown
```

---

## Quick Console Test:

Paste this in Splunk page console (F12):

```javascript
chrome.runtime.sendMessage({action: 'detokenize', token: 'TEST'}, r => console.log('Response:', r))
```

If you see "Response: {success: false, error: ...}" → Background is working!
If you see nothing or error → Background not responding, reload extension!

---

## Most Common Fix:

**99% of the time, the issue is:**
Service worker went to sleep and didn't wake up properly.

**Solution:**
Reload the extension at chrome://extensions/

---

## Files Updated:

I've already updated:
- ✅ background.js (better logging)
- ✅ content.js (timeout handling)
- ✅ Created test page (test-background.html)

You just need to RELOAD the extension to get these changes!

---

**After reloading, share:**
1. What you see in Service Worker console
2. What you see in Splunk page console
3. Screenshot if nothing happens
