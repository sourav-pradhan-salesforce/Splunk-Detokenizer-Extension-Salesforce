# ✅ Updated to Match BlackTab Workflow

## What Changed:

The extension now follows the exact BlackTab workflow:

### Step 1: Select "Detokenize" Operation
- Looks for operation dropdown/radio buttons
- Selects "Detokenize"

### Step 2: Enter Token
- Finds the Token input field/textarea
- Enters your selected token

### Step 3: Click "Perform Operation"
- Finds the "Perform Operation" button
- Clicks it

### Step 4: Extract Result
- Waits for result to appear
- Extracts the detokenized value
- Shows it in the panel on Splunk page

---

## 🚀 What You Need to Do:

### Step 1: Reload Extension (CRITICAL!)
```
1. Go to chrome://extensions/
2. Find "Splunk BlackTab Detokenizer"
3. Click RELOAD (🔄)
4. Check "Errors: 0"
```

### Step 2: Refresh Splunk Page
```
1. Go to your Splunk tab
2. Press F5 (or Ctrl+R / Cmd+R)
3. Wait for page to reload
```

### Step 3: Test It!
```
1. Find a token in Splunk: A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
2. SELECT the token
3. Click "🔓 Detokenize" button (or Ctrl+Shift+D)
4. Watch it work!
```

---

## 🔍 What Will Happen:

### You'll See:
1. **New tab opens** to: `https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp`
2. **Tab stays open** for 5 seconds so you can watch
3. **Extension automatically**:
   - Selects "Detokenize" operation
   - Enters your token
   - Clicks "Perform Operation"
   - Waits for result
   - Extracts detokenized value
4. **Result appears** in floating panel on Splunk page
5. **Click "Copy"** to copy to clipboard

### In Console (F12):
Open Service Worker console to see:
```
Step 1: Looking for operation selector (Detokenize)...
Found operation selector: SELECT
Selected Detokenize operation from dropdown
Step 2: Looking for Token input field...
Found token input: TEXTAREA
Token entered successfully
Step 3: Looking for "Perform Operation" button...
Found "Perform Operation" button by text
Button clicked! Waiting for result...
Found result element: TEXTAREA result
Detokenized value: john.doe@example.com
```

---

## 🎯 Updated Code Logic:

The `interactWithDetokenizer()` function now:

### 1. Finds Operation Selector
```javascript
// Looks for dropdown or radio buttons
select[name*="operation"]
select[id*="operation"]
input[type="radio"][value*="detokenize"]
```

### 2. Selects "Detokenize"
```javascript
// If dropdown:
operationElement.value = "detokenize_option_value";

// If radio:
operationElement.checked = true;
```

### 3. Finds Token Field
```javascript
// Looks for textarea or input with "token" in name/id
textarea[name*="token"]
textarea[id*="token"]
input[name*="token"]
```

### 4. Enters Token
```javascript
tokenInput.value = token;
tokenInput.dispatchEvent(new Event('change'));
```

### 5. Finds "Perform Operation" Button
```javascript
// Searches all buttons for text containing "perform" and "operation"
const allButtons = document.querySelectorAll('button, input[type="submit"]');
for (let btn of allButtons) {
  if (btnText.includes('perform') && btnText.includes('operation')) {
    return btn;
  }
}
```

### 6. Clicks Button
```javascript
button.click();
```

### 7. Waits for Result (up to 20 seconds)
```javascript
// Looks for result in textarea, div, or pre element
textarea[name*="result"]
div[id*="result"]
pre, code
textarea[readonly]
```

### 8. Extracts Value
```javascript
// If textarea/input: gets .value
// If div/pre: gets .textContent
detokenizedValue = resultElement.value || resultElement.textContent;
```

---

## 🐛 Debugging:

### If It Still Times Out:

**Open Service Worker Console** (chrome://extensions/ → Service Worker) and look at the logs. It will show:

**Success Path:**
```
Step 1: Looking for operation selector...
Found operation selector: SELECT
Step 2: Looking for Token input field...
Found token input: TEXTAREA token
Step 3: Looking for "Perform Operation" button...
Found button: Perform Operation
Step 4: Waiting for result...
Found result element: TEXTAREA result
Detokenized value: [actual value]
```

**If It Fails:**
```
Step 1: Looking for operation selector...
Error: None of these selectors found: [list of selectors]
```

This tells you exactly which step failed!

**Then share the pageInfo object** that gets logged - it shows all inputs, buttons, and textareas on the page.

---

## 📊 What's Improved:

### Better Element Detection:
- ✅ Checks if elements are visible (`offsetParent !== null`)
- ✅ Case-insensitive searches (`*="token" i`)
- ✅ Searches by text content for buttons
- ✅ Handles both dropdowns and radio buttons
- ✅ Works with textareas and inputs

### Better Result Extraction:
- ✅ Checks if result is in `value` (textarea/input)
- ✅ Or in `textContent` (div/pre)
- ✅ Waits up to 20 seconds for result
- ✅ Validates result is not empty

### Better Error Reporting:
- ✅ Shows which step failed
- ✅ Logs all page elements (inputs, buttons, textareas)
- ✅ Provides specific selector that didn't work

---

## ⚡ Timeline:

```
1. Reload extension (30 seconds)
2. Refresh Splunk page (5 seconds)
3. Select token (2 seconds)
4. Click Detokenize (1 second)
5. Automation runs (10-15 seconds)
6. Result appears (instant)

Total: ~20-25 seconds from click to result
```

---

## 🎉 Expected Result:

After following the steps above:

1. ✅ Extension opens correct URL
2. ✅ Selects "Detokenize" operation
3. ✅ Enters your token
4. ✅ Clicks "Perform Operation"
5. ✅ Extracts result
6. ✅ Shows in panel on Splunk
7. ✅ You can copy to clipboard

**This should work now!**

---

## 📝 If It Still Doesn't Work:

Share the **Service Worker console output**. It will show exactly which step failed and what elements are on the page.

The error will now include:
```javascript
{
  success: false,
  error: "Step that failed",
  pageInfo: {
    allInputs: [...],     // All inputs with id/name
    allButtons: [...],    // All buttons with text/id
    allTextareas: [...]   // All textareas with id/name
  }
}
```

With this info, I can see exactly what's on the page and adjust the selectors!

---

## 🔄 Remember:

**After ANY code change:**
1. Reload extension at chrome://extensions/
2. Refresh Splunk page (F5)
3. Test again

**Don't skip the page refresh!** This is the most common mistake.

---

**The code is updated and ready! Just reload the extension and refresh your Splunk page, then test!** 🚀
