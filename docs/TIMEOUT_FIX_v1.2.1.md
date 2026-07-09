# 🔧 Timeout Fix - v1.2.1

## Issue Identified

From your console output:
```
📤 Sending message to background script...
⏳ Waiting for response...
❌ Quick detokenization error: Error: Request timed out after 60 seconds
```

**Problem:** The message is being sent but the background script is not responding within 60 seconds.

## Root Cause

The `chrome.windows.create()` with `state: 'minimized'` might be:
1. Failing silently on your system
2. Being blocked by browser security
3. Not supported on your Chrome version/OS

## Solution Implemented

Added **automatic fallback**:

```javascript
// Try Method 1: Minimized window (invisible)
chrome.windows.create({ state: 'minimized', ... })
  ↓ If fails ↓
// Fallback to Method 2: Inactive tab (visible in tab bar)
chrome.tabs.create({ active: false, ... })
```

### New Flow:

1. **Try minimized window first**
   - If successful: Completely invisible! ✅
   - If fails: Auto-fallback to inactive tab

2. **Fallback to inactive tab**
   - Will be visible in tab bar (like before v1.2.0)
   - But still works reliably
   - Better than failing completely

3. **Enhanced error handling**
   - Checks for `chrome.runtime.lastError`
   - Logs which method is being used
   - Graceful degradation

## What You'll See Now

### Best Case (Window Creation Works):
```
✅ Hidden window created
→ Completely invisible processing
→ Only notification visible
```

### Fallback Case (Window Creation Fails):
```
🔄 Using fallback: inactive tab method
✅ Fallback tab created
→ Tab visible in tab bar (but inactive)
→ Still works, just less hidden
```

## Testing Steps

### 1. Reload Extension
```
chrome://extensions/ → Reload
```

### 2. Open Background Console
```
chrome://extensions/ → Click "Service Worker"
Keep this console open!
```

### 3. Test Detokenization
```
Go to Splunk → Select token → Click Detokenize
```

### 4. Watch Background Console
Look for one of these:
```
✅ Hidden window created: XXX, Tab: YYY
   → Window method working! (completely invisible)

OR

🔄 Using fallback: inactive tab method
✅ Fallback tab created: YYY
   → Tab method working! (visible in tab bar)
```

## Expected Logs

### Success with Window:
```
Background received message: {action: 'detokenize', ...}
Processing detokenize request for token: A-202607...
Opening BlackTab page in completely hidden mode...
✅ Hidden window created: 123, Tab: 456
Waiting for page to load...
Page loaded
Page initialized, inspecting page structure...
...
SUCCESS! Detokenized value: [value]
🧹 Closing window: 123
```

### Success with Fallback Tab:
```
Background received message: {action: 'detokenize', ...}
Processing detokenize request for token: A-202607...
Opening BlackTab page in completely hidden mode...
Window creation failed: [reason]
🔄 Using fallback: inactive tab method
✅ Fallback tab created: 456
Waiting for page to load...
Page loaded
...
SUCCESS! Detokenized value: [value]
🧹 Closing tab: 456
```

### If Still Failing:
```
Background received message: {action: 'detokenize', ...}
Processing detokenize request for token: A-202607...
→ NOTHING ELSE (stuck here)
```

If you see nothing after "Processing detokenize request", that means the window/tab creation is hanging.

## Additional Debugging

### Check Chrome Version:
```
chrome://version/
```
Minimized windows require Chrome 111+

### Check OS:
- Windows: Should work
- Mac: Should work  
- Linux: May have issues with minimized windows

### Check Permissions:
```
chrome://extensions/ → Extension Details
→ Check "Site access" and "Permissions"
```

## Manual Fallback

If automated methods don't work, you can still use:
1. Press **Ctrl+Shift+D** (Cmd+Shift+D on Mac)
2. Paste token in panel
3. Click Detokenize button

This uses the same backend but with manual UI.

## Next Steps

After testing, please share:
1. **Background console output** (from Service Worker)
2. **Which method was used** (window or fallback tab?)
3. **Did it complete successfully?**
4. **Any error messages?**

This will help me understand what's happening on your system!

---

**Version:** 1.2.1  
**Fix:** Added fallback to inactive tab if minimized window fails  
**Status:** Ready to test with better error handling! 🚀
