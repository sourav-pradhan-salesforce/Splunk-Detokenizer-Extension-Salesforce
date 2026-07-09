# 🎯 Final Setup Guide - Everything You Need

## ✅ What's Been Fixed

1. **Correct URL**: Now uses `https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp`
2. **Token Detection**: Updated to detect Salesforce GDPR tokens like `A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM`
3. **Better Debugging**: Console logs show exactly what's happening
4. **Visual Tab**: Opens detokenizer in visible tab so you can see the process

---

## 🚀 Quick Start (3 Steps)

### Step 1: Reload Extension
```
1. Go to chrome://extensions/
2. Find "Splunk BlackTab Detokenizer"  
3. Click the RELOAD button (🔄 circular arrow)
4. Make sure it shows "Errors: 0"
```

### Step 2: Login to Salesforce
```
1. Open: https://bt1.my.salesforce.com
2. Login with your credentials
3. Keep this tab open (or stay logged in)
```

### Step 3: Test on Splunk
```
1. Go to Splunk: https://splunk-web.log-analytics.monitoring.aws-esvc1-useast2.aws.sfdc.cl
2. Find a log entry with a token like: A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
3. SELECT the token with your mouse
4. Click the "🔓 Detokenize" button that appears
   OR press Ctrl+Shift+D (Cmd+Shift+D on Mac)
```

---

## 🎯 How It Works

### Token Detection

The extension now recognizes these token formats:

✅ **Salesforce GDPR Tokens** (Primary):
```
A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
Pattern: A-YYMMDD-[base64string]
```

✅ **Long Base64 Strings** (40+ characters):
```
dGhpc19pc19hX3Rlc3RfdG9rZW5fdGhhdF9pc19sb25nX2Vub3VnaF90b19iZV9kZXRlY3RlZA==
```

✅ **Hex Strings** (32+ characters):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Detokenization Flow

1. **You select** a token in Splunk logs
2. **Extension detects** it matches a token pattern
3. **Button appears** near your selection: "🔓 Detokenize"
4. **You click** the button (or press Ctrl+Shift+D)
5. **Extension opens** BlackTab detokenizer in new tab
6. **Automation runs**:
   - Finds input field
   - Enters your token
   - Clicks detokenize button
   - Extracts result
7. **Result displays** in floating panel on Splunk page
8. **You copy** the detokenized value to clipboard

---

## 🎮 Usage Methods

### Method 1: Quick Button (Recommended)
```
1. SELECT token text in Splunk
2. "🔓 Detokenize" button appears
3. CLICK the button
4. Wait 10-15 seconds
5. Result appears in panel
```

### Method 2: Keyboard Shortcut (Fastest)
```
1. SELECT token text in Splunk
2. Press Ctrl+Shift+D (or Cmd+Shift+D)
3. Panel opens automatically
4. Result appears after processing
```

### Method 3: Context Menu
```
1. SELECT token text in Splunk
2. RIGHT-CLICK
3. Choose "Detokenize with BlackTab"
4. Result appears in panel
```

### Method 4: Manual Entry
```
1. CLICK extension icon in toolbar
2. Click "Open Detokenizer Panel"
3. PASTE token manually
4. Click "Detokenize"
5. Result appears in panel
```

---

## 🔍 Debug Mode

The extension now includes built-in debugging:

### Console Logs (Press F12)

**In Splunk Page Console:**
```
Starting detokenization for token: A-202607...
Sending message to background script...
Received response: {success: true, detokenizedValue: "..."}
```

**In Background Worker Console** (chrome://extensions/ → Service Worker):
```
Detokenizing token: A-202607...
Opening BlackTab tab with token: A-202607...
Tab created: 123456
Page structure: {inputs: [...], buttons: [...]}
Script execution results: {...}
```

### What the "Page Structure" Shows

When you test, look for this in the console:
```javascript
{
  title: "Tokenizer",
  inputs: [
    {type: "text", id: "tokenInput", name: "token", ...}
  ],
  buttons: [
    {text: "Detokenize", id: "detokenizeBtn", ...}
  ],
  allElements: [...]
}
```

This tells us exactly what's on the detokenizer page!

---

## 🐛 Troubleshooting

### Issue: Button Doesn't Appear

**Cause:** Token doesn't match detection patterns

**Fix:**
1. Make sure token format matches one of the patterns above
2. Try manual method (click extension icon → paste token)
3. Check console for "Token detected:" logs

### Issue: "Not Authenticated" Error

**Cause:** Not logged into Salesforce

**Fix:**
1. Open https://bt1.my.salesforce.com in new tab
2. Login with your credentials
3. Keep tab open or stay logged in
4. Try detokenization again

### Issue: Tab Opens But Nothing Happens

**Cause:** Extension can't find the form elements

**Fix:**
1. Check console for "Page structure" output
2. Share the output with me
3. I'll update the selectors to match

### Issue: Result Not Displayed

**Cause:** Extension can't find the result element

**Fix:**
1. Watch the tab that opens
2. Does the detokenization work manually on that page?
3. Check console for errors
4. Share what you see

---

## 📊 Expected Behavior

### First Test Run

1. **Tab Opens**: New tab opens to detokenizer page (visible)
2. **Console Logs**: You see "Page structure" in console
3. **Tab Stays Open**: For 5 seconds so you can see what happens
4. **Automation Attempts**: Extension tries to fill form
5. **Result**: Either success or detailed error message

### After First Successful Run

1. **Tab Opens**: Still visible (for transparency)
2. **Faster**: Automation completes in 10-15 seconds
3. **Result Appears**: In floating panel on Splunk page
4. **Copy**: Click "Copy to Clipboard" button

---

## 🎨 Example Tokens to Test

Try these token formats:

**Salesforce GDPR Token:**
```
A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
```

**Long Base64:**
```
dGhpc19pc19hX3Rlc3RfdG9rZW5fdGhhdF9pc19sb25nX2Vub3VnaA==
```

**If your tokens look different**, update the pattern in `content.js` line ~129

---

## 📝 Next Steps If It Still Doesn't Work

After reloading and testing:

### Step 1: Open the Detokenizer Manually
```
https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
```

### Step 2: Test Manual Detokenization
- Can you manually enter a token and detokenize it?
- Where is the input field?
- What button do you click?
- Where does the result appear?

### Step 3: Share Details
Provide:
1. **Screenshot** of the detokenizer page
2. **Console output** showing "Page structure"
3. **Description**: Where is input? button? result?

### Step 4: I'll Update Selectors

Once I see the actual page structure, I can update the selectors in `background.js` to match exactly what's on the page. Takes about 2 minutes!

---

## 🎯 Success Criteria

You'll know it's working when:

✅ Token in Splunk is highlighted
✅ "🔓 Detokenize" button appears
✅ Clicking button opens detokenizer tab
✅ Tab shows the tokenizer page loading
✅ Result appears in floating panel on Splunk
✅ "Copy to Clipboard" button works

---

## 📚 Additional Resources

- **Quick Reference**: `QUICK_FIX.md`
- **Detailed Debugging**: `DEBUGGING.md`
- **Technical Details**: `TECHNICAL.md`
- **Full Documentation**: `README.md`

---

## ⚡ TL;DR - Do This Now

```bash
# 1. Reload extension
chrome://extensions/ → Find extension → Click RELOAD

# 2. Test it
Go to Splunk → Select a token like:
A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
→ Click "🔓 Detokenize" button → Wait for result
```

**If it works:** 🎉 You're done!

**If it doesn't:** Share the "Page structure" from console + screenshot of detokenizer page.

---

**Remember:** The extension now uses the correct URL and detects the right token format. You just need to reload it first!
