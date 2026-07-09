# Extension Icons

To complete the extension setup, you need to add three icon files:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)  
- icon128.png (128x128 pixels)

## Quick Options:

### Option 1: Use an Online Icon Generator
1. Go to https://www.favicon-generator.org/ or similar
2. Upload any image or emoji (🔓 lock emoji works great)
3. Download the generated icons
4. Rename them to match the required names

### Option 2: Use Figma/Canva
1. Create a 128x128 canvas
2. Add a gradient background (purple #667eea to #764ba2)
3. Add a lock or key icon in white
4. Export as PNG in all three sizes

### Option 3: Screenshot Method
1. Find a lock emoji or icon online
2. Take a screenshot and crop it
3. Resize to the required dimensions using Preview (Mac) or Paint (Windows)

### Option 4: Install ImageMagick
```bash
brew install imagemagick
cd ~/splunk-detokenizer-extension
./create-icons.sh
```

## Temporary Workaround
The extension will work without icons - Chrome will just show a default placeholder icon.
