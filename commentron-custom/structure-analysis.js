// Structure analysis script to understand current LinkedIn comment button structure
// Run this in the browser console on LinkedIn

console.log('=== LINKEDIN COMMENT BUTTON STRUCTURE ANALYSIS ===');

// 1. Analyze the structure around typical post containers
console.log('\n1. Analyzing post containers:');
const postContainers = document.querySelectorAll('.feed-shared-update-v2, .occludable-update, [data-test-id="main-feed-activity-card"]');
console.log(`Found ${postContainers.length} post containers`);

postContainers.forEach((container, containerIndex) => {
    console.log(`\n--- Container ${containerIndex} ---`);
    console.log('Container class:', container.className);
    
    // Look for social action bars within this container
    const socialBars = container.querySelectorAll('.feed-shared-social-action-bar, .social-actions, .feed-shared-social-actions');
    console.log(`  Found ${socialBars.length} social action bars`);
    
    socialBars.forEach((bar, barIndex) => {
        console.log(`    Bar ${barIndex} class:`, bar.className);
        
        // Look for buttons in this bar
        const buttons = bar.querySelectorAll('button');
        console.log(`    Found ${buttons.length} buttons in this bar:`);
        
        buttons.forEach((button, buttonIndex) => {
            console.log(`      Button ${buttonIndex}:`, {
                className: button.className,
                text: button.textContent?.trim(),
                ariaLabel: button.getAttribute('aria-label'),
                childElementCount: button.childElementCount
            });
            
            // Check for SVGs in this button
            const svgs = button.querySelectorAll('svg');
            if (svgs.length > 0) {
                console.log(`        Found ${svgs.length} SVGs:`);
                svgs.forEach((svg, svgIndex) => {
                    console.log(`          SVG ${svgIndex}:`, {
                        ariaLabel: svg.getAttribute('aria-label'),
                        role: svg.getAttribute('role'),
                        class: svg.className
                    });
                });
            }
            
            // Check for artdeco elements
            const artdecoElements = button.querySelectorAll('.artdeco-button__text');
            if (artdecoElements.length > 0) {
                console.log(`        Found ${artdecoElements.length} artdeco elements:`);
                artdecoElements.forEach((el, elIndex) => {
                    console.log(`          Artdeco ${elIndex}: "${el.textContent?.trim()}"`);
                });
            }
        });
    });
});

// 2. Look for specific comment-related elements
console.log('\n2. Looking for comment-specific elements:');
const commentElements = document.querySelectorAll('[aria-label*="comment"], [aria-label*="Comment"]');
console.log(`Found ${commentElements.length} elements with "comment" in aria-label`);

commentElements.forEach((element, i) => {
    if (i < 10) { // Limit output
        console.log(`  [${i}]`, {
            tagName: element.tagName,
            className: element.className,
            ariaLabel: element.getAttribute('aria-label'),
            text: element.textContent?.trim(),
            parentClass: element.parentElement?.className
        });
    }
});

// 3. Look for SVG elements with comment-related aria-labels
console.log('\n3. Looking for comment SVGs:');
const commentSvgs = document.querySelectorAll('svg[aria-label*="comment"], svg[aria-label*="Comment"], svg[aria-label*="reply"], svg[aria-label*="Reply"]');
console.log(`Found ${commentSvgs.length} SVGs with comment-related aria-labels`);

commentSvgs.forEach((svg, i) => {
    if (i < 10) { // Limit output
        console.log(`  [${i}]`, {
            ariaLabel: svg.getAttribute('aria-label'),
            parentButton: svg.closest('button') ? 'Yes' : 'No',
            parentClassName: svg.closest('button')?.className,
            parentText: svg.closest('button')?.textContent?.trim()
        });
    }
});

console.log('\n=== ANALYSIS COMPLETE ===');
console.log('Please examine the output to understand the current structure of comment buttons.');