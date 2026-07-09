# 🔧 Troubleshooting: No Response from Background Script

## Problem: "Sending message to background script..." but nothing returns

This means the background service worker is not responding to messages from the content script.

---

## Quick Fix (Try This First)

### Step 1: Reload the Extension
```
1. Go to chrome://extensions/
2. Find "Splunk BlackTab Detokenizer"
3. Click the 🔄 RELOAD button
4. Check that "Errors: 0" appears
```

### Step 2: Check Service Worker Status
```
1. Stay on chrome://extensions/
2. Find your extension card
3. Look for "Service Worker" - it should show either:
   - "Service Worker" (link) - Click it to open console
   - "Service Worker (Inactive)" - This is the problem!
```

### Step 3: Activate Service Worker
If it says "Inactive", the service worker needs to wake up:

**Option A:** Click the extension icon in your toolbar
**Option B:** Click "Service Worker" link to wake it up
**Option C:** Reload the extension (Step 1)

---

## Diagnostic Test Page

I've created a test page to help diagnose the issue:

### How to Use It:

1. **Open the test page:**
   ```
   Open file in Chrome: ~/splunk-detokenizer-extension/test-background.html
   ```

2. **Open Service Worker Console:**
   ```
   chrome://extensions/ → Find extension → Click "Service Worker"
   Keep this console open!
   ```

3. **Run Tests:**
   - Click each "Run Test" button
   - Watch both the test page AND the Service Worker console
   - Compare outputs

4. **Check Results:**
   - ✅ All tests pass = Extension working correctly
   - ❌ Test fails = Follow the solution shown

---

## Common Causes and Solutions

### Cause 1: Service Worker Not Running

**Symptom:**
```
Starting detokenization for token: A-202607-1...
Sending message to background script...
(nothing happens)
```

**Check:**
- Go to `chrome://extensions/`
- Does it say "Service Worker (Inactive)"?

**Solution:**
1. Reload the extension
2. Click the extension icon to wake it up
3. Or just interact with the extension once

**Why This Happens:**
Chrome puts service workers to sleep after ~30 seconds of inactivity to save resources. They wake up when:
- Extension icon is clicked
- Content script sends a message
- Browser event occurs

### Cause 2: Extension Not Loaded on Page

**Symptom:**
```
Error: Could not establish connection. Receiving end does not exist.
```

**Check:**
- Open DevTools (F12) on Splunk page
- Type: `chrome.runtime.id`
- Does it show the extension ID or error?

**Solution:**
1. Make sure you're on the Splunk page
2. Refresh the Splunk page
3. Check manifest.json has correct URL pattern

### Cause 3: Message Listener Not Registered

**Symptom:**
- Service Worker console shows: "Background received message: undefined"
- Or no log at all

**Check:**
- Open Service Worker console
- Look for: "Splunk Detokenizer Background Script loaded"
- If missing, the script didn't load

**Solution:**
1. Check for syntax errors in background.js
2. Look for errors in Service Worker console
3. Reload the extension
4. Check manifest.json points to correct background.js

### Cause 4: Async Response Not Handled

**Symptom:**
- Message is received in background
- Processing starts
- But content script never gets response

**Check:**
- Service Worker console shows: "Processing detokenize request"
- But no "Detokenization complete, sending response"

**Solution:**
This is already fixed in the updated code with `return true;` in the message listener.

---

## Step-by-Step Debugging

### Step 1: Check Extension is Loaded

**In Splunk page console (F12):**
```javascript
// Type this in console:
console.log('Extension ID:', chrome.runtime?.id);
```

**Expected:** Shows extension ID like `"abcdefghijklmnopqrstuvwxyz"`
**If error:** Extension not loaded on this page

### Step 2: Check Background Script Loaded

**In Service Worker console:**
Look for: `"Splunk Detokenizer Background Script loaded"`

**If missing:**
1. Check for errors in red
2. Fix any syntax errors
3. Reload extension

### Step 3: Test Message Passing

**In Splunk page console (F12):**
```javascript
// Type this in console:
chrome.runtime.sendMessage({action: 'test'}, response => {
  console.log('Response:', response);
});
```

**Expected:** No error, response logged (may be undefined)
**If error:** Service worker not responding

### Step 4: Check Full Flow

**Open TWO consoles:**
1. Splunk page (F12)
2. Service Worker (chrome://extensions/ → Service Worker)

**Then click Detokenize and watch BOTH consoles:**

**In Splunk page console, you should see:**
```
Starting detokenization for token: A-202607-1...
Sending message to background script...
Received response: {...}
```

**In Service Worker console, you should see:**
```
Background received message: {action: "detokenize", token: "A-202607-1..."}
Processing detokenize request for token: A-202607-1...
Detokenizing token: A-202607-1...
Opening BlackTab tab with token: A-202607-1...
...
Detokenization complete, sending response: {...}
```

**If you see the message in Service Worker but no response:**
- Check for errors in the detokenization process
- Look for uncaught exceptions
- Check if promise is rejected

---

## Manual Test Script

Run this in Splunk page console to test the full flow:

```javascript
(async () => {
  console.log('=== Manual Extension Test ===');

  // Test 1: Check extension
  console.log('1. Extension ID:', chrome.runtime?.id);

  // Test 2: Send message
  console.log('2. Sending message...');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'detokenize',
      token: 'A-202607-test123'
    });

    console.log('3. Response:', response);

    if (response) {
      console.log('✅ Background responded!');
      if (response.success) {
        console.log('✅ Success:', response.detokenizedValue);
      } else {
        console.log('❌ Error:', response.error);
      }
    } else {
      console.log('⚠️ No response received');
    }

  } catch (error) {
    console.log('❌ Exception:', error.message);

    if (error.message.includes('Could not establish connection')) {
      console.log('💡 Background service worker not responding');
      console.log('💡 Try: Reload extension at chrome://extensions/');
    }
  }
})();
```

---

## The Nuclear Option

If nothing else works:

### Complete Reset

1. **Remove extension:**
   ```
   chrome://extensions/ → Remove extension
   ```

2. **Close all Chrome windows** (fully quit Chrome)

3. **Restart Chrome**

4. **Reload extension:**
   ```
   chrome://extensions/ → Load unpacked → Select folder
   ```

5. **Open Service Worker console immediately:**
   ```
   chrome://extensions/ → Click "Service Worker"
   ```

6. **Verify:** Look for "Splunk Detokenizer Background Script loaded"

7. **Test:** Go to Splunk and try detokenizing

---

## Check Your Files

Make sure these files were updated:

### background.js (Line 5-20)
Should have detailed console.log statements:
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  // ...
  return true; // <- This is critical!
});
```

### content.js (Line 215-250)
Should have timeout and better error handling:
```javascript
const response = await Promise.race([messagePromise, timeoutPromise]);
```

---

## Still Not Working?

If you've tried everything above and it still doesn't work:

### Share This Info:

1. **Service Worker Console Output:**
   - Screenshot or copy/paste everything from Service Worker console
   - Include any errors in red

2. **Splunk Page Console Output:**
   - Copy the logs after clicking "Detokenize"
   - Include the full error message

3. **Extension Status:**
   - Is "Service Worker" showing as active or inactive?
   - Any errors shown on chrome://extensions/?

4. **Test Page Results:**
   - Open test-background.html
   - Run all tests
   - Share the results

With this information, I can identify exactly where the communication is breaking down!

---

## Quick Reference

| Symptom | Most Likely Cause | Quick Fix |
|---------|------------------|-----------|
| "Service Worker (Inactive)" | Worker asleep | Click extension icon |
| No "Background received message" log | Worker not loaded | Reload extension |
| "Could not establish connection" | Worker crashed | Reload extension |
| Message received but no response | Async issue | Check `return true;` in listener |
| Timeout after 60 seconds | Detokenization stuck | Check for infinite loop |

---

**Remember:** The most common fix is simply reloading the extension! Chrome service workers can be finicky.
