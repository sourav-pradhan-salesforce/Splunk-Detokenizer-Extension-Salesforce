#!/bin/bash
# Script to create simple placeholder icons using ImageMagick or similar tools
# If you don't have ImageMagick, you can create these manually or use online tools

# Check if convert command exists (ImageMagick)
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Creating SVG placeholders instead..."

    # Create a simple SVG icon that can be used
    cat > icons/icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <text x="64" y="85" font-size="70" text-anchor="middle" fill="white">🔓</text>
</svg>
EOF

    echo "SVG icon created at icons/icon.svg"
    echo ""
    echo "To create PNG icons, you can:"
    echo "1. Install ImageMagick: brew install imagemagick"
    echo "2. Use online converters (svg2png, cloudconvert)"
    echo "3. Use design tools (Figma, Sketch, GIMP)"
    echo ""
    echo "Or you can load the extension with the SVG and Chrome will accept it."

else
    echo "Creating PNG icons with ImageMagick..."

    # Create base SVG
    cat > icons/icon.svg << 'EOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <circle cx="64" cy="50" r="20" fill="none" stroke="white" stroke-width="4"/>
  <rect x="54" y="60" width="20" height="30" rx="2" fill="white"/>
  <line x1="64" y1="74" x2="64" y2="84" stroke="#667eea" stroke-width="3"/>
</svg>
EOF

    # Convert to different sizes
    convert icons/icon.svg -resize 16x16 icons/icon16.png
    convert icons/icon.svg -resize 48x48 icons/icon48.png
    convert icons/icon.svg -resize 128x128 icons/icon128.png

    echo "Icons created successfully!"
    echo "- icons/icon16.png"
    echo "- icons/icon48.png"
    echo "- icons/icon128.png"
fi
