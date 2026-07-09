# 🚀 Speed Up Plan - Direct API Call

## Problem
Current method is too slow (~10-15 seconds):
- Opens tab → waits for page load → fills form → clicks button → waits → extracts result

Manual is faster than this!

## Solution
**Call the BlackTab API directly** using `fetch()` - should be **< 1 second**!

## How to Find the API Endpoint

### Step 1: Open BlackTab Page Manually
1. Go to: https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
2. Open DevTools (F12)
3. Go to **Network** tab
4. Click "Clear" to clear existing requests

### Step 2: Submit a Token
1. Paste a test token in the form
2. Click "Perform" button
3. Watch the Network tab

### Step 3: Find the API Call
Look for one of these:
- `apexremote` (Visualforce Remote Action)
- `aura` (Aura/Lightning endpoint)
- API endpoint like `/services/apexrest/...`
- XHR/Fetch request that sends the token

### Step 4: Inspect the Request
Click on the request and check:
- **Request URL**: The endpoint
- **Request Method**: Usually POST
- **Request Headers**: Cookie, Content-Type, etc.
- **Request Payload**: How the token is sent
- **Response**: How the result is returned

## What I Need From You

Please share:
1. **Request URL** (the endpoint)
2. **Request Method** (GET/POST)
3. **Request Headers** (especially important ones)
4. **Request Payload** (how token is sent)
5. **Response format** (JSON? XML? Plain text?)

**Screenshot or copy-paste from Network tab would be perfect!**

## Expected Request Format

### Possible Format 1: Visualforce Remote Action
```javascript
POST https://bt1.my.salesforce.com/apexremote

Headers:
  Content-Type: application/x-www-form-urlencoded
  Cookie: [Salesforce session cookies]

Body:
  action=GdprTokenizerController
  method=detokenize
  data=[{"token":"A-202607-..."}]
  type=rpc
  ctx=...
```

### Possible Format 2: Apex REST API
```javascript
POST https://bt1.my.salesforce.com/services/apexrest/gdpr/detokenize

Headers:
  Content-Type: application/json
  Authorization: Bearer [token]

Body:
  {
    "token": "A-202607-...",
    "justification": "..."
  }
```

### Possible Format 3: Aura Framework
```javascript
POST https://bt1.my.salesforce.com/aura

Headers:
  Content-Type: application/x-www-form-urlencoded

Body:
  message={"actions":[{"descriptor":"serviceComponent://...","params":{"token":"A-202607-..."}}]}
  aura.context=...
  aura.token=...
```

## Once I Have the API Details

I can create a **super-fast version**:

```javascript
// Instead of opening tab (slow)
chrome.tabs.create({ url: bt1_url, ... })

// We'll do this (fast)
const response = await fetch(api_endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // ... other headers
  },
  body: JSON.stringify({ token: token }),
  credentials: 'include'  // Include cookies
})

const result = await response.json()
// Result in < 1 second! ⚡
```

## Benefits of Direct API

✅ **Speed**: < 1 second (vs 10-15 seconds)
✅ **No UI**: Completely invisible (no tabs at all)
✅ **Reliable**: Direct server call
✅ **Clean**: No DOM manipulation
✅ **Scalable**: Can detokenize multiple in parallel

## Next Steps

1. **You**: Open BlackTab page manually
2. **You**: Capture the Network request when submitting
3. **You**: Share the endpoint details with me
4. **Me**: Implement super-fast direct API call
5. **Result**: Detokenization in milliseconds! ⚡

---

Please do this and share the network request details!
