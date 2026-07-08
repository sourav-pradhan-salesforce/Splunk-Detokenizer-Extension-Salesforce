# Quick Visual Test ⚡

## Step-by-Step Visual Guide

### 1. Is the extension loaded?
Open Splunk page → Press F12 → Look for:
```
Splunk Detokenizer Extension loaded ✅
```

### 2. Does the button appear?
Select this text in Splunk:
```
A-202607-1nPdsvEgLmOdHwNX1c3U5z5NrDsyOxUoYaB78VzYU-9dEb5
```

**Expected:** Purple glowing button appears near your mouse with text "🔓 Detokenize"

**Visual Check:**
- [ ] Button appeared?
- [ ] Button is glowing/pulsing?
- [ ] Button is purple/violet color?
- [ ] Button shows "🔓 Detokenize"?

### 3. Does the button respond to click?
Click the button once.

**Expected Immediate Changes (< 100ms):**
1. Button text changes to "⏳ Processing..."
2. Button becomes semi-transparent (opacity 0.5)
3. Button cannot be clicked again (grayed out)

**Visual Check:**
- [ ] Button text changed to "⏳ Processing..."?
- [ ] Button became lighter/transparent?
- [ ] Button disappeared after ~100ms?

### 4. Does notification appear?
After button disappears, look at top-right corner of page.

**Expected:** Blue notification box appears with:
```
🔓 Detokenizing in background...
```

**Visual Check:**
- [ ] Notification appeared?
- [ ] Notification is at top-right?
- [ ] Notification is blue?
- [ ] Shows "Detokenizing in background..."?

### 5. Does result appear?
Wait 5-10 seconds.

**Expected:** Notification changes to green with detokenized value:
```
✅ [the actual detokenized value]
```

**Visual Check:**
- [ ] Notification changed to green?
- [ ] Shows ✅ checkmark?
- [ ] Shows actual value (not the token)?
- [ ] Can click notification to copy?

## If ANY of these failed, check console (F12)

### Button didn't appear?
**Possible causes:**
- Extension not loaded
- Text doesn't match token pattern
- Another extension blocking

**Console check:** Look for errors

### Button appeared but didn't respond to click?
**Possible causes:**
- Button is behind another element
- Click event not registering
- JavaScript error

**Console check:** Look for "=== BUTTON CLICK EVENT ==="

### Button responded but no notification?
**Possible causes:**
- Notification blocked by another element
- JavaScript error in quickDetokenize
- Background script not running

**Console check:** Look for "=== QUICK DETOKENIZE FUNCTION ==="

### Notification appeared but no result?
**Possible causes:**
- Background script error
- BlackTab page not accessible
- Authentication issue

**Check:** chrome://extensions/ → Service Worker console

## Emergency Fallback

If button method doesn't work, try keyboard shortcut:
1. Select the token text
2. Press **Ctrl+Shift+D** (Cmd+Shift+D on Mac)
3. Full panel should open
4. Token should be pre-filled
5. Click "Detokenize" button in panel

Does this work?
- [ ] YES → Button click issue only
- [ ] NO → Background script issue

## Next Steps

Based on which step failed, we can:
- Step 1 fail → Extension loading issue
- Step 2 fail → Token detection issue  
- Step 3 fail → Button click handler issue ⭐ (most likely)
- Step 4 fail → quickDetokenize function issue
- Step 5 fail → Background script issue

Please let me know which step failed and share the console output!
