# Installation Guide - Splunk BlackTab Detokenizer

This guide will walk you through installing and configuring the Chrome extension.

## Prerequisites

1. **Google Chrome** (or Chromium-based browser like Edge, Brave)
2. **Access to Salesforce** - You must be able to login to `bt1.my.salesforce.com`
3. **Access to Splunk** - You must have access to the Splunk instance

## Step-by-Step Installation

### Step 1: Prepare the Extension Files

The extension is located at: `~/splunk-detokenizer-extension/`

Files included:
- `manifest.json` - Extension configuration
- `content.js` - Main script for Splunk pages
- `background.js` - Background service worker
- `styles.css` - UI styling
- `popup.html` - Extension popup interface
- `popup.js` - Popup logic
- `icons/` - Extension icons (optional)

### Step 2: Create Icons (Optional)

The extension works without icons, but for a better experience:

**Quick method using online tools:**
1. Go to https://www.favicon-generator.org/
2. Upload the 🔓 emoji as an image (take a screenshot if needed)
3. Download the generated icon pack
4. Copy `icon-16.png`, `icon-48.png`, and `icon-128.png` to the `icons/` folder
5. Rename them to `icon16.png`, `icon48.png`, `icon128.png`

**Or skip this step** - Chrome will use a default icon.

### Step 3: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Enter `chrome://extensions/` in the address bar
   - Or: Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode**
   - Look for the "Developer mode" toggle in the top-right corner
   - Turn it **ON**

3. **Load the Extension**
   - Click the **"Load unpacked"** button
   - Navigate to: `/Users/sourav.pradhan/splunk-detokenizer-extension/`
   - Click **"Select"** or **"Open"**

4. **Verify Installation**
   - The extension should appear in your list
   - Status should show "Enabled"
   - You should see the extension icon in your toolbar (or in the extensions menu)

### Step 4: Pin the Extension (Optional)

1. Click the **Extensions icon** (puzzle piece) in Chrome toolbar
2. Find "Splunk BlackTab Detokenizer"
3. Click the **pin icon** to keep it visible

### Step 5: Grant Permissions

When you first use the extension, Chrome may ask for permissions:
- ✓ Access to Splunk site
- ✓ Access to Salesforce site
- ✓ Storage access
- ✓ Cookie access

Click **"Allow"** for all permissions.

## Configuration

### Verify Salesforce Authentication

Before using the detokenizer:

1. Open a new tab
2. Navigate to `https://bt1.my.salesforce.com`
3. Log in with your credentials
4. Keep this tab open (or at least stay logged in)

The extension uses your existing Salesforce session.

### Test the Extension

1. Navigate to your Splunk instance:
   ```
   https://splunk-web.log-analytics.monitoring.aws-esvc1-useast2.aws.sfdc.cl
   ```

2. Look for any tokenized value in the logs

3. Select the text

4. You should see a **"🔓 Detokenize"** button appear if the text looks like a token

## Usage Methods

### Method 1: Text Selection (Easiest)
1. Select tokenized text in Splunk
2. Click the "🔓 Detokenize" button that appears
3. View the detokenized value

### Method 2: Keyboard Shortcut (Fastest)
1. Select tokenized text
2. Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
3. Panel opens automatically

### Method 3: Context Menu
1. Right-click on selected text
2. Choose "Detokenize with BlackTab"

### Method 4: Extension Icon
1. Click the extension icon in toolbar
2. Click "Open Detokenizer Panel"
3. Manually paste token

## Troubleshooting

### Extension Not Loading

**Problem:** Extension doesn't appear after loading

**Solutions:**
- Check that you selected the correct folder (should contain `manifest.json`)
- Look for errors in the Extensions page under the extension
- Try reloading: Click the refresh icon on the extension card

### Extension Icon Not Showing

**Problem:** No icon in toolbar

**Solutions:**
- Icons are optional - the extension works without them
- Check the Extensions menu (puzzle piece icon)
- Pin the extension to make it visible
- Add icon files to the `icons/` folder (see icons/README.md)

### Detokenization Not Working

**Problem:** "Not authenticated to Salesforce" error

**Solutions:**
1. Open `https://bt1.my.salesforce.com` in a new tab
2. Log in
3. Return to Splunk and try again

**Problem:** Token not being detected

**Solutions:**
- Token may not match detection patterns
- Use Manual method (click extension icon → paste token)
- Check console for errors (F12 → Console tab)

**Problem:** Detokenization takes too long or times out

**Solutions:**
- This is normal - it takes 10-15 seconds
- Check your network connection
- Verify BlackTab tool is accessible
- Check browser console for detailed errors

### Permission Errors

**Problem:** Extension asks for permissions repeatedly

**Solutions:**
- Accept all permissions when prompted
- Check if any security software is blocking
- Try removing and re-adding the extension

### BlackTab Integration Issues

**Problem:** Can't extract detokenized value

**Solutions:**
1. Check if BlackTab URL is correct in `background.js`
2. BlackTab page structure may have changed
3. Open BlackTab manually to verify it's working
4. Check browser console for specific errors

## Advanced Configuration

### Customize Token Detection Patterns

Edit `content.js`, find the `isLikelyToken()` function around line 120:

```javascript
function isLikelyToken(text) {
  const tokenPatterns = [
    /^[A-Za-z0-9+/=]{20,}$/,  // Base64-like
    /^[0-9a-fA-F]{16,}$/,      // Hex strings
    /tok_[A-Za-z0-9_-]+/,      // Token prefixes
    // Add your patterns here
  ];
  return tokenPatterns.some(pattern => pattern.test(text));
}
```

After editing:
1. Save the file
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Test on Splunk

### Change BlackTab URL

If you use a different Salesforce instance:

Edit `background.js`, find line ~15:

```javascript
const detokenizerUrl = 'https://YOUR-INSTANCE.salesforce.com/admin/framework/action.apexp?entryPoint=BlackTab_UI&actionName=Detokenizer';
```

### Update for Different Splunk Instance

Edit `manifest.json`, update the URLs:

```json
"matches": ["https://YOUR-SPLUNK-INSTANCE/*"]
```

## Updating the Extension

When you make changes:

1. Save your edited files
2. Go to `chrome://extensions/`
3. Find your extension
4. Click the **refresh/reload icon** (circular arrow)
5. Test the changes

## Uninstalling

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Splunk BlackTab Detokenizer"
3. Click **"Remove"**
4. Confirm removal

The extension folder will remain on your computer - you can delete it manually if desired.

## Getting Help

### Check Browser Console

For detailed error messages:
1. Open Splunk page
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for errors in red

### Check Background Script Console

For background script errors:
1. Go to `chrome://extensions/`
2. Find your extension
3. Click **"Service Worker"** link
4. Check the console that opens

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Not authenticated to Salesforce" | Not logged in | Login to bt1.my.salesforce.com |
| "Failed to fetch detokenized value" | Network or access issue | Check network, verify BlackTab access |
| "Element not found" | BlackTab page structure changed | May need code update |
| "Tab load timeout" | Page took too long to load | Retry, check network |

## Security Notes

- Extension only runs on specified Splunk and Salesforce domains
- Uses your existing browser authentication
- No data sent to external servers
- All processing happens locally in your browser
- Detokenized values are only stored temporarily in memory

## Next Steps

After successful installation:

1. Test with a known tokenized value
2. Adjust token detection patterns if needed
3. Set up keyboard shortcuts in your workflow
4. Report any issues or suggestions for improvement

---

**Need Help?**
- Check the main README.md for detailed documentation
- Review the code comments for technical details
- Contact your internal tools team for support
