// Debug script to identify the exact issue with comment generation

console.log('=== COMMENT GENERATION DEBUG ===');

// Test 1: Check if the extension is properly initialized
console.log('\n1. EXTENSION INITIALIZATION CHECK:');
console.log('Window linkedInBot exists:', typeof window.linkedInBot !== 'undefined');
console.log('Window commentronInitialized:', window.commentronInitialized);

if (window.linkedInBot) {
    console.log('Bot contextValid:', window.linkedInBot.contextValid);
    console.log('Bot isGenerating:', window.linkedInBot.isGenerating);
    console.log('Bot generatedComments map size:', window.linkedInBot.generatedComments?.size || 'N/A');
}

// Test 2: Manual button click simulation
console.log('\n2. MANUAL BUTTON CLICK SIMULATION:');
function simulateCommentButtonClick() {
    console.log('Simulating comment button click...');
    
    // Try to find any comment button
    const commentButtons = document.querySelectorAll('button');
    let targetButton = null;
    
    // Look for buttons with comment-related text or attributes
    for (const button of commentButtons) {
        const text = button.textContent?.toLowerCase();
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
        
        if ((text && text.includes('comment')) || (ariaLabel && ariaLabel.includes('comment'))) {
            targetButton = button;
            console.log('Found comment button:', {
                text: text,
                ariaLabel: ariaLabel,
                className: button.className
            });
            break;
        }
    }
    
    // If no specific comment button found, try the first one with SVG
    if (!targetButton) {
        for (const button of commentButtons) {
            const svgs = button.querySelectorAll('svg');
            if (svgs.length > 0) {
                targetButton = button;
                console.log('Found button with SVG (potential comment button):', {
                    text: button.textContent,
                    svgCount: svgs.length,
                    className: button.className
                });
                break;
            }
        }
    }
    
    if (targetButton && window.linkedInBot) {
        console.log('Simulating click on target button...');
        
        // Create a mock event
        const mockEvent = {
            preventDefault: () => {},
            stopPropagation: () => {},
            target: targetButton
        };
        
        try {
            // Call the handler directly
            window.linkedInBot.handleCommentButtonClick(mockEvent, targetButton);
            console.log('✅ Button click handler called successfully');
        } catch (error) {
            console.log('❌ Error calling button click handler:', error.message);
            console.log('Error stack:', error.stack);
        }
    } else {
        console.log('❌ Could not find target button or extension not loaded');
    }
}

// Test 3: Direct comment generation test
console.log('\n3. DIRECT COMMENT GENERATION TEST:');
async function testDirectCommentGeneration() {
    console.log('Testing direct comment generation...');
    
    if (!window.linkedInBot) {
        console.log('❌ Extension not loaded');
        return;
    }
    
    // Create mock post data
    const mockPostData = {
        content: 'This is a test post to debug comment generation issues.',
        author: 'Debug Test',
        url: window.location.href
    };
    
    console.log('Mock post data:', mockPostData);
    
    try {
        console.log('Calling generateComment method...');
        const comment = await window.linkedInBot.generateComment(mockPostData);
        console.log('✅ Comment generation result:', comment);
    } catch (error) {
        console.log('❌ Comment generation failed:', error.message);
        console.log('Error stack:', error.stack);
    }
}

// Test 4: Check for post containers
console.log('\n4. POST CONTAINER DETECTION:');
function checkPostContainers() {
    console.log('Checking for post containers...');
    
    const selectors = [
        '.feed-shared-update-v2',
        '.occludable-update', 
        '.feed-shared-update-v2__content',
        '.update-components-update-v2',
        '[data-test-id="main-feed-activity-card"]',
        '.feed-shared-update-v2__wrapper'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector "${selector}": Found ${elements.length} elements`);
        
        if (elements.length > 0) {
            elements.forEach((el, i) => {
                if (i < 3) { // Limit output
                    console.log(`  Element ${i}:`, {
                        className: el.className,
                        id: el.id,
                        textPreview: el.textContent?.substring(0, 50)
                    });
                }
            });
        }
    });
}

// Test 5: Check comment box detection
console.log('\n5. COMMENT BOX DETECTION:');
function checkCommentBoxes() {
    console.log('Checking for comment boxes...');
    
    const selectors = [
        '.comments-comment-box-comment__text-editor[contenteditable="true"]',
        '.comments-comment-box__text-editor[contenteditable="true"]',
        'div[contenteditable="true"][placeholder*="comment"]',
        'div[contenteditable="true"][data-placeholder*="comment"]',
        'div[contenteditable="true"][aria-label*="comment"]',
        '.comments-comment-box-comment__text-editor:not([aria-expanded="false"]):not(.comments-comment-box-comment__text-editor--minimal)',
        '.comments-comment-box__text-editor:not([aria-expanded="false"])',
        'div[contenteditable="true"][role="textbox"]:not(.comments-comment-box-comment__text-editor--minimal)',
        '.comments-comment-box-comment__text-editor',
        '.comments-comment-box__comment-text-editor'
    ];
    
    let foundBoxes = 0;
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            foundBoxes += elements.length;
            console.log(`Selector "${selector}": Found ${elements.length} elements`);
            
            elements.forEach((el, i) => {
                if (i < 2) { // Limit output
                    console.log(`  Element ${i}:`, {
                        className: el.className,
                        attributes: {
                            contenteditable: el.getAttribute('contenteditable'),
                            placeholder: el.getAttribute('placeholder'),
                            'aria-label': el.getAttribute('aria-label'),
                            'data-placeholder': el.getAttribute('data-placeholder')
                        },
                        isVisible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
                    });
                }
            });
        }
    });
    
    console.log(`Total comment boxes found: ${foundBoxes}`);
}

// Test 6: Manual insertion test
console.log('\n6. MANUAL INSERTION TEST:');
async function testManualInsertion() {
    console.log('Testing manual comment insertion...');
    
    // Find any contenteditable element
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    console.log(`Found ${editableElements.length} contenteditable elements`);
    
    if (editableElements.length > 0) {
        const targetElement = editableElements[0];
        console.log('Target element:', {
            className: targetElement.className,
            attributes: {
                contenteditable: targetElement.getAttribute('contenteditable'),
                placeholder: targetElement.getAttribute('placeholder')
            }
        });
        
        const testComment = "This is a test comment inserted for debugging purposes.";
        
        try {
            // Clear and insert test comment
            targetElement.innerHTML = '';
            targetElement.textContent = testComment;
            
            // Trigger events
            const events = ['focus', 'input', 'change'];
            events.forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                targetElement.dispatchEvent(event);
            });
            
            console.log('✅ Test comment inserted successfully');
            console.log('Inserted text:', targetElement.textContent);
        } catch (error) {
            console.log('❌ Error inserting test comment:', error.message);
        }
    } else {
        console.log('❌ No contenteditable elements found');
    }
}

// Run all tests
console.log('\n=== RUNNING ALL DEBUG TESTS ===');
checkPostContainers();
checkCommentBoxes();

console.log('\n=== AVAILABLE DEBUG FUNCTIONS ===');
console.log('Run these functions to test specific parts:');
console.log('1. simulateCommentButtonClick() - Simulate clicking a comment button');
console.log('2. testDirectCommentGeneration() - Test direct comment generation');
console.log('3. testManualInsertion() - Test manual comment insertion');
console.log('4. checkPostContainers() - Check for post containers');
console.log('5. checkCommentBoxes() - Check for comment boxes');

console.log('\n=== DEBUG READY ===');