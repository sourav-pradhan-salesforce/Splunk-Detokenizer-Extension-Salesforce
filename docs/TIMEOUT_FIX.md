# 🕐 Timeout Error - Can't Find Form Elements

## Your Error:
```
Error: Request timed out after 60 seconds
```

## What This Means:

✅ Extension is working correctly!  
✅ Background script is responding!  
✅ Tab opens to BlackTab!  
❌ Can't find the input field, button, or result element  
❌ Times out after 60 seconds of searching  

---

## 🎯 The Fix: Find the Correct Selectors

The extension is looking for generic selectors like:
- `input[type="text"]`
- `button`
- `.result`

But your BlackTab page probably has specific IDs or classes that are different.

---

## 📋 Step-by-Step: Get Page Structure

### Method 1: Use the Inspection Script (Easiest)

1. **Open BlackTab page manually:**
   ```
   https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
   ```

2. **Press F12** to open DevTools

3. **Go to Console tab**

4. **Copy and paste this entire file:**
   ```
   ~/splunk-detokenizer-extension/inspect-page.js
   ```
   (Open the file, copy all contents, paste in console)

5. **Press Enter**

6. **Copy ALL the output** and share it with me!

The script will show:
- All input fields (with IDs, names, classes)
- All buttons (with IDs, text, classes)
- All relevant elements
- **Suggested selectors** to use!

### Method 2: Manual Inspection

1. **Open BlackTab page:**
   ```
   https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
   ```

2. **Find the token input field**
   - Right-click on it → "Inspect"
   - Look at the HTML element
   - Note down: `id`, `name`, `class`

   Example:
   ```html
   <input id="tokenInput" name="token" type="text" class="...">
   ```

3. **Find the Detokenize button**
   - Right-click on it → "Inspect"
   - Note down: `id`, button text, `class`

   Example:
   ```html
   <button id="detokenizeBtn">Detokenize</button>
   ```

4. **Manually detokenize a test value**
   - Enter any test value
   - Click the button
   - See where the result appears
   - Right-click on result → "Inspect"
   - Note down: `id`, `class`, element type (div, pre, textarea, etc.)

   Example:
   ```html
   <div id="result" class="output">Result appears here</div>
   ```

---

## 📸 What to Share:

Share any of these:

### Option A: Console Output
Run `inspect-page.js` script and copy the entire output

### Option B: Screenshots
- Screenshot of the BlackTab page
- Screenshot of inspecting the input field (DevTools)
- Screenshot of inspecting the button (DevTools)
- Screenshot of inspecting the result area (DevTools)

### Option C: HTML Snippets
Copy the HTML for:
- The input element
- The button element
- The result element

Example format:
```
INPUT: <input id="xyz" name="abc" type="text">
BUTTON: <button id="btn123">Detokenize</button>
RESULT: <div id="result123" class="output"></div>
```

---

## 🔧 What I'll Do:

Once you share the details, I'll update `background.js` to use the correct selectors:

**Current (generic guesses):**
```javascript
const inputSelectors = [
  'input[type="text"]',
  'textarea',
  // ...
];

const buttonSelectors = [
  'button',
  'input[type="submit"]',
  // ...
];

const resultSelectors = [
  '.result',
  '.output',
  // ...
];
```

**Updated (specific to your page):**
```javascript
const inputSelectors = [
  '#tokenInput',              // YOUR specific input ID (first!)
  'input[name="token"]',      // YOUR specific input name
  'input[type="text"]',       // fallback
  // ...
];

const buttonSelectors = [
  '#detokenizeBtn',           // YOUR specific button ID (first!)
  'button.btn-primary',       // YOUR specific button class
  'button',                   // fallback
  // ...
];

const resultSelectors = [
  '#result',                  // YOUR specific result ID (first!)
  '.result-output',           // YOUR specific result class
  '.result',                  // fallback
  // ...
];
```

By putting the specific selectors first, the extension will find them immediately instead of timing out!

---

## ⚡ Quick Test:

While on the BlackTab page, run this in console:

```javascript
// Test if we can find elements
console.log('Input:', document.querySelector('input[type="text"]'));
console.log('Button:', document.querySelector('button'));
console.log('All inputs:', document.querySelectorAll('input'));
console.log('All buttons:', document.querySelectorAll('button'));
```

Share what you see!

---

## 🎯 Expected Timeline:

1. You share page structure (5 minutes)
2. I update selectors (2 minutes)
3. You reload extension + refresh page (30 seconds)
4. Test again (10 seconds)
5. ✅ Working! (instant)

**Total: ~8 minutes to fix!**

---

## 💡 Why This Is Better Than Before:

The good news is we're making progress!

**Before:** Background not responding ❌  
**Now:** Background working, just need right selectors ✅

This is the last step! Once we have the correct selectors, it will work perfectly.

---

## 🚀 Next Steps:

1. **Open BlackTab page manually**
2. **Run the inspection script** (from `inspect-page.js`)
3. **Copy and share the output**
4. **I'll update the code immediately**
5. **You reload extension, refresh page, test**
6. **Done!** 🎉

---

**Ready to fix this in 10 minutes!**
