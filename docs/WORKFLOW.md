# Extension Workflow - Background Processing

## Before (Old Flow - Visible Redirections)
```
User selects token
   ↓
Click 🔓 button
   ↓
👁️ NEW TAB OPENS (visible redirection)
   ↓
👁️ User sees BlackTab page loading
   ↓
👁️ Form gets filled
   ↓
👁️ Button gets clicked
   ↓
👁️ Result appears
   ↓
Tab closes
   ↓
Result shown in notification
```

## After (New Flow - Hidden Background)
```
User selects token
   ↓
Click 🔓 button
   ↓
🔄 Notification: "Detokenizing in background..."
   ↓
🔒 Background tab opens (hidden, active: false)
   ↓
🔒 Form fills automatically
   ↓
🔒 Button clicks automatically
   ↓
🔒 Result extracted
   ↓
🔒 Tab closes silently (100ms delay)
   ↓
✅ Notification: "✅ [detokenized value]"
   ↓
Click notification → Copied to clipboard!
```

## Button Positioning Fix

### Before (Broken)
```
- position: absolute
- Uses pageX, pageY directly
- No scroll compensation
- Lower z-index
- Button "goes down and down" on scroll
```

### After (Fixed)
```
- position: fixed !important
- Viewport-relative coordinates
- Scroll compensation (scrollX, scrollY)
- z-index: 999999
- Stays in place, always visible
- Better event handling
```

## Technical Implementation

### Background Script Changes:
```javascript
// Create hidden tab
chrome.tabs.create({ url: url, active: false }, async (tab) => {
  // ... process token ...
  
  // Close silently with delay
  setTimeout(() => {
    chrome.tabs.remove(tabId).catch(() => {});
  }, 100);
});
```

### Content Script Changes:
```javascript
// Fixed positioning
btn.style.position = 'fixed';
btn.style.left = `${x - scrollX}px`;
btn.style.top = `${y - scrollY + 20}px`;
btn.style.zIndex = '999999';
```

### CSS Changes:
```css
.quick-detokenize-btn {
  position: fixed !important;
  z-index: 999999 !important;
  /* ... improved styles ... */
}
```
