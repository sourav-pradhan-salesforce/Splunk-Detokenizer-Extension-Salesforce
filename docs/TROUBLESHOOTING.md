# Troubleshooting Guide

## Common Issues

### Issue: Extension hangs at "Detokenizing... Check background tab if you need to login"

**Symptoms:**
- Notification shows loading message forever
- Background tab stuck on redirect/auth page
- Never reaches the tokenizer page
- Logs show: "⏳ On login/auth/redirect page, waiting..."

**Root Cause:**
The extension is waiting for the actual tokenizer page but getting stuck on intermediate redirect/auth pages.

**Known Redirect URLs:**
- `?ec=302&startURL=...` - Salesforce redirect
- `/secur/frontdoor.jsp` - SSO frontdoor
- `/saml/authn-request.jsp` - SAML authentication
- `central.my.salesforce.com/idp/login` - Central SSO login
- Any URL with `/idp/`, `/saml/`, or `authn-request`

**Solution:**
1. **Check the background tab** - Look at the inactive tabs, find the one with bt1.my.salesforce.com
2. **If stuck on redirect page:**
   - Close that tab
   - Manually open: `https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp`
   - Login if needed
   - Keep the tab open
   - Try detokenizing again
3. **If still not working:**
   - Reload the extension: `chrome://extensions/` → Reload
   - Refresh your Splunk page
   - Try again

**Prevention:**
- Stay logged into bt1.my.salesforce.com
- Before using the extension, manually visit the tokenizer page once to ensure you're authenticated

### Issue: Extension works but history doesn't show up

**Symptoms:**
- Detokenization succeeds
- History section is empty or disappears

**Solution:**
1. Open browser console (F12)
2. Look for logs starting with:
   - `💾 Saving to history...`
   - `✅ History saved!`
   - `🔄 Refreshing history...`
3. If you see errors, check:
   - Chrome storage permissions are granted
   - Storage quota not exceeded
   - No console errors blocking JavaScript

**Manual Check:**
```javascript
// Run in console to check storage
chrome.storage.local.get(['detokenHistory'], (result) => {
  console.log('History:', result.detokenHistory);
});
```

### Issue: "Cannot access contents of url" error

**Symptoms:**
- Error mentions permission issues
- Can't access Salesforce URLs

**Solution:**
1. Go to `chrome://extensions/`
2. Find "Splunk BlackTab Detokenizer"
3. Look at "Site access" section
4. Make sure it shows: "On specific sites"
5. Click "Details"
6. Scroll to "Site access"
7. Should include:
   - `https://splunk-web.log-analytics.monitoring.aws-esvc1-useast2.aws.sfdc.cl/*`
   - `https://bt1.my.salesforce.com/*`
   - `https://central.my.salesforce.com/*`
   - `https://*.salesforce.com/*`

If missing, reload the extension.

### Issue: Timeout after 8.5 seconds

**Symptoms:**
- Error: "Timeout: No result after 8.5 seconds"
- Background tab shows the tokenizer page but script didn't run

**Possible Causes:**
1. **Page missing form elements**
   - Check logs for: `Page inspection result: {buttons: 0, textareas: 0}`
   - This means you're on a redirect page, not the actual tokenizer

2. **Script injection failed**
   - Check Service Worker console for errors
   - Look for permission errors

3. **Page loaded too slowly**
   - Network issues
   - Salesforce servers slow

**Solution:**
1. Open Service Worker console: `chrome://extensions/` → "Service Worker" link
2. Look for errors
3. Check page inspection results - should show buttons > 0 and textareas > 0
4. Try again - sometimes Salesforce is just slow

### Issue: Fast POST method always fails

**Symptoms:**
- Logs show: "❌ Fast method failed: Could not find result in response HTML"
- Always falls back to tab method

**Explanation:**
This is expected! The fast POST method doesn't work with Salesforce's Ajax4jsf framework. It always returns a redirect page. The extension automatically falls back to the tab method which works reliably.

**Not a bug** - this is normal behavior.

## Service Worker Logs

### Successful Detokenization Logs:
```
Background received message: {action: 'detokenize', token: 'A-202607-...'}
Processing detokenize request for token: A-202607-...
Starting detokenization for token: A-202607-...
Cache miss, proceeding with detokenization...
🚀 Starting FAST detokenization via direct POST...
❌ Fast method failed: ... (expected)
🔄 Falling back to tab method...
Opening BlackTab page in background tab...
Background tab created: 123456
Waiting for tokenizer page to load...
⏳ On login/auth/redirect page, waiting...
✅ Tokenizer page loaded and complete!
Current URL: https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
Page inspection result: {buttons: 5, forms: 1, textareas: 2}
Token filled successfully!
Button clicked!
SUCCESS! Value: [detokenized-value]
Detokenization complete, sending response: {success: true, ...}
```

### Failed Detokenization Logs:
```
⏳ On login/auth/redirect page, waiting... [URL]
⏳ On login/auth/redirect page, waiting... [URL]
(repeats for 3 minutes)
Timeout: No result after 3 minutes
```

## Tips for Reliable Usage

1. **Stay Logged In**: Keep bt1.my.salesforce.com session active
2. **Pre-authenticate**: Manually visit the tokenizer page once before using extension
3. **Watch Console**: Keep Service Worker console open for debugging
4. **Check Background Tabs**: Look for hung tabs if things aren't working
5. **Reload When Needed**: If extension behaves oddly, reload it
6. **Refresh Splunk**: After reloading extension, refresh your Splunk page

## Getting Help

If you're still having issues:
1. Open Service Worker console: `chrome://extensions/` → Service Worker
2. Reproduce the issue
3. Copy all console logs
4. Report with:
   - What you tried
   - What happened
   - Console logs
   - Screenshots of error messages
