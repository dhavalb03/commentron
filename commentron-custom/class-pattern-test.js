// Test script to identify buttons with specific class patterns
// Run this in the browser console on LinkedIn

console.log('=== CLASS PATTERN IDENTIFICATION ===');

// Look for buttons with the specific class pattern you mentioned
console.log('\n1. Looking for buttons with class patterns:');
const allButtons = document.querySelectorAll('button');
console.log(`Found ${allButtons.length} total buttons`);

let matchingButtons = [];
allButtons.forEach((button, i) => {
    const className = button.className;
    
    // Check for the specific pattern you mentioned
    if (className.includes('ea67f543') || 
        className.includes('a59f91da') || 
        className.includes('f35b6067') ||
        className.includes('_3ff52283') ||
        className.includes('_16015742') ||
        className.includes('fd406095') ||
        className.includes('_04d986d7') ||
        className.includes('_6f57c6c8') ||
        className.includes('e9652c96') ||
        className.includes('c84c4395') ||
        className.includes('c656761f') ||
        className.includes('b1677127') ||
        className.includes('_4643e1df') ||
        className.includes('_0e7ac6e1') ||
        className.includes('bd361404') ||
        className.includes('febe593a') ||
        className.includes('_5c5d5272') ||
        className.includes('e4a34831') ||
        className.includes('ad33a2c1') ||
        className.includes('_405f77f3') ||
        className.includes('_5adffa58')) {
        
        matchingButtons.push({
            index: i,
            className: className,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label')
        });
        
        console.log(`  [${i}] Found matching button:`, {
            className: className,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label')
        });
    }
});

console.log(`\nFound ${matchingButtons.length} buttons with matching class patterns`);

// Also check for partial matches
console.log('\n2. Looking for partial class matches:');
let partialMatches = [];
allButtons.forEach((button, i) => {
    const className = button.className;
    
    // Check for partial matches of the long class names
    if (className.length > 50) { // Long class names
        partialMatches.push({
            index: i,
            className: className,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label')
        });
        
        console.log(`  [${i}] Long class name button:`, {
            className: className,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label')
        });
    }
});

console.log(`\nFound ${partialMatches.length} buttons with long class names`);

// Check for buttons that contain SVGs
console.log('\n3. Looking for buttons with SVGs:');
let svgButtons = [];
allButtons.forEach((button, i) => {
    const svgs = button.querySelectorAll('svg');
    if (svgs.length > 0) {
        svgs.forEach(svg => {
            const ariaLabel = svg.getAttribute('aria-label');
            if (ariaLabel) {
                svgButtons.push({
                    index: i,
                    buttonClassName: button.className,
                    svgAriaLabel: ariaLabel,
                    buttonText: button.textContent?.trim()
                });
                
                console.log(`  [${i}] Button with SVG:`, {
                    buttonClassName: button.className,
                    svgAriaLabel: ariaLabel,
                    buttonText: button.textContent?.trim()
                });
            }
        });
    }
});

console.log(`\nFound ${svgButtons.length} buttons with labeled SVGs`);

console.log('\n=== TEST COMPLETE ===');