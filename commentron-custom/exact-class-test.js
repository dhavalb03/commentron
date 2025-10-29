// Test script to verify detection of buttons with the exact class pattern
// Run this in the browser console on LinkedIn

console.log('=== EXACT CLASS PATTERN TEST ===');

// Test 1: Look for the exact class pattern
console.log('\n1. Testing exact class pattern:');
const exactPattern = 'button._378e4e04._70c86b6e._1135656f._745e5993.ad33a2c1._61692392.b9af560e._410bc68f.e82dd3ff._76f290d6._994a230f.aaedb2eb._0638958e';
const exactButtons = document.querySelectorAll(exactPattern);
console.log(`Found ${exactButtons.length} buttons with exact class pattern:`);

exactButtons.forEach((button, i) => {
    console.log(`  [${i}]`, {
        text: button.textContent?.trim(),
        ariaLabel: button.getAttribute('aria-label'),
        className: button.className
    });
});

// Test 2: Look for buttons containing key classes
console.log('\n2. Testing key classes approach:');
const keyClasses = ['_378e4e04', '_70c86b6e', 'ad33a2c1', '_61692392'];
const allButtons = document.querySelectorAll('button');
let keyClassButtons = [];

allButtons.forEach((button, i) => {
    const className = button.className;
    const hasKeyClasses = keyClasses.every(cls => className.includes(cls));
    
    if (hasKeyClasses) {
        keyClassButtons.push({
            index: i,
            className: className,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label')
        });
    }
});

console.log(`Found ${keyClassButtons.length} buttons with key classes:`, keyClassButtons);

// Test 3: Look for partial matches
console.log('\n3. Testing partial matches:');
let partialMatches = [];
const targetClasses = [
    '_378e4e04', '_70c86b6e', '_1135656f', '_745e5993', 'ad33a2c1', 
    '_61692392', 'b9af560e', '_410bc68f', 'e82dd3ff', '_76f290d6', 
    '_994a230f', 'aaedb2eb', '_0638958e'
];

allButtons.forEach((button, i) => {
    const className = button.className;
    let matchCount = 0;
    
    targetClasses.forEach(cls => {
        if (className.includes(cls)) {
            matchCount++;
        }
    });
    
    // If we match more than half of the classes, consider it a match
    if (matchCount > targetClasses.length / 2) {
        partialMatches.push({
            index: i,
            className: className,
            matchCount: matchCount,
            text: button.textContent?.trim(),
            ariaLabel: button.getAttribute('aria-label')
        });
    }
});

console.log(`Found ${partialMatches.length} buttons with partial class matches:`);
partialMatches.forEach((match, i) => {
    console.log(`  [${i}] Matched ${match.matchCount}/${targetClasses.length} classes:`, {
        className: match.className,
        text: match.text,
        ariaLabel: match.ariaLabel
    });
});

console.log('\n=== TEST COMPLETE ===');