// COMPREHENSIVE DEBUGGING AND FIX FOR COMMENT GENERATION
// This script will completely diagnose and fix the comment button detection issue

console.log('=== COMPREHENSIVE COMMENTRON DEBUG AND FIX ===');

// 1. First, let's check if our extension is actually loaded
console.log('\n1. CHECKING EXTENSION STATUS:');
console.log('Extension loaded:', typeof window.linkedInBot !== 'undefined');
if (window.linkedInBot) {
    console.log('Bot context valid:', window.linkedInBot.contextValid);
    console.log('Bot is generating:', window.linkedInBot.isGenerating);
}

// 2. Let's manually trigger our extension's button detection
console.log('\n2. MANUAL BUTTON DETECTION TEST:');
if (window.linkedInBot) {
    console.log('Running setupCommentButtonListeners...');
    window.linkedInBot.setupCommentButtonListeners();
}

// 3. Let's create a super comprehensive button detection system
console.log('\n3. SUPER COMPREHENSIVE BUTTON DETECTION:');

function findAllPossibleCommentButtons() {
    console.log('Starting comprehensive button search...');
    
    // Get all buttons on the page
    const allButtons = Array.from(document.querySelectorAll('button'));
    console.log(`Found ${allButtons.length} total buttons`);
    
    let potentialCommentButtons = [];
    
    allButtons.forEach((button, index) => {
        // Skip buttons in comment areas
        if (button.closest('.comments-comment-box') || button.closest('.comments-comment-item')) {
            return;
        }
        
        let isCommentButton = false;
        let reasons = [];
        
        // Check 1: Text content
        const text = button.textContent?.toLowerCase().trim();
        if (text && (text.includes('comment') || text.includes('reply'))) {
            isCommentButton = true;
            reasons.push(`Text: "${text}"`);
        }
        
        // Check 2: aria-label
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
        if (ariaLabel && (ariaLabel.includes('comment') || ariaLabel.includes('reply'))) {
            isCommentButton = true;
            reasons.push(`Aria-label: "${ariaLabel}"`);
        }
        
        // Check 3: SVG icons
        const svgs = button.querySelectorAll('svg');
        svgs.forEach(svg => {
            const svgLabel = svg.getAttribute('aria-label')?.toLowerCase();
            if (svgLabel && (svgLabel.includes('comment') || svgLabel.includes('reply'))) {
                isCommentButton = true;
                reasons.push(`SVG label: "${svgLabel}"`);
            }
        });
        
        // Check 4: Class patterns (your specific pattern)
        const className = button.className;
        const targetClasses = [
            '_378e4e04', '_70c86b6e', '_1135656f', '_745e5993', 'ad33a2c1', 
            '_61692392', 'b9af560e', '_410bc68f', 'e82dd3ff', '_76f290d6', 
            '_994a230f', 'aaedb2eb', '_0638958e'
        ];
        
        let classMatches = 0;
        targetClasses.forEach(cls => {
            if (className.includes(cls)) {
                classMatches++;
            }
        });
        
        if (classMatches >= 3) { // If at least 3 classes match
            isCommentButton = true;
            reasons.push(`Class pattern: ${classMatches}/${targetClasses.length} matches`);
        }
        
        // Check 5: Artdeco elements
        const artdecoText = button.querySelector('.artdeco-button__text');
        if (artdecoText) {
            const artdecoContent = artdecoText.textContent?.toLowerCase().trim();
            if (artdecoContent && artdecoContent.includes('comment')) {
                isCommentButton = true;
                reasons.push(`Artdeco text: "${artdecoContent}"`);
            }
        }
        
        // Check 6: Parent container context
        const parent = button.closest('.feed-shared-social-action-bar, .social-actions, .feed-shared-social-actions');
        if (parent && reasons.length > 0) {
            reasons.push('In social action bar');
        }
        
        if (isCommentButton) {
            potentialCommentButtons.push({
                index: index,
                button: button,
                reasons: reasons,
                className: className,
                text: text,
                ariaLabel: ariaLabel
            });
        }
    });
    
    console.log(`Found ${potentialCommentButtons.length} potential comment buttons:`);
    potentialCommentButtons.forEach((item, i) => {
        console.log(`  ${i+1}. Button:`, {
            reasons: item.reasons,
            className: item.className.substring(0, 100) + (item.className.length > 100 ? '...' : ''),
            text: item.text,
            ariaLabel: item.ariaLabel
        });
    });
    
    return potentialCommentButtons;
}

// Run the comprehensive detection
const commentButtons = findAllPossibleCommentButtons();

// 4. Let's test clicking the first potential comment button
console.log('\n4. TESTING CLICK ON FIRST POTENTIAL COMMENT BUTTON:');
if (commentButtons.length > 0) {
    const firstButton = commentButtons[0].button;
    console.log('First potential comment button:', firstButton);
    
    // Add our own event listener to test
    firstButton.addEventListener('click', function(e) {
        console.log('🔥 CUSTOM COMMENTRON EVENT TRIGGERED!');
        console.log('Button clicked:', this);
        
        // Try to manually trigger our extension
        if (window.linkedInBot) {
            console.log('Calling handleCommentButtonClick manually...');
            try {
                window.linkedInBot.handleCommentButtonClick(e, this);
            } catch (error) {
                console.error('Error calling handleCommentButtonClick:', error);
            }
        }
    });
    
    console.log('Added custom event listener to first button');
} else {
    console.log('No potential comment buttons found');
}

// 5. Let's also check for post containers and their structure
console.log('\n5. POST CONTAINER ANALYSIS:');
const postContainers = document.querySelectorAll('.feed-shared-update-v2, .occludable-update, [data-test-id="main-feed-activity-card"]');
console.log(`Found ${postContainers.length} post containers`);

postContainers.forEach((container, index) => {
    console.log(`\n--- Post Container ${index} ---`);
    console.log('Class:', container.className.substring(0, 100));
    
    // Look for social action bars
    const socialBars = container.querySelectorAll('.feed-shared-social-action-bar, .social-actions, .feed-shared-social-actions');
    console.log(`  Social action bars: ${socialBars.length}`);
    
    socialBars.forEach((bar, barIndex) => {
        console.log(`    Bar ${barIndex}:`, bar.className);
        
        // Look for buttons in this bar
        const buttons = bar.querySelectorAll('button');
        console.log(`    Buttons in bar: ${buttons.length}`);
        
        buttons.forEach((button, buttonIndex) => {
            console.log(`      Button ${buttonIndex}:`, {
                text: button.textContent?.trim(),
                ariaLabel: button.getAttribute('aria-label'),
                className: button.className.substring(0, 50)
            });
        });
    });
});

// 6. Let's create a manual comment generation test
console.log('\n6. MANUAL COMMENT GENERATION TEST:');

async function manualCommentTest() {
    console.log('Starting manual comment generation test...');
    
    // Create test post data
    const testPostData = {
        content: 'This is a test post to verify comment generation functionality.',
        author: 'Test User',
        url: window.location.href
    };
    
    console.log('Test post data:', testPostData);
    
    // Get settings
    try {
        const settings = await chrome.storage.local.get([
            'geminiApiKey', 'commentLength', 'tone', 'industry', 'useProfileData', 'commentStyle', 'includeQuestions'
        ]);
        
        console.log('Settings retrieved:', settings);
        
        if (!settings.geminiApiKey) {
            console.log('❌ No API key found! Please configure in extension popup.');
            return;
        }
        
        // Try to send message to background script
        console.log('Sending message to background script...');
        chrome.runtime.sendMessage({
            action: 'generateComment',
            postData: testPostData,
            settings: settings
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('❌ Background communication error:', chrome.runtime.lastError);
            } else {
                console.log('✅ Background response:', response);
                if (response && response.comment) {
                    console.log('🎉 SUCCESS! Generated comment:', response.comment);
                } else if (response && response.error) {
                    console.log('❌ Error from background:', response.error);
                }
            }
        });
        
    } catch (error) {
        console.error('Error in manual comment test:', error);
    }
}

// Uncomment the line below to run the manual test
// manualCommentTest();

console.log('\n=== DEBUG COMPLETE ===');
console.log('To test comment generation:');
console.log('1. Check the potential comment buttons listed above');
console.log('2. Click on one of those buttons to see if our extension triggers');
console.log('3. Uncomment the manualCommentTest() line to test API generation directly');

// 7. Let's also add a function to manually attach to ALL potential buttons
console.log('\n7. ATTACHING TO ALL POTENTIAL BUTTONS:');

function attachToAllPotentialButtons() {
    const buttons = findAllPossibleCommentButtons();
    
    buttons.forEach((item, index) => {
        const button = item.button;
        
        // Remove any existing listeners (to avoid duplicates)
        button.removeEventListener('click', window[`commentronHandler${index}`]);
        
        // Create a new handler
        window[`commentronHandler${index}`] = function(e) {
            console.log(`🔥 COMMENTRON BUTTON ${index} CLICKED!`);
            console.log('Button details:', item);
            
            // Try to trigger our extension
            if (window.linkedInBot && window.linkedInBot.handleCommentButtonClick) {
                console.log('Calling extension handler...');
                try {
                    window.linkedInBot.handleCommentButtonClick(e, button);
                } catch (error) {
                    console.error('Extension handler error:', error);
                }
            } else {
                console.log('Extension not available, trying manual generation...');
                // Try manual comment generation here
            }
        };
        
        // Add the listener
        button.addEventListener('click', window[`commentronHandler${index}`]);
        console.log(`✅ Attached to button ${index}`);
    });
    
    console.log(`Attached to ${buttons.length} potential comment buttons`);
}

// Uncomment the line below to attach to all potential buttons
// attachToAllPotentialButtons();

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Run attachToAllPotentialButtons() to attach to all comment buttons');
console.log('2. Run manualCommentTest() to test API generation directly');
console.log('3. Click on any comment button to test the extension');