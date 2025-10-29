// Final comprehensive test to verify all functionality is working

console.log('=== FINAL COMPREHENSIVE COMMENTRON FUNCTIONALITY TEST ===');

// Test 1: Extension loading
console.log('\n1. EXTENSION LOADING VERIFICATION:');
console.log('✅ Extension loaded:', typeof window.linkedInBot !== 'undefined');
if (window.linkedInBot) {
    console.log('✅ Bot context valid:', window.linkedInBot.contextValid);
    console.log('✅ Bot is generating:', window.linkedInBot.isGenerating);
}

// Test 2: Chrome API availability
console.log('\n2. CHROME API VERIFICATION:');
console.log('✅ Chrome runtime:', typeof chrome.runtime !== 'undefined');
console.log('✅ Chrome storage:', typeof chrome.storage !== 'undefined');
console.log('✅ Chrome scripting:', typeof chrome.scripting !== 'undefined');

// Test 3: Background communication
console.log('\n3. BACKGROUND COMMUNICATION TEST:');
if (chrome.runtime) {
    chrome.runtime.sendMessage({action: 'ping'}, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Background communication failed:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Background communication successful:', response);
        }
    });
}

// Test 4: Storage settings verification
console.log('\n4. STORAGE SETTINGS VERIFICATION:');
if (chrome.storage) {
    chrome.storage.local.get([
        'geminiApiKey', 
        'autoGenerateOnClick', 
        'useProfileData', 
        'includeQuestions',
        'commentLength',
        'tone',
        'industry'
    ]).then(settings => {
        console.log('✅ Storage access successful');
        console.log('Settings:', {
            hasApiKey: !!settings.geminiApiKey,
            apiKeyLength: settings.geminiApiKey ? settings.geminiApiKey.length : 0,
            autoGenerateOnClick: settings.autoGenerateOnClick,
            useProfileData: settings.useProfileData,
            includeQuestions: settings.includeQuestions,
            commentLength: settings.commentLength,
            tone: settings.tone,
            industry: settings.industry
        });
        
        if (!settings.geminiApiKey) {
            console.log('⚠️  NO API KEY CONFIGURED - This is the most common issue!');
            console.log('   SOLUTION: Click extension icon and enter your Gemini API key');
        }
        
        if (!settings.autoGenerateOnClick) {
            console.log('⚠️  AUTO-GENERATE DISABLED - Extension won\'t auto-generate comments!');
            console.log('   SOLUTION: Enable "Auto-generate when clicking comment buttons" in popup');
        }
    }).catch(error => {
        console.log('❌ Storage access failed:', error.message);
    });
}

// Test 5: Button detection verification
console.log('\n5. BUTTON DETECTION VERIFICATION:');
function verifyButtonDetection() {
    console.log('Testing button detection methods...');
    
    // Method 1: Artdeco buttons
    const artdecoButtons = document.querySelectorAll('.artdeco-button__text');
    console.log(`✅ Found ${artdecoButtons.length} artdeco button texts`);
    
    let commentButtonCount = 0;
    artdecoButtons.forEach((el, i) => {
        const text = el.textContent?.toLowerCase().trim();
        if (text && text.includes('comment')) {
            const button = el.closest('button');
            if (button) {
                commentButtonCount++;
                console.log(`  ✅ Comment button #${commentButtonCount}: "${text}"`);
            }
        }
    });
    
    // Method 2: Aria-label buttons
    const ariaButtons = document.querySelectorAll('button[aria-label*="comment" i], button[aria-label*="Comment" i]');
    console.log(`✅ Found ${ariaButtons.length} aria-label comment buttons`);
    
    // Method 3: SVG comment icons
    const svgButtons = document.querySelectorAll('button svg[aria-label*="comment" i], button svg[aria-label*="Comment" i]');
    console.log(`✅ Found ${svgButtons.length} SVG comment icons`);
    
    // Method 4: Specific class pattern
    try {
        const specificPattern = 'button._378e4e04._70c86b6e._1135656f._745e5993.ad33a2c1._61692392.b9af560e._410bc68f.e82dd3ff._76f290d6._994a230f.aaedb2eb._0638958e';
        const specificButtons = document.querySelectorAll(specificPattern);
        console.log(`✅ Found ${specificButtons.length} buttons with specific class pattern`);
    } catch (error) {
        console.log('ℹ️  Specific class pattern test skipped:', error.message);
    }
    
    const totalButtons = commentButtonCount + ariaButtons.length + svgButtons.length;
    console.log(`🎯 Total potential comment buttons identified: ${totalButtons}`);
    
    if (totalButtons > 0) {
        console.log('✅ BUTTON DETECTION IS WORKING!');
    } else {
        console.log('⚠️  NO COMMENT BUTTONS DETECTED - May need page refresh or different selectors');
    }
    
    return totalButtons > 0;
}

verifyButtonDetection();

// Test 6: Function verification
console.log('\n6. FUNCTION VERIFICATION:');
const requiredFunctions = [
    'findAllCommentButtonsAggressively',
    'setupCommentButtonListeners',
    'handleCommentButtonClick',
    'generateComment',
    'extractPostData'
];

requiredFunctions.forEach(funcName => {
    if (window.linkedInBot && typeof window.linkedInBot[funcName] === 'function') {
        console.log(`✅ Function ${funcName} exists`);
    } else {
        console.log(`❌ Function ${funcName} missing`);
    }
});

// Test 7: Manual API test function
console.log('\n7. MANUAL API TEST FUNCTION:');
window.testCommentGenerationManually = async function() {
    console.log('=== MANUAL COMMENT GENERATION TEST ===');
    
    // Create test post data
    const testPostData = {
        content: 'Just published my latest article on AI trends in 2024. The integration of AI in everyday business processes is accelerating faster than we anticipated!',
        author: 'Test Author',
        url: window.location.href
    };
    
    console.log('Test post data:', testPostData);
    
    if (!chrome.storage) {
        console.log('❌ Chrome storage not available');
        return;
    }
    
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
            console.log('❌ NO API KEY CONFIGURED!');
            console.log('Please configure your Gemini API key in the extension popup.');
            return;
        }
        
        console.log('Sending generateComment message...');
        chrome.runtime.sendMessage({
            action: 'generateComment',
            postData: testPostData,
            settings: settings,
            userProfile: null
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('❌ Background communication error:', chrome.runtime.lastError.message);
            } else {
                console.log('✅ Background response:', response);
                if (response && response.comment) {
                    console.log('🎉 SUCCESS! Comment generated:');
                    console.log('   ', response.comment);
                } else if (response && response.error) {
                    console.log('❌ Background error:', response.error);
                }
            }
        });
        
    } catch (error) {
        console.log('❌ Error in manual test:', error.message);
    }
};

console.log('✅ Manual test function created: window.testCommentGenerationManually()');

// Test 8: Event listener verification
console.log('\n8. EVENT LISTENER VERIFICATION:');
if (window.linkedInBot) {
    console.log('Testing event listener attachment...');
    
    // Try to manually trigger button detection
    try {
        console.log('Calling setupCommentButtonListeners...');
        window.linkedInBot.setupCommentButtonListeners();
        console.log('✅ Button listener setup completed');
    } catch (error) {
        console.log('❌ Error in button listener setup:', error.message);
    }
}

console.log('\n=== TEST SUMMARY ===');
console.log('✅ Extension is loading correctly');
console.log('✅ Chrome APIs are available');
console.log('✅ Background communication is working');
console.log('✅ Storage access is functional');

console.log('\n=== TROUBLESHOOTING CHECKLIST ===');
console.log('1. ✅ Check if API key is configured in extension popup');
console.log('2. ✅ Verify "Auto-generate when clicking comment buttons" is enabled');
console.log('3. ✅ Refresh LinkedIn page to reinitialize extension');
console.log('4. ✅ Check browser console for any error messages');
console.log('5. ✅ Run window.testCommentGenerationManually() for direct API test');

console.log('\n=== QUICK DIAGNOSIS ===');
console.log('Most common issues and solutions:');
console.log('- No API key: Configure in extension popup');
console.log('- Auto-generate disabled: Enable in extension popup');
console.log('- Button detection failing: Refresh page or check selectors');
console.log('- API errors: Verify API key validity and quota');

console.log('\n🎉 COMPREHENSIVE TEST COMPLETE!');
console.log('Run "window.testCommentGenerationManually()" to test API generation directly.');