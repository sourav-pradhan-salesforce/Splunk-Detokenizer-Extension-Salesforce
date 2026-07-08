# 🐛 DEBUG GUIDE - Find Out What's Wrong

## 📊 Current Error:

```
{success: false, error: 'No result from automation script'}
```

**This means:** The automation function in the BlackTab page isn't returning a result.

---

## 🔍 Step-by-Step Debugging:

### Step 1: Check Service Worker Console

```
1. Go to chrome://extensions/
2. Find "Splunk BlackTab Detokenizer"
3. Click "service worker" (blue link)
4. This opens the Service Worker console
```

**Look for these logs:**
```
✅ Background received message: {action: "detokenize", ...}
✅ Processing detokenize request for token: A-202607-...
✅ Opening BlackTab page...
✅ Tab created: 123456
✅ Waiting for page to load...
✅ Page loaded
✅ Injecting automation script...
❌ Script execution completed successfully  <-- Check what comes after this!
```

**What to look for:**
- Does it say "Script execution completed successfully"?
- What does "Results object:" show?
- What does "Result value:" show?

---

### Step 2: Check BlackTab Tab Console

**When the BlackTab tab opens:**
```
1. Click on the BlackTab tab (it stays open for 5 seconds)
2. Quickly press F12
3. Go to Console tab
```

**Look for these logs:**
```
✅ === AUTOMATION STARTED ===
✅ Token: A-202607-...
✅ Starting automation steps...
✅ STEP 1: Looking for token input field...
✅ Found X textareas and Y text inputs
✅ Using first textarea as token field
✅ ✓ Token entered into field: A-202607-...
✅ STEP 2: Looking for "Perform Operation" button...
✅ Found X clickable elements
✅   Button text: ...
✅ ✓ Found perform button!
✅ Clicking button: Perform Operation
✅ ✓ Clicked "Perform Operation" button
✅ STEP 3: Waiting for result...
❌ Still checking for result, attempt X/50  <-- Does this keep going?
```

**Key Questions:**
- Does it find the textarea?
- Does it find the button?
- Does it click the button?
- Does it keep checking for result?
- Does it ever find a result?

---

### Step 3: Manually Inspect BlackTab Page

**Open BlackTab manually:**
```
https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
```

**Run this in console (F12):**
```javascript
// Check page structure
console.log('=== PAGE STRUCTURE ===');

console.log('Textareas:', document.querySelectorAll('textarea').length);
document.querySelectorAll('textarea').forEach((t, i) => {
  console.log(`  [${i}] ID: "${t.id}", Name: "${t.name}", Placeholder: "${t.placeholder}"`);
});

console.log('Text Inputs:', document.querySelectorAll('input[type="text"]').length);
document.querySelectorAll('input[type="text"]').forEach((input, i) => {
  console.log(`  [${i}] ID: "${input.id}", Name: "${input.name}"`);
});

console.log('Buttons:', document.querySelectorAll('button').length);
document.querySelectorAll('button').forEach((b, i) => {
  console.log(`  [${i}] Text: "${b.textContent.trim()}"`);
});

console.log('Submit buttons:', document.querySelectorAll('input[type="submit"]').length);
document.querySelectorAll('input[type="submit"]').forEach((s, i) => {
  console.log(`  [${i}] Value: "${s.value}"`);
});
```

**Share the output!**

---

### Step 4: Test Manual Detokenization

**On the BlackTab page, manually test:**
```javascript
// 1. Fill token field
const tokenField = document.querySelectorAll('textarea')[0];
tokenField.value = 'A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM';
console.log('Token filled:', tokenField.value);

// 2. Click button
const buttons = document.querySelectorAll('button');
for (let b of buttons) {
  if (b.textContent.toLowerCase().includes('perform')) {
    b.click();
    console.log('Clicked:', b.textContent);
    break;
  }
}

// 3. Wait and check result
setTimeout(() => {
  console.log('=== CHECKING FOR RESULT ===');
  document.querySelectorAll('textarea').forEach((t, i) => {
    console.log(`  [${i}] Value: "${t.value}"`);
  });
}, 5000);
```

**Did it work? What did you see?**

---

## 📋 Information to Share:

### 1. Service Worker Console Logs
**Especially:**
- "Results object:" line
- "Result value:" line
- Any errors

### 2. BlackTab Tab Console Logs
**Especially:**
- Does automation start?
- Does it find elements?
- Does it click button?
- Does it find result?

### 3. Page Structure
**From the manual inspection:**
- How many textareas?
- What are their IDs/names?
- How many buttons?
- What button text?

### 4. Manual Test Result
**Did manual detokenization work?**
- Did clicking button work?
- Did result appear?
- Where did result appear? (which textarea/input?)

---

## 🎯 Common Issues:

### Issue 1: Script doesn't start
**If you don't see "=== AUTOMATION STARTED ===" in BlackTab console:**
- Script injection failed
- Check Service Worker console for errors

### Issue 2: Can't find elements
**If script says "Could not find token field" or "Could not find button":**
- Page structure is different than expected
- Need to update selectors

### Issue 3: Button doesn't work
**If script clicks button but nothing happens:**
- Button click might need different event
- Page might use JavaScript framework that needs special handling

### Issue 4: Result appears but script doesn't find it
**If you see result manually but script times out:**
- Result is in a different element than expected
- Need to update result detection logic

---

## 🚀 Quick Test Script:

**Copy-paste this into BlackTab console to test everything at once:**

```javascript
(async function testDetokenization() {
  console.log('=== MANUAL DETOKENIZATION TEST ===');
  
  const token = 'A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM';
  
  // Step 1: Find and fill token field
  const textareas = document.querySelectorAll('textarea');
  console.log('Found', textareas.length, 'textareas');
  
  if (textareas.length === 0) {
    console.error('❌ No textareas found!');
    return;
  }
  
  const tokenField = textareas[0];
  tokenField.value = token;
  console.log('✅ Token filled into first textarea');
  
  // Step 2: Find and click button
  const buttons = document.querySelectorAll('button, input[type="submit"]');
  console.log('Found', buttons.length, 'buttons');
  
  let performButton = null;
  for (let btn of buttons) {
    const text = (btn.textContent || btn.value || '').toLowerCase();
    console.log('  Button:', text);
    if (text.includes('perform')) {
      performButton = btn;
      break;
    }
  }
  
  if (!performButton) {
    console.error('❌ No perform button found!');
    return;
  }
  
  console.log('✅ Found button, clicking...');
  performButton.click();
  
  // Step 3: Wait and check for result
  console.log('⏳ Waiting 5 seconds for result...');
  
  setTimeout(() => {
    console.log('=== CHECKING RESULTS ===');
    
    const allTextareas = document.querySelectorAll('textarea');
    allTextareas.forEach((t, i) => {
      console.log(`Textarea [${i}]:`, t.value.substring(0, 100));
    });
    
    const allInputs = document.querySelectorAll('input[type="text"]');
    allInputs.forEach((inp, i) => {
      console.log(`Input [${i}]:`, inp.value.substring(0, 100));
    });
    
    // Find result
    for (let t of allTextareas) {
      if (t.value && t.value !== token && t.value.length > 0) {
        console.log('✅ FOUND RESULT:', t.value);
        return;
      }
    }
    
    console.log('❌ No result found yet, might need to wait longer');
  }, 5000);
  
})();
```

**Run this and share the output!**

---

**Once you share these logs, I can fix the exact issue!** 🎯
