# 🧪 Testing Guide - Step by Step

## Before Testing:

### 1. Reload Extension
```
chrome://extensions/ → Find "Splunk BlackTab Detokenizer" → Click RELOAD (🔄)
```

### 2. Open Service Worker Console
```
chrome://extensions/ → Click "service worker" (blue link)
```
Keep this console open - it will show all automation logs!

### 3. Refresh Splunk Page
```
Go to your Splunk tab → Press F5
```

---

## Testing:

### 4. Select a Token
Find a token like: `A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM`

### 5. Click Detokenize
The floating "🔓 Detokenize" button should appear - click it!

### 6. Watch What Happens

**You should see:**
- New tab opens to BlackTab (stays open for 5 seconds)
- Splunk panel shows "Loading..."
- Wait 10-15 seconds
- Result appears!

---

## 📊 What to Check:

### In Service Worker Console:
```
✅ Background received message: {action: "detokenize", token: "A-202607-2..."}
✅ Processing detokenize request for token: A-202607-2...
✅ User is authenticated to Salesforce
✅ Opening BlackTab page...
✅ Tab created: 123456
✅ Waiting for page to load...
✅ Page loaded
✅ Injecting automation script...
✅ SUCCESS! Detokenized value: ...
```

### In BlackTab Tab Console (F12 on the new tab):
```
✅ === AUTOMATION STARTED ===
✅ Token: A-202607-2...
✅ Starting automation steps...
✅ STEP 1: Looking for token input field...
✅ Found 1 textareas
✅ Using first textarea as token field
✅ ✓ Token entered into field: A-202607-2...
✅ STEP 2: Looking for "Perform Operation" button...
✅ Found 3 clickable elements
✅   Button text: Perform Operation
✅ ✓ Found perform button!
✅ Clicking button: Perform Operation
✅ ✓ Clicked "Perform Operation" button
✅ STEP 3: Waiting for result...
✅ Still checking for result, attempt 5/50
✅ ✓ FOUND RESULT in textarea: john.doe@example.com
```

---

## 🐛 If It Fails:

### Error: "No result from automation script"
**This means the automation function didn't return anything.**

**Check:**
1. Open the BlackTab tab that opened
2. Press F12 to open console
3. Look for errors or logs
4. **Share the console output with me!**

### Error: "Timeout waiting for result"
**The automation ran but couldn't find the result field.**

**Check:**
1. Did the "Perform Operation" button get clicked?
2. Did the result appear on the BlackTab page?
3. **Share what you see on the BlackTab page!**

### Error: "Could not find token input field"
**The page structure is different than expected.**

**Check:**
1. Open BlackTab manually: https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
2. Press F12 and run: `document.querySelectorAll('textarea')`
3. **Share how many textareas exist!**

---

## 🔍 Manual Testing on BlackTab:

To understand the page structure, open the BlackTab page manually and test in console:

```javascript
// Check textareas
console.log('Textareas:', document.querySelectorAll('textarea').length);
document.querySelectorAll('textarea').forEach((t, i) => {
  console.log(i, 'ID:', t.id, 'Name:', t.name, 'Placeholder:', t.placeholder);
});

// Check buttons
console.log('Buttons:', document.querySelectorAll('button').length);
document.querySelectorAll('button').forEach((b, i) => {
  console.log(i, 'Text:', b.textContent.trim());
});

// Fill token manually
document.querySelectorAll('textarea')[0].value = 'A-202607-TEST';

// Click button manually
const buttons = document.querySelectorAll('button');
for (let b of buttons) {
  if (b.textContent.includes('Perform')) {
    b.click();
    console.log('Clicked!');
    break;
  }
}

// Check result after 5 seconds
setTimeout(() => {
  document.querySelectorAll('textarea').forEach((t, i) => {
    console.log(i, 'Value:', t.value);
  });
}, 5000);
```

**Run this in the BlackTab page console and share the output!**

---

## ✅ Success Looks Like:

1. Click "Detokenize" on Splunk
2. Tab opens in background (you stay on Splunk)
3. Panel shows "Loading..." for 10-15 seconds
4. Result appears: `john.doe@example.com` (or whatever the detokenized value is)
5. Click "Copy to Clipboard" to copy the result
6. Background tab closes after 5 seconds

**You never leave Splunk page!** ✨

---

## 📋 What to Share If It Fails:

1. **Service Worker console logs** (the main logs)
2. **BlackTab tab console logs** (F12 on the tab that opens)
3. **What you see on the BlackTab page** (screenshot or description)
4. **Error message in Splunk panel** (if any)

This will help me fix the exact issue!
