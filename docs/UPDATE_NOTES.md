# ✅ Extension Updated - Correct URL

## What Changed

The BlackTab Detokenizer URL has been updated to the correct endpoint:

**Old (incorrect):**
```
https://bt1.my.salesforce.com/admin/framework/action.apexp?entryPoint=BlackTab_UI&actionName=Detokenizer
```

**New (correct):**
```
https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
```

## What You Need to Do

### 1. Reload the Extension ⚠️

**This is critical!** The extension won't use the new URL until you reload it.

```
1. Go to chrome://extensions/
2. Find "Splunk BlackTab Detokenizer"
3. Click the RELOAD button (circular arrow icon)
```

### 2. Test Again

1. Open Splunk page
2. Open DevTools (F12) to see console logs
3. Click extension icon or press Ctrl+Shift+D
4. Enter a test token
5. Click "Detokenize"
6. **A new tab will open** to the correct tokenizer page

### 3. What You Should See

When you click "Detokenize":

1. **New tab opens** to: `https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp`
2. **Tab stays open** for 5 seconds so you can see what's happening
3. **Console logs** show the page structure and automation steps
4. **Extension attempts** to fill the form automatically

### 4. If It Still Doesn't Work

The extension will now:
- Log the page structure to console
- Show you all input fields, buttons, and elements on the page
- Keep the tab open so you can see what's there

**Check the console** for the "Page structure" log. It will show:
```javascript
{
  inputs: [...],      // All input fields found
  buttons: [...],     // All buttons found
  textareas: [...]   // All text areas found
}
```

Then you can tell me what you see, and I'll update the selectors to match!

## Quick Test

After reloading the extension, test with any token value:

1. Open Splunk
2. Press F12 (open console)
3. Click extension icon
4. Enter: `test123` (or any value)
5. Click "Detokenize"
6. Watch what happens in the new tab
7. Check console for "Page structure" output

## Manual Test (to verify URL works)

Before testing the extension, verify you can access the page manually:

1. Open: https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
2. Make sure you're logged in
3. Try manually detokenizing a test value
4. Note how the page works (input field, button, result display)

## Next Steps

Once the tab opens to the correct page:

1. Look at the page structure in console
2. Share what you see in the tokenizer page (screenshot helps!)
3. I can then update the selectors to match the actual HTML structure

The hardest part is done - we now have the correct URL! The rest is just matching the selectors to the page structure.

---

**Updated Files:**
- `background.js` - Line 20 - New URL
- `DEBUGGING.md` - Updated references

**Action Required:**
- Reload extension in Chrome
- Test with new URL
