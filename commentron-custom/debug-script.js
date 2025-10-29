// Debug script to test post detection on LinkedIn
// Run this in the browser console (F12) when on a LinkedIn page

console.log('=== LinkedIn Post Detection Debug ===');
console.log('Page URL:', window.location.href);
console.log('Page Title:', document.title);

// Check basic page structure
const feedUpdates = document.querySelectorAll('.feed-shared-update-v2, .occludable-update');
console.log(`Found ${feedUpdates.length} feed update containers`);

// Test all selectors
const testSelectors = [
    '.feed-shared-update-v2__description-wrapper .break-words',
    '.feed-shared-update-v2__description-wrapper span[dir="ltr"]',
    '.feed-shared-update-v2__description-wrapper',
    '.feed-shared-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-article__description',
    '.feed-shared-text__text-view',
    '.update-components-text',
    '.update-components-text span[dir="ltr"]',
    'span[dir="ltr"]:not(.visually-hidden)'
];

console.log('\n=== Testing Selectors ===');
testSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements`);
    
    if (elements.length > 0) {
        for (let i = 0; i < Math.min(3, elements.length); i++) {
            const text = elements[i].innerText?.trim();
            if (text && text.length > 10) {
                console.log(`  [${i}] "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
            }
        }
    }
});

// Test author selectors
const authorSelectors = [
    '.feed-shared-actor__name .visually-hidden',
    '.feed-shared-actor__name span[aria-hidden="true"]',
    '.feed-shared-actor__name',
    '.update-components-actor__name'
];

console.log('\n=== Testing Author Selectors ===');
authorSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements`);
    if (elements.length > 0) {
        const text = elements[0].innerText?.trim();
        if (text) {
            console.log(`  First author: "${text}"`);
        }
    }
});

// Find any text that could be post content
console.log('\n=== Looking for Any Substantial Text ===');
const allSpans = document.querySelectorAll('span[dir="ltr"]');
console.log(`Total spans with dir="ltr": ${allSpans.length}`);

let foundContent = false;
for (let i = 0; i < Math.min(10, allSpans.length); i++) {
    const span = allSpans[i];
    const text = span.innerText?.trim();
    if (text && text.length > 30) {
        console.log(`Potential content [${i}]: "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
        console.log(`  Parent classes: ${span.parentElement?.className || 'none'}`);
        foundContent = true;
    }
}

if (!foundContent) {
    console.log('No substantial text found in span[dir="ltr"] elements');
}

console.log('\n=== Debug Complete ===');
console.log('If you see potential content above, the extension should work.');
console.log('If not, please share this debug output.');