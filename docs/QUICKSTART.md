# Quick Start Guide

## 5-Minute Setup

### 1. Load Extension
```
1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select folder: ~/splunk-detokenizer-extension/
5. Extension should appear in your extensions list
```

### 2. Login to Salesforce
```
1. Open: https://bt1.my.salesforce.com
2. Login with your credentials
3. Keep this tab open or stay logged in
```

### 3. Test It
```
1. Go to: https://splunk-web.log-analytics.monitoring.aws-esvc1-useast2.aws.sfdc.cl
2. Find any tokenized value in logs
3. Select the text
4. Click the "🔓 Detokenize" button that appears
5. Wait 10-15 seconds for result
```

## Usage

### Quick Methods

**🖱️ Mouse:** Select text → Click floating button

**⌨️ Keyboard:** Select text → `Ctrl+Shift+D` (or `Cmd+Shift+D`)

**📱 Icon:** Click extension icon → Paste token manually

**🖱️ Right-click:** Right-click selected text → "Detokenize with BlackTab"

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension won't load | Check folder has `manifest.json` |
| No detokenize button | Text may not match token patterns |
| "Not authenticated" | Login to bt1.my.salesforce.com |
| Takes too long | Normal - wait 10-15 seconds |
| Can't find extension icon | Check extensions menu (puzzle piece) |

## Files Overview

```
splunk-detokenizer-extension/
├── manifest.json          # Extension config
├── content.js            # Runs on Splunk pages
├── background.js         # Handles detokenization
├── styles.css           # UI styling
├── popup.html/.js       # Extension popup
├── icons/               # Extension icons (optional)
├── README.md            # Full documentation
├── INSTALL.md           # Detailed installation
├── TECHNICAL.md         # Technical details
└── QUICKSTART.md        # This file
```

## Need More Help?

- 📖 Full docs: `README.md`
- 🔧 Installation: `INSTALL.md`
- 💻 Technical: `TECHNICAL.md`
- 🎨 Icons: `icons/README.md`

## Common Customizations

### Change Token Patterns
Edit `content.js` → Find `isLikelyToken()` → Add your regex patterns

### Change BlackTab URL
Edit `background.js` → Line ~15 → Update `detokenizerUrl`

### Change Splunk URL
Edit `manifest.json` → Update `matches` array

---

**Questions?** Check the full README.md or contact your tools team.
