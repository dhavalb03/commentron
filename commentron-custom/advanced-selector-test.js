// Advanced test script to identify comment buttons on current LinkedIn UI
// Run this in the browser console on LinkedIn

console.log('=== ADVANCED COMMENT BUTTON IDENTIFICATION ===');

// 1. Look for buttons with specific text
console.log('\n1. Buttons with "comment" in text content:');
const allButtons = document.querySelectorAll('button');
let textCommentButtons = [];
allButtons.forEach((button, i) => {
    const text = button.textContent?.toLowerCase().trim();
    if (text && text.includes('comment')) {
        textCommentButtons.push({
            index: i,
            text: text,
            className: button.className,
            id: button.id,
            ariaLabel: button.getAttribute('aria-label')
        });
    }
});
console.log(`Found ${textCommentButtons.length} buttons with "comment" in text:`, textCommentButtons);

// 2. Look for buttons with comment SVG icons
console.log('\n2. Buttons with comment SVG icons:');
let svgCommentButtons = [];
allButtons.forEach((button, i) => {
    const svgs = button.querySelectorAll('svg');
    svgs.forEach(svg => {
        const ariaLabel = svg.getAttribute('aria-label')?.toLowerCase();
        if (ariaLabel && (ariaLabel.includes('comment') || ariaLabel.includes('reply'))) {
            svgCommentButtons.push({
                index: i,
                svgAriaLabel: ariaLabel,
                buttonClassName: button.className,
                buttonId: button.id,
                buttonText: button.textContent?.trim()
            });
        }
    });
});
console.log(`Found ${svgCommentButtons.length} buttons with comment SVGs:`, svgCommentButtons);

// 3. Look for buttons with aria-label containing comment
console.log('\n3. Buttons with aria-label containing "comment":');
const ariaButtons = document.querySelectorAll('button[aria-label*="comment"], button[aria-label*="Comment"]');
let ariaCommentButtons = [];
ariaButtons.forEach((button, i) => {
    ariaCommentButtons.push({
        index: i,
        ariaLabel: button.getAttribute('aria-label'),
        className: button.className,
        id: button.id,
        text: button.textContent?.trim()
    });
});
console.log(`Found ${ariaCommentButtons.length} buttons with comment in aria-label:`, ariaCommentButtons);

// 4. Look for artdeco-button__text elements
console.log('\n4. Artdeco button text elements:');
const artdecoElements = document.querySelectorAll('.artdeco-button__text');
console.log(`Found ${artdecoElements.length} artdeco elements:`);
artdecoElements.forEach((el, i) => {
    const text = el.textContent?.trim();
    console.log(`  [${i}] "${text}"`);
    
    if (text && text.toLowerCase().includes('comment')) {
        const button = el.closest('button');
        if (button) {
            console.log(`      -> Parent button:`, {
                className: button.className,
                ariaLabel: button.getAttribute('aria-label')
            });
        }
    }
});

// 5. Look for buttons in social action areas
console.log('\n5. Buttons in social action areas:');
const socialActionContainers = document.querySelectorAll('.social-actions', '.feed-shared-social-action-bar', '.feed-shared-social-actions');
console.log(`Found ${socialActionContainers.length} social action containers`);
socialActionContainers.forEach((container, containerIndex) => {
    const buttons = container.querySelectorAll('button');
    console.log(`  Container ${containerIndex} has ${buttons.length} buttons:`);
    buttons.forEach((button, buttonIndex) => {
        console.log(`    [${buttonIndex}]`, {
            text: button.textContent?.trim(),
            className: button.className,
            ariaLabel: button.getAttribute('aria-label')
        });
    });
});

console.log('\n=== TEST COMPLETE ===');
console.log('Please analyze the output to identify the correct selectors for comment buttons.');