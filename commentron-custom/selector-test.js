// Test script to verify that our updated selectors work correctly
// Run this in the browser console on LinkedIn

console.log('=== TESTING UPDATED SELECTORS ===');

// Test the new approach
console.log('\n1. Testing .artdeco-button__text elements:');
const artdecoElements = document.querySelectorAll('.artdeco-button__text');
console.log(`Found ${artdecoElements.length} .artdeco-button__text elements`);

let commentButtons = [];
artdecoElements.forEach((element, i) => {
    const text = element.innerText?.toLowerCase()?.trim();
    console.log(`  [${i}] "${text}"`);
    if (text && text.includes('comment')) {
        const button = element.closest('button');
        if (button) {
            commentButtons.push({element: element, button: button, text: text});
        }
    }
});

console.log(`\n2. Found ${commentButtons.length} comment buttons:`);
commentButtons.forEach((btn, i) => {
    console.log(`  [${i}] Text: "${btn.text}"`);
    console.log(`      Class: ${btn.button.className}`);
    console.log(`      Aria-label: ${btn.button.getAttribute('aria-label')}`);
});

// Test aria-label approach
console.log('\n3. Testing aria-label approach:');
const ariaCommentButtons = document.querySelectorAll('button[aria-label*="Comment"], button[aria-label*="comment"]');
console.log(`Found ${ariaCommentButtons.length} buttons with aria-label containing "comment"`);

ariaCommentButtons.forEach((button, i) => {
    console.log(`  [${i}] Aria-label: "${button.getAttribute('aria-label')}"`);
    console.log(`      Class: ${button.className}`);
});

console.log('\n=== TEST COMPLETE ===');