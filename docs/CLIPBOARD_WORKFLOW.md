# 📋 Clipboard Workflow - Easy Mode!

## 🎯 Two Ways to Detokenize:

### Method 1: Select Token (Original)
1. Select the token text on Splunk page
2. Click the "🔓 Detokenize" button that appears
3. Wait for result

### Method 2: Copy & Detokenize (NEW!)
1. **Copy the token** (Ctrl+C or Cmd+C)
2. Press **Ctrl+Shift+D** (or Cmd+Shift+D on Mac)
3. Extension will automatically read from clipboard!
4. Wait for result

---

## 🚀 Quick Start:

### Option A: Manual Copy-Paste
```
1. Select token: A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
2. Copy it (Ctrl+C)
3. Press Ctrl+Shift+D
4. Panel opens and automatically uses clipboard token
5. Click "Detokenize" button in panel
6. Wait for result!
```

### Option B: Extension Popup
```
1. Copy token (Ctrl+C)
2. Click extension icon in toolbar
3. Paste into text field (or it auto-fills from clipboard)
4. Click "Detokenize"
5. Wait for result!
```

---

## ✨ What Changed:

### Added Clipboard Reading:
- Extension can now read from clipboard automatically
- If you click "Detokenize" with empty input field, it reads clipboard
- Permission added: `clipboardRead`

### Keyboard Shortcut:
- **Ctrl+Shift+D** (Windows/Linux)
- **Cmd+Shift+D** (Mac)
- Opens panel and uses selected text OR clipboard

---

## 📖 Full Workflow:

### Step 1: Copy Token
```
On Splunk page:
- Find token: A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
- Select it and copy (Ctrl+C)
```

### Step 2: Open Detokenizer
```
Press: Ctrl+Shift+D
OR
Click extension icon in toolbar
```

### Step 3: Detokenize
```
- Input field auto-fills from clipboard
- Click "Detokenize" button
- Panel shows "Loading..."
- Wait 10-15 seconds
- Result appears!
```

### Step 4: Copy Result
```
- Click "Copy to Clipboard"
- Paste wherever you need it!
```

---

## 🔧 Testing After Changes:

### 1. Reload Extension
```
chrome://extensions/ → RELOAD
Chrome will ask for new permission: "Read data you copy and paste"
→ Click ALLOW
```

### 2. Refresh Splunk Page
```
Press F5 on Splunk tab
```

### 3. Test Clipboard Workflow
```
a) Copy a token: A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM
b) Press Ctrl+Shift+D
c) Panel opens with token already filled
d) Click "Detokenize"
e) Wait for result
```

---

## 🐛 Debugging:

### Check Console Logs:
```
F12 → Console tab
Look for:
- "No token in input field, trying clipboard..."
- "Got token from clipboard: A-202607-..."
- "Starting detokenization for token: A-202607-..."
```

### If Clipboard Doesn't Work:
```
Check if permission was granted:
chrome://extensions/ → Extension details → Permissions
Should show: "Read data you copy and paste"
```

---

## 💡 Benefits:

✅ **No selection needed** - just copy!
✅ **Works anywhere** - not just Splunk page
✅ **Keyboard shortcut** - super fast!
✅ **Fallback** - if clipboard empty, type manually
✅ **Universal** - works in any browser tab

---

## 📋 Summary:

**Before (Selection Only):**
- Select token → Button appears → Click → Wait

**Now (Multiple Options):**
- **Option 1:** Select token → Button appears → Click → Wait
- **Option 2:** Copy token → Ctrl+Shift+D → Click Detokenize → Wait
- **Option 3:** Copy token → Extension icon → Click Detokenize → Wait

**Choose whichever is easiest for you!** 🎉
