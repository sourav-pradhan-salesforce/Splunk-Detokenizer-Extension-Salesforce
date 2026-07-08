# Changes - Truly Invisible Detokenization (v1.2.0)

## 🎉 MAJOR UPDATE - Completely Hidden Processing!

The extension now detokenizes tokens in a **completely invisible minimized window** - you won't see ANY tabs, windows, or BT1 pages! 

### Key Improvements:

1. **Truly Invisible Processing**: Uses a minimized popup window (`state: 'minimized'`) - completely invisible to user!
2. **No Visible Tabs**: Previous versions showed an inactive tab in the tab bar - now you see NOTHING!
3. **No BT1 Page Visible**: The BlackTab page loads, processes, and closes without ever being visible
4. **Instant Notifications**: Shows a compact notification with the detokenized value directly
5. **Click to Copy**: Click on the success notification to copy the detokenized value
6. **Enhanced Button**: Pulsing glow animation, better click handling, visual feedback
7. **Fixed Button Issue**: The quick detokenize button no longer "goes down and down" - now uses fixed positioning with proper z-index

### How It Works:

1. Select a tokenized value in Splunk
2. Click the "🔓 Detokenize" button that appears
3. A loading notification appears: "🔓 Detokenizing..."
4. The extension silently opens BlackTab in background, fills token, clicks button, extracts result
5. Success notification shows: "✅ [detokenized-value]"
6. Click the notification to copy the value
7. Notification auto-hides after 10 seconds

### Error Handling:

- If there's an error, you'll see: "❌ [error message]"
- The background tab closes immediately even on errors
- No more waiting or manual cleanup

## How to Update the Extension:

1. Go to `chrome://extensions/`
2. Find "Splunk BlackTab Detokenizer"
3. Click the **Reload** button (circular arrow icon)
4. Refresh your Splunk page
5. Try selecting and detokenizing a token - it should be seamless now!

## Fallback:

The full panel UI is still available if needed:
- Press `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to open the manual panel
- Or click the extension icon in your toolbar
