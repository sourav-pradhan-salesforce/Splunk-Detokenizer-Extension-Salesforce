# 🔬 Manual Test - Compare with Extension

## 🎯 Goal:

Figure out why manual detokenization works but extension doesn't.

---

## Step 1: Open BlackTab Manually

```
https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
```

---

## Step 2: Open Console (F12)

---

## Step 3: Run This Inspection Script

**Copy-paste this into console:**

```javascript
(function inspectPage() {
  console.log('=== BLACKTAB PAGE INSPECTION ===');
  
  // Check selects (operation dropdown)
  const selects = document.querySelectorAll('select');
  console.log('\n📋 SELECTS:', selects.length);
  selects.forEach((sel, i) => {
    console.log(`  [${i}] ID: "${sel.id}", Name: "${sel.name}", Value: "${sel.value}"`);
    const opts = sel.querySelectorAll('option');
    opts.forEach(opt => {
      console.log(`      Option: "${opt.value}" = "${opt.textContent}" ${opt.selected ? '✓ SELECTED' : ''}`);
    });
  });
  
  // Check textareas
  const textareas = document.querySelectorAll('textarea');
  console.log('\n📝 TEXTAREAS:', textareas.length);
  textareas.forEach((ta, i) => {
    console.log(`  [${i}] ID: "${ta.id}", Name: "${ta.name}", Placeholder: "${ta.placeholder}"`);
    console.log(`      Value: "${ta.value}"`);
  });
  
  // Check buttons
  const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  console.log('\n🔘 BUTTONS:', buttons.length);
  buttons.forEach((btn, i) => {
    console.log(`  [${i}] Text: "${btn.textContent || btn.value}", Type: "${btn.type}"`);
  });
  
  // Check forms
  const forms = document.querySelectorAll('form');
  console.log('\n📄 FORMS:', forms.length);
  forms.forEach((form, i) => {
    console.log(`  [${i}] Action: "${form.action}", Method: "${form.method}"`);
  });
  
  console.log('\n=== END INSPECTION ===');
})();
```

**Share this output!**

---

## Step 4: Test Automated Fill & Click

**Now test if automation works:**

```javascript
(async function testAutomation() {
  console.log('=== TESTING AUTOMATION ===');
  
  const token = 'A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM';
  
  // Step 1: Fill token
  console.log('\n1️⃣ Filling token...');
  const textarea = document.querySelector('textarea');
  if (!textarea) {
    console.error('❌ No textarea found!');
    return;
  }
  
  textarea.value = token;
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('✅ Token filled:', textarea.value.substring(0, 20) + '...');
  
  // Step 2: Check what operation is selected
  console.log('\n2️⃣ Checking operation...');
  const select = document.querySelector('select');
  if (select) {
    console.log('Operation select value:', select.value);
    const selectedOption = select.querySelector('option:checked');
    console.log('Selected option text:', selectedOption?.textContent);
  }
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 3: Click button
  console.log('\n3️⃣ Clicking button...');
  const buttons = document.querySelectorAll('button, input[type="submit"]');
  let clicked = false;
  
  for (let btn of buttons) {
    const text = (btn.textContent || btn.value || '').toLowerCase();
    if (text.includes('perform')) {
      console.log('Clicking:', btn.textContent || btn.value);
      btn.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.error('❌ No button clicked!');
    return;
  }
  
  console.log('✅ Button clicked!');
  
  // Step 4: Wait and check result
  console.log('\n4️⃣ Waiting 5 seconds for result...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n5️⃣ Checking result...');
  
  // Check body text
  const bodyText = document.body.textContent;
  console.log('Body contains "not allowed"?', bodyText.includes('not allowed'));
  console.log('Body contains "Data:"?', bodyText.includes('Data:'));
  
  // Check textareas
  const allTextareas = document.querySelectorAll('textarea');
  allTextareas.forEach((ta, i) => {
    console.log(`Textarea [${i}] value:`, ta.value.substring(0, 100));
  });
  
  // Look for Data: pattern
  if (bodyText.includes('Data:')) {
    const match = bodyText.match(/Data:\s*(.+?)(?:\n|$)/i);
    if (match) {
      console.log('✅ FOUND RESULT:', match[1]);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
})();
```

**Share this output too!**

---

## Step 5: Compare

**Compare the automated test with manual:**

1. **Manual**: Fill token → Click button → Works ✅
2. **Automated**: Fill token → Click button → "Not allowed" ❌

**What's different?**

Possible issues:
- Maybe operation needs to be set to "Detokenize" first?
- Maybe some hidden field needs to be set?
- Maybe there's a CSRF token or session token?
- Maybe clicking too fast?

---

## Step 6: Test with Longer Delay

**Try with 3 second delay:**

```javascript
(async function testWithDelay() {
  const token = 'A-202607-8jrl9_YlIza6FEkc0tbO7ysPthQ1CiBpPuQq5QmTAbhXQytjZBpOhDwfUybAAjdqCtM';
  
  const textarea = document.querySelector('textarea');
  textarea.value = token;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  
  console.log('Token filled, waiting 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const buttons = document.querySelectorAll('button');
  for (let btn of buttons) {
    if ((btn.textContent || '').toLowerCase().includes('perform')) {
      btn.click();
      console.log('Button clicked!');
      break;
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('Check result now!');
})();
```

**Does this work?**

---

**Share all the console outputs and I'll figure out what's different!** 🔬
