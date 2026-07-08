# Splunk BlackTab Detokenizer Extension

Chrome extension to detokenize Salesforce GDPR tokens directly from Splunk logs using BlackTab Detokenizer.

## Features

- 🔓 **Hover Detection**: Automatically detect tokens when hovering for 2 seconds
- ✨ **Floating Panel**: Detokenize panel accessible via Ctrl+Shift+D
- 📋 **Smart Caching**: Lightning-fast results with intelligent caching
- 📜 **History**: View and manage detokenization history
- 🎨 **Theme Toggle**: Light/Dark mode support
- ⚡ **Inline Results**: Results appear directly in Splunk logs

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder

## Usage

### Hover Detection
- Hover over any token matching pattern `A-XXXXXX-...` for 2 seconds
- Tooltip appears with "Click to Detokenize" button
- Results append inline to the Splunk row

### Manual Panel
- Press `Ctrl+Shift+D` or click extension icon
- Paste token into input field
- Click "Detokenize" button
- View result and copy to clipboard

## Project Structure

```
├── manifest.json          # Extension configuration
├── icons/                 # Extension icons
├── src/                   # Source code
│   ├── content.js        # Main content script (hover detection, panel)
│   ├── background.js     # Background service worker
│   ├── popup.html        # Extension popup UI
│   ├── popup.js          # Popup functionality
│   └── styles.css        # All styles (panel, popup, tooltips)
└── docs/                  # Documentation and development files
```

## Configuration

The extension is configured to work with:
- Splunk URL: `https://splunk-web.log-analytics.monitoring.aws-esvc1-useast2.aws.sfdc.cl/*`
- Data Privacy Tokenizer: Salesforce internal tool

## Development

See `docs/` folder for detailed development documentation.

## Version

Current version: 1.0.0
