# Splunk BlackTab Detokenizer - Changes Summary

## Recent Fixes (July 4, 2026)

### 1. Token Detection Improvements
- **Enhanced Token Pattern**: Updated regex to catch more token formats
- **Better Hover Detection**: Improved matching algorithm with multiple fallback strategies
- **Partial Token Matching**: Now detects tokens even when split across HTML elements

### 2. Tooltip Positioning Fixes
- **Viewport Boundary Checking**: Tooltip now stays within screen bounds
- **Coordinate System Fix**: Converted viewport coordinates to page coordinates for accurate positioning
- **Scroll-aware**: Tooltip position accounts for page scroll offset

### 3. UI Improvements
- **Panel Viewport Constraints**: Added `max-height: calc(100vh - 120px)` to ensure panel never exceeds viewport
- **Footer Layout**: Restructured footer to multi-line layout matching panel design
- **Popup Width**: Increased to 600px to accommodate all team member names

### 4. Code Organization
- **Removed Selection Feature**: Disabled text selection detokenize button (hover-only now)
- **Project Structure**: Reorganized into clean folder structure:
  ```
  ├── manifest.json
  ├── README.md
  ├── icons/
  ├── src/           # All source code
  │   ├── content.js
  │   ├── background.js
  │   ├── popup.html
  │   ├── popup.js
  │   └── styles.css
  └── docs/          # All documentation
  ```

## Current Features

✅ Hover detection with 2-second delay
✅ Tooltip appears near cursor with detokenize button  
✅ Inline results in Splunk rows
✅ Floating panel (Ctrl+Shift+D)
✅ History with delete/copy
✅ Theme toggle (light/dark)
✅ Smart caching
✅ Viewport-aware positioning

## Known Limitations

- Only works on specific Splunk URL
- Requires Salesforce SSO authentication
- Token pattern: `A-[^\s`<>'"]+`

## Team

Made with ❤️ by **Team Ashish**
- @ashishsharma
- @souravpradhan  
- @ramkrishan
- @sriharshachagarlamudi
