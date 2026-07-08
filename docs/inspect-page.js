// Paste this in the BlackTab page console to inspect the page structure
// Open: https://bt1.my.salesforce.com/admin/gdpr-tokenizer/tokenizer.apexp
// Press F12, paste this in console, press Enter

console.log('=== BlackTab Page Inspection ===\n');

console.log('PAGE INFO:');
console.log('Title:', document.title);
console.log('URL:', window.location.href);
console.log('\n');

console.log('INPUT FIELDS:');
const inputs = document.querySelectorAll('input');
inputs.forEach((input, i) => {
  console.log(`Input ${i + 1}:`, {
    type: input.type,
    id: input.id || '(no id)',
    name: input.name || '(no name)',
    className: input.className || '(no class)',
    placeholder: input.placeholder || '(no placeholder)',
    visible: input.offsetParent !== null
  });
});
console.log(`Total inputs: ${inputs.length}\n`);

console.log('TEXTAREAS:');
const textareas = document.querySelectorAll('textarea');
textareas.forEach((textarea, i) => {
  console.log(`Textarea ${i + 1}:`, {
    id: textarea.id || '(no id)',
    name: textarea.name || '(no name)',
    className: textarea.className || '(no class)',
    placeholder: textarea.placeholder || '(no placeholder)',
    visible: textarea.offsetParent !== null
  });
});
console.log(`Total textareas: ${textareas.length}\n`);

console.log('BUTTONS:');
const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
buttons.forEach((btn, i) => {
  console.log(`Button ${i + 1}:`, {
    text: btn.textContent?.trim() || btn.value || '(no text)',
    id: btn.id || '(no id)',
    className: btn.className || '(no class)',
    type: btn.type || '(no type)',
    visible: btn.offsetParent !== null
  });
});
console.log(`Total buttons: ${buttons.length}\n`);

console.log('ALL ELEMENTS WITH IDs:');
const elementsWithIds = document.querySelectorAll('[id]');
const relevantElements = Array.from(elementsWithIds).filter(el => {
  // Filter to likely relevant elements
  const tagName = el.tagName.toLowerCase();
  const id = el.id.toLowerCase();
  return tagName === 'input' ||
         tagName === 'button' ||
         tagName === 'textarea' ||
         tagName === 'div' && (id.includes('result') || id.includes('output') || id.includes('token')) ||
         tagName === 'pre' ||
         tagName === 'code';
});

relevantElements.forEach(el => {
  console.log(`${el.tagName} #${el.id}:`, {
    className: el.className || '(no class)',
    visible: el.offsetParent !== null,
    text: el.textContent?.substring(0, 50) || '(empty)'
  });
});
console.log(`Total relevant elements: ${relevantElements.length}\n`);

console.log('FORMS:');
const forms = document.querySelectorAll('form');
forms.forEach((form, i) => {
  console.log(`Form ${i + 1}:`, {
    id: form.id || '(no id)',
    name: form.name || '(no name)',
    action: form.action || '(no action)',
    method: form.method || '(no method)'
  });
});
console.log(`Total forms: ${forms.length}\n`);

console.log('=== SUGGESTED SELECTORS ===\n');

// Suggest best selectors
if (inputs.length > 0) {
  const visibleInput = Array.from(inputs).find(i => i.offsetParent !== null && i.type === 'text');
  if (visibleInput) {
    console.log('INPUT SELECTOR:');
    if (visibleInput.id) console.log(`  '#${visibleInput.id}'  (by ID - best)`);
    if (visibleInput.name) console.log(`  'input[name="${visibleInput.name}"]'  (by name)`);
    if (visibleInput.className) console.log(`  'input.${visibleInput.className.split(' ')[0]}'  (by class)`);
  }
}

if (textareas.length > 0) {
  const visibleTextarea = Array.from(textareas).find(t => t.offsetParent !== null);
  if (visibleTextarea) {
    console.log('\nTEXTAREA SELECTOR:');
    if (visibleTextarea.id) console.log(`  '#${visibleTextarea.id}'  (by ID - best)`);
    if (visibleTextarea.name) console.log(`  'textarea[name="${visibleTextarea.name}"]'  (by name)`);
  }
}

if (buttons.length > 0) {
  const visibleButton = Array.from(buttons).find(b => b.offsetParent !== null);
  if (visibleButton) {
    console.log('\nBUTTON SELECTOR:');
    if (visibleButton.id) console.log(`  '#${visibleButton.id}'  (by ID - best)`);
    const btnText = visibleButton.textContent?.trim() || visibleButton.value;
    if (btnText) console.log(`  'button:contains("${btnText}")'  (by text - jQuery only)`);
    if (visibleButton.className) console.log(`  'button.${visibleButton.className.split(' ')[0]}'  (by class)`);
  }
}

console.log('\n=== Copy the output above and share it! ===');
