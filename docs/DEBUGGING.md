# Debugging Guide - Splunk BlackTab Detokenizer

## Issue: Extension doesn't detokenize anything

### Step-by-Step Debugging

#### 1. Reload the Extension

After the code updates, you MUST reload the extension:

1. Go to `chrome://extensions/`
2. Find "Splunk BlackTab Detokenizer"
3. Click the **refresh/reload icon** (circular arrow)
4. Confirm it says "Errors: 0"

#### 2. Check if Background Script is Running

1. Go to `chrome://extensions/`
2. Find your extension
3. Click **"Service Worker"** (it will open a console)
4. You should see: `"Splunk Detokenizer Background Script loaded"`

Keep this console open while testing!

#### 3. Test Detokenization with Console Open

1. Open Splunk in a new tab
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Open the detokenizer panel (click extension icon or use Ctrl+Shift+D)
5. Enter a test token
6. Click "Detokenize"
7. Watch BOTH consoles:
   - **Splunk page console** (F12)
   - **Background worker console** (from step 2)

#### 4. What to Look For

**In Splunk Page Console (F12):**
```
Starting detokenization for token: ABC123...
Sending message to background script...
Received response: {success: true/false, ...}
```

**In Background Worker Console:**
```
Detokenizing token: ABC123...
Opening BlackTab tab with token: ABC123...
Tab created: 123456
Waiting for tab to load...
Tab loaded, injecting script...
Page structure: {...}
Script execution results: {...}
```

#### 5. Understanding the Output

**A. If you see "Page structure" logged:**

This shows what the extension found on the BlackTab page:
```javascript
{
  title: "...",
  inputs: [...],  // All input fields found
  textareas: [...],  // All textarea fields
  buttons: [...],  // All buttons found
  allElements: [...]  // All elements with IDs
}
```

Look at this output and identify:
- Which input field should receive the token?
- Which button should be clicked?
- Where does the result appear?

**B. If you see an error:**

Common errors and solutions:

| Error | Meaning | Solution |
|-------|---------|----------|
| "Not authenticated to Salesforce" | Not logged in | Login to bt1.my.salesforce.com |
| "Element not found" | Can't find input/button | Check page structure output |
| "Tab load timeout" | Page taking too long | Check network, increase timeout |
| "Failed to extract detokenized value" | Can't find result element | Check page structure |

### Manual Testing Approach

If automation isn't working, let's manually inspect the BlackTab page:

#### Step 1: Open BlackTab Manually

1. Open this URL in a new tab:
   ```
   https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
   ```

2. Look at the page and identify:
   - **Where do you enter the token?** (input field, textarea?)
   - **What button do you click?** (text on button?)
   - **Where does the result appear?** (in a div, textarea, pre tag?)

#### Step 2: Inspect Elements

1. Right-click on the input field → **Inspect**
2. Note the selector (look for `id`, `name`, `class`, or `type` attributes)
3. Do the same for the button
4. Do the same for the result area

#### Step 3: Share the Selectors

Once you identify the selectors, you can update the code. For example:

**Input field examples:**
```html
<input id="tokenInput" type="text">        → Selector: #tokenInput
<textarea name="token"></textarea>          → Selector: textarea[name="token"]
<input class="token-field" type="text">    → Selector: .token-field
```

**Button examples:**
```html
<button id="detokenizeBtn">Detokenize</button>     → Selector: #detokenizeBtn
<input type="submit" value="Submit">               → Selector: input[type="submit"]
<button class="btn-primary">Go</button>            → Selector: button.btn-primary
```

**Result examples:**
```html
<div id="result"></div>                    → Selector: #result
<pre class="output"></pre>                 → Selector: pre.output
<textarea id="detokenized"></textarea>     → Selector: #detokenized
```

### Update the Code with Correct Selectors

Once you know the selectors, edit `background.js`:

1. Find the `interactWithDetokenizer` function (around line 150)
2. Update the selectors:

```javascript
// Update inputSelectors array (line ~155)
const inputSelectors = [
  '#YOUR_INPUT_ID',           // ← Add your specific selector here first
  'input[type="text"]',
  'textarea',
  // ... rest of fallbacks
];

// Update buttonSelectors array (line ~175)
const buttonSelectors = [
  '#YOUR_BUTTON_ID',          // ← Add your specific selector here first
  'button',
  'input[type="submit"]',
  // ... rest of fallbacks
];

// Update resultSelectors array (line ~190)
const resultSelectors = [
  '#YOUR_RESULT_ID',          // ← Add your specific selector here first
  '.result',
  '.output',
  // ... rest of fallbacks
];
```

3. Save the file
4. Reload the extension (chrome://extensions/)
5. Test again

### Current Extension Behavior (After Updates)

The extension now:

1. **Opens BlackTab in a VISIBLE tab** so you can see what's happening
2. **Logs detailed information** to console
3. **Inspects page structure** before attempting automation
4. **Keeps tab open for 5 seconds** so you can see the result
5. **Returns detailed error messages** if something fails

### Quick Diagnostic Commands

Run these in the Splunk page console to test:

```javascript
// Test if extension is loaded
console.log('Extension loaded:', typeof chrome.runtime !== 'undefined');

// Test message passing
chrome.runtime.sendMessage({action: 'ping'}, response => {
  console.log('Background response:', response);
});

// Test if panel exists
console.log('Panel exists:', document.getElementById('detokenizer-panel') !== null);
```

### Common Issues and Fixes

#### Issue 1: BlackTab Page Structure Changed

**Symptom:** Error says "Element not found"

**Fix:**
1. Follow "Manual Testing Approach" above
2. Identify correct selectors
3. Update `background.js` with correct selectors
4. Reload extension

#### Issue 2: BlackTab Requires Login

**Symptom:** "Not authenticated" error

**Fix:**
1. Open `https://bt1.my.salesforce.com` in new tab
2. Login with your credentials
3. Keep that tab open
4. Try detokenization again

#### Issue 3: Result Not Extracted

**Symptom:** Tab opens, automation runs, but no result shown

**Possible causes:**
- Result appears in a different element than expected
- Result takes longer to load than timeout
- Result is in an iframe

**Fix:**
1. Check the "Page structure" log
2. Manually identify where result appears
3. Update `resultSelectors` in code
4. If result is in iframe, more complex code needed

#### Issue 4: CORS/Security Errors

**Symptom:** "Access denied" or CORS errors in console

**Fix:**
- Make sure extension has permissions in `manifest.json`
- Check that BlackTab URL is in `host_permissions`

### Alternative: Manual Detokenization

If automation continues to fail, you can use the extension to just open BlackTab:

1. Click extension icon
2. Copy your token
3. Extension opens BlackTab tab
4. Manually paste token
5. Click detokenize
6. Copy result back

Still faster than doing it all manually!

### Getting More Help

If still stuck, provide these details:

1. **Console logs** from both:
   - Splunk page console (F12)
   - Background worker console

2. **Page structure output** from the inspection

3. **BlackTab page HTML** around the input/button/result areas

4. **Screenshots** of:
   - The BlackTab page
   - The console errors
   - The extension panel

---

## Quick Test Script

Run this in Splunk page console to test the full flow:

```javascript
// Test the extension end-to-end
(async () => {
  console.log('Testing extension...');
  
  const testToken = 'TEST_TOKEN_123';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'detokenize',
      token: testToken
    });
    
    console.log('Success:', response);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

Watch both consoles to see where it fails!
