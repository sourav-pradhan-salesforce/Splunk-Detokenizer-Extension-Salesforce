# ✅ Extension Reload Checklist

## Every Time You Reload the Extension:

### Step 1: Reload Extension
```
chrome://extensions/ → Find extension → Click RELOAD (🔄)
```

### Step 2: Refresh ALL Open Pages ⚠️
```
Go to EVERY tab where the extension is used
Press F5 (or Ctrl+R / Cmd+R) to refresh
```

**Why?** Old content scripts become orphaned after reload and can't communicate with the new background worker.

---

## Common Errors If You Skip Page Refresh:

### Error: "Extension context invalidated"
```
Detokenization error: Error: Extension context invalidated.
```

**Cause:** Old content script trying to talk to new background worker  
**Fix:** Refresh the page (F5)

### Error: "Could not establish connection"
```
Error: Could not establish connection. Receiving end does not exist.
```

**Cause:** Background worker not responding OR page not refreshed  
**Fix:** Refresh the page (F5) and try again

---

## Proper Development Workflow:

```
┌─────────────────────────────────────────┐
│ 1. Edit code (content.js, background.js, etc.) │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 2. Go to chrome://extensions/           │
│    Click RELOAD on your extension       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 3. Go to Splunk tab (or any tab using  │
│    the extension)                        │
│    Press F5 to REFRESH THE PAGE         │ ← CRITICAL!
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 4. Test the extension                   │
│    Open DevTools (F12) to see logs      │
└─────────────────────────────────────────┘
```

---

## Quick Test Script

After reloading extension AND refreshing page, run this in console:

```javascript
// Test if content script is fresh
console.log('Testing extension...');
chrome.runtime.sendMessage({action: 'detokenize', token: 'TEST'}, response => {
  if (response) {
    console.log('✅ Extension working! Response:', response);
  } else {
    console.log('⚠️ No response - did you refresh the page?');
  }
});
```

---

## Exceptions: When Page Refresh is NOT Needed

You only need to refresh if you changed:
- ✅ content.js (runs in page)
- ✅ content script behavior
- ✅ manifest.json content_scripts section

You DON'T need to refresh if you only changed:
- ❌ background.js (service worker reloads automatically)
- ❌ popup.html/popup.js (popup reloads on next open)
- ❌ styles.css (IF only used by popup)

**But when in doubt, just refresh the page! It's quick and prevents issues.**

---

## Signs You Need to Refresh:

- ❌ "Extension context invalidated" error
- ❌ "Receiving end does not exist" error
- ❌ Button doesn't appear when selecting text
- ❌ Panel doesn't open with Ctrl+Shift+D
- ❌ Console logs missing
- ❌ Extension seems "dead" on the page

**Solution to all:** Refresh the page!

---

## Pro Tip: Auto-Refresh During Development

To make development faster, you can:

1. **Use Extension Reloader extension:**
   - Install "Extensions Reloader" from Chrome Web Store
   - Reload all extensions + tabs with one click

2. **Or bookmark this workflow:**
   ```
   1. Save your code changes
   2. Alt+Tab to Chrome
   3. F5 on chrome://extensions/ (or click reload)
   4. Alt+Tab to your test page
   5. F5 to refresh
   6. Test!
   ```

---

## Remember:

**The Golden Rule:**
```
After every extension reload,
refresh every page using the extension!
```

It's quick (1 second) and prevents 99% of "extension not working" issues during development.

---

## Current Status:

You need to:
1. ✅ Extension already reloaded
2. ⚠️ **Now refresh the Splunk page** (F5)
3. ✅ Try detokenizing again

That's it! This will fix the "Extension context invalidated" error.
