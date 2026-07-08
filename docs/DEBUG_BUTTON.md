# Debug Guide - Button Click Issue

## Testing Steps

### 1. Reload Extension
- Go to `chrome://extensions/`
- Click Reload on "Splunk BlackTab Detokenizer"

### 2. Open Splunk Page
- Navigate to your Splunk page
- Open Browser Console (F12)

### 3. Test Button Click

**When you select a token, you should see in console:**
```
Splunk Detokenizer Extension loaded
```

**When the button appears:**
```
(The button should have a pulsing glow animation)
```

**When you click the button, you should see:**
```
=== BUTTON CLICK EVENT ===
Event type: click
Token: A-202607-1nPdsvEgLmOdHwNX...
✅ Processing click - Token length: 47
✅ Button removed from DOM
✅ Text selection cleared
🚀 Starting detokenization...
=== QUICK DETOKENIZE FUNCTION ===
Token: A-202607-1nPdsvEgLmOdHwNX...
Token length: 47
✅ Notification shown
📤 Sending message to background script...
⏳ Waiting for response...
```

**Then in background service worker console:**
```
Background received message: {action: 'detokenize', token: 'A-202607...'}
Processing detokenize request for token: A-202607...
Opening BlackTab page in hidden mode...
```

## If Button Doesn't Work

### Check 1: Is the button appearing?
- Select text in Splunk
- Look for the purple glowing button
- If NO button appears, the token pattern might not match

### Check 2: Is the click registering?
- Click the button
- Open console (F12)
- Look for "=== BUTTON CLICK EVENT ===" message
- If NO message appears, the click handler isn't firing

### Check 3: Is detokenization starting?
- Look for "=== QUICK DETOKENIZE FUNCTION ===" in console
- If NO message appears, the quickDetokenize function isn't being called

### Check 4: Is background script responding?
- Go to `chrome://extensions/`
- Click "Service Worker" under the extension
- Check for error messages
- Should see "Background received message"

## Common Issues

### Issue: Button appears but nothing happens on click
**Solution:** 
- The button might be behind another element
- Try clicking and holding for 1 second
- Look for console logs

### Issue: Button keeps reappearing
**Solution:**
- Clear text selection (click elsewhere)
- Wait 1 second before trying again
- Check for "Button already clicked, ignoring" in console

### Issue: Multiple buttons appear
**Solution:**
- This is the old bug - extension not properly reloaded
- Hard reload: Ctrl+Shift+R
- Remove and re-add extension

### Issue: No notification appears
**Solution:**
- Check if background script is running
- Go to chrome://extensions/ → Service Worker
- Look for errors in that console

## Test Token Examples

Try these token patterns:
1. `A-202607-1nPdsvEgLmOdHwNX1c3U5z5NrDsyOxUoYaB78VzYU-9dEb5-CFeR-hh3vWwFvAAUJnhwuJbaIQqiqGgBPaaJenSfKo__dNhfT4o1lzCWtvm2Mx8EiixsZaW2BBiAOrgvugoxviTOyg`
2. Any string starting with `A-YYMMDD-`
3. Long base64 strings (40+ characters)

## Manual Test

If button still doesn't work, try:
1. Press Ctrl+Shift+D (Cmd+Shift+D on Mac)
2. This opens the full panel
3. Paste token manually
4. Click "Detokenize" button
5. Check if that works

## Next Steps

After clicking the button, please share:
1. Complete console output (F12)
2. Background script console output (chrome://extensions/ → Service Worker)
3. Whether the notification appeared
4. Any error messages

