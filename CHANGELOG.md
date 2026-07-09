# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.0] - 2026-07-10

### Changed
- Version bump for release alignment

## [1.0.1] - 2026-07-09

### Fixed
- Large token support: increased result capture from 10KB to 50KB
- Background window polling: replaced `onUpdated` event listener with 1-second polling
- Unfocused window timeout: polling works reliably for background windows
- Added result length and preview logging for debugging

### Changed
- `waitForTabComplete()` now polls tab status every second instead of event-based
- Result section match increased from 10KB to 50KB (HTML) and 25KB (text)
- Better logging: shows result length and preview instead of full content

## [1.0.0] - 2026-07-09

### Added
- Background window automation for BlackTab detokenization
- Unfocused window approach - user stays on Splunk page during detokenization
- Atomic fill-and-run operation to prevent form reset
- Token whitespace stripping (removes newlines, tabs, spaces)
- Improved token pattern regex: `A-YYMMDD-<base64chars>`
- HTML entity decoding for dataCell extraction
- Pre-submit token verification logging
- Service worker keepalive mechanism
- Result caching system
- Token validation to reject error messages
- Hover tooltip with 1.5s delay
- Click-to-detokenize from tooltip
- History panel with copy functionality
- Dark/light theme toggle
- Panel minimize/maximize
- Clear cache option

### Fixed
- Form data loss when tab becomes inactive
- Textarea value cleared between fill and Run click
- Chrome tab throttling issues with background tabs
- Empty token submission to BlackTab
- Tooltip showing on already-detokenized values
- Service worker termination causing "Empty token" errors
- Popup scrolling whitespace issues
- Token pattern capturing surrounding text
- Error message validation (BT errors treated as valid tokens)

### Technical Details
- Uses `chrome.windows.create()` with `focused: false` for background automation
- Executes fill and click in single script injection to prevent DOM reset
- 2-second wait after strategy selection for dynamic form stabilization
- Token cleanup: `token.replace(/\s+/g, '')` before submission
- DataCell HTML extraction with entity decoding (`&lt;`, `&gt;`, `&amp;`, etc.)

### Breaking Changes
- None (initial release)

## Rollback Instructions

To rollback to a specific version:
```bash
# List all versions
git tag

# Checkout specific version
git checkout v1.0.0

# Or rollback main branch
git reset --hard v1.0.0
git push origin main --force
```

## Future Versions

Increment version based on changes:
- **Patch** (1.0.x): Bug fixes, minor tweaks
- **Minor** (1.x.0): New features, non-breaking changes
- **Major** (x.0.0): Breaking changes, major rewrites
