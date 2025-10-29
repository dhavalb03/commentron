// Functionality test script to identify the root cause of comment generation issues

console.log('=== CUSTOM COMMENTRON FUNCTIONALITY DIAGNOSTIC ===');

// Test 1: Check if extension is properly loaded
console.log('\n1. EXTENSION LOADING TEST:');
console.log('Window linkedInBot exists:', typeof window.linkedInBot !== 'undefined');
console.log('Window commentronInitialized:', window.commentronInitialized);

if (window.linkedInBot) {
    console.log('Bot contextValid:', window.linkedInBot.contextValid);
    console.log('Bot isGenerating:', window.linkedInBot.isGenerating);
}

// Test 2: Check Chrome APIs
console.log('\n2. CHROME API TEST:');
console.log('Chrome runtime available:', typeof chrome.runtime !== 'undefined');
console.log('Chrome storage available:', typeof chrome.storage !== 'undefined');
console.log('Chrome scripting available:', typeof chrome.scripting !== 'undefined');

// Test 3: Test background communication
console.log('\n3. BACKGROUND COMMUNICATION TEST:');
if (chrome.runtime) {
    console.log('Sending ping to background script...');
    try {
        chrome.runtime.sendMessage({action: 'ping'}, (response) => {
            if (chrome.runtime.lastError) {
                console.log('❌ Background communication failed:', chrome.runtime.lastError.message);
            } else {
                console.log('✅ Background communication successful:', response);
            }
        });
    } catch (error) {
        console.log('❌ Error sending message to background:', error.message);
    }
} else {
    console.log('❌ Chrome runtime not available');
}

// Test 4: Check storage settings
console.log('\n4. STORAGE SETTINGS TEST:');
if (chrome.storage) {
    chrome.storage.local.get([
        'geminiApiKey', 
        'autoGenerateOnClick', 
        'useProfileData', 
        'includeQuestions'
    ]).then(settings => {
        console.log('✅ Storage access successful');
        console.log('API key configured:', !!settings.geminiApiKey);
        console.log('Auto-generate enabled:', settings.autoGenerateOnClick);
        console.log('Profile data usage:', settings.useProfileData);
        console.log('Include questions:', settings.includeQuestions);
        
        if (!settings.geminiApiKey) {
            console.log('⚠️  NO API KEY CONFIGURED - This is likely the issue!');
        }
    }).catch(error => {
        console.log('❌ Storage access failed:', error.message);
    });
}

// Test 5: Button detection test
console.log('\n5. BUTTON DETECTION TEST:');
function testButtonDetection() {
    console.log('Testing various button detection approaches...');
    
    // Test 1: Artdeco buttons
    const artdecoButtons = document.querySelectorAll('.artdeco-button__text');
    console.log(`Found ${artdecoButtons.length} artdeco button texts`);
    
    let commentButtons = [];
    artdecoButtons.forEach((el, i) => {
        const text = el.textContent?.toLowerCase().trim();
        if (text && text.includes('comment')) {
            const button = el.closest('button');
            if (button) {
                commentButtons.push({element: el, button: button, text: text});
                console.log(`  ✅ Comment button found: "${text}"`);
            }
        }
    });
    
    // Test 2: Aria-label buttons
    const ariaButtons = document.querySelectorAll('button[aria-label*="comment" i], button[aria-label*="Comment" i]');
    console.log(`Found ${ariaButtons.length} aria-label comment buttons`);
    
    // Test 3: SVG comment icons
    const svgButtons = document.querySelectorAll('button svg[aria-label*="comment" i], button svg[aria-label*="Comment" i]');
    console.log(`Found ${svgButtons.length} SVG comment icons`);
    
    // Test 4: Your specific class pattern
    try {
        const specificPattern = 'button._378e4e04._70c86b6e._1135656f._745e5993.ad33a2c1._61692392.b9af560e._410bc68f.e82dd3ff._76f290d6._994a230f.aaedb2eb._0638958e';
        const specificButtons = document.querySelectorAll(specificPattern);
        console.log(`Found ${specificButtons.length} buttons with your specific class pattern`);
        
        if (specificButtons.length > 0) {
            console.log('✅ Your specific class pattern is working!');
        }
    } catch (error) {
        console.log('Error testing specific pattern:', error.message);
    }
    
    console.log(`Total potential comment buttons identified: ${commentButtons.length + ariaButtons.length + svgButtons.length}`);
    
    return commentButtons.length > 0;
}

testButtonDetection();

// Test 6: Event listener test
console.log('\n6. EVENT LISTENER TEST:');
if (window.linkedInBot) {
    console.log('Testing if event listeners are properly attached...');
    
    // Check if setupCommentButtonListeners method exists
    if (typeof window.linkedInBot.setupCommentButtonListeners === 'function') {
        console.log('✅ setupCommentButtonListeners method exists');
        // We won't call it to avoid conflicts, but we know it's there
    } else {
        console.log('❌ setupCommentButtonListeners method missing');
    }
    
    // Check if findAllCommentButtonsAggressively method exists
    if (typeof window.linkedInBot.findAllCommentButtonsAggressively === 'function') {
        console.log('✅ findAllCommentButtonsAggressively method exists');
    } else {
        console.log('❌ findAllCommentButtonsAggressively method missing');
    }
}

// Test 7: Manual comment generation test
console.log('\n7. MANUAL COMMENT GENERATION TEST:');
async function testManualGeneration() {
    console.log('Testing manual comment generation...');
    
    // Create test post data
    const testPostData = {
        content: 'This is a test post to verify comment generation functionality.',
        author: 'Test User',
        url: window.location.href
    };
    
    console.log('Test post data:', testPostData);
    
    // Get settings
    if (chrome.storage) {
        try {
            const settings = await chrome.storage.local.get([
                'geminiApiKey', 'commentLength', 'tone', 'industry', 'useProfileData', 'commentStyle', 'includeQuestions'
            ]);
            
            console.log('Settings retrieved:', {
                hasApiKey: !!settings.geminiApiKey,
                commentLength: settings.commentLength,
                tone: settings.tone
            });
            
            if (!settings.geminiApiKey) {
                console.log('❌ NO API KEY CONFIGURED - This is the most likely cause of the issue!');
                console.log('Please configure your Gemini API key in the extension popup.');
                return;
            }
            
            // Try to send message to background
            console.log('Sending generateComment message to background...');
            chrome.runtime.sendMessage({
                action: 'generateComment',
                postData: testPostData,
                settings: settings,
                userProfile: null
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('❌ Background communication error:', chrome.runtime.lastError.message);
                } else {
                    console.log('✅ Background response received:', response);
                    if (response && response.comment) {
                        console.log('🎉 SUCCESS! Comment generated:', response.comment);
                    } else if (response && response.error) {
                        console.log('❌ Background error:', response.error);
                    }
                }
            });
            
        } catch (error) {
            console.log('❌ Error in manual generation test:', error.message);
        }
    }
}

// Run manual test (commented out by default to avoid unintended API calls)
// testManualGeneration();

console.log('\n=== DIAGNOSTIC COMPLETE ===');
console.log('\nMost likely causes of the issue:');
console.log('1. No Gemini API key configured');
console.log('2. Auto-generate setting not enabled');
console.log('3. Extension not properly loaded on the page');
console.log('4. Button detection not finding comment buttons');

console.log('\nTo fix the issue:');
console.log('1. Click the extension icon and configure your Gemini API key');
console.log('2. Enable "Auto-generate when clicking comment buttons"');
console.log('3. Refresh the LinkedIn page');
console.log('4. Try clicking a comment button');

console.log('\nRun "testManualGeneration()" in the console to test API generation directly.');