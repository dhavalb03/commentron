// Extension Diagnostic Script
// Run this in the Chrome console on LinkedIn to diagnose extension issues

console.log('=== CUSTOM COMMENTRON EXTENSION DIAGNOSTIC ===');

// 1. Check if extension is loaded
console.log('\n1. EXTENSION LOADING STATUS:');
console.log('Extension loaded:', typeof window.linkedInBot !== 'undefined');
if (window.linkedInBot) {
    console.log('✅ Extension is loaded and running!');
    console.log('Bot context valid:', window.linkedInBot.contextValid);
    console.log('Bot is generating:', window.linkedInBot.isGenerating);
} else {
    console.log('⚠️ Extension not loaded in page context');
    console.log('This is normal on some pages - extension only loads on LinkedIn pages');
}

// 2. Check Chrome APIs
console.log('\n2. CHROME API ACCESS:');
try {
    console.log('Chrome runtime available:', typeof chrome.runtime !== 'undefined');
    console.log('Chrome storage available:', typeof chrome.storage !== 'undefined');
    
    if (chrome.runtime) {
        console.log('Extension ID:', chrome.runtime.id || 'Not available');
    }
} catch (error) {
    console.log('❌ Error accessing Chrome APIs:', error.message);
}

// 3. Test storage access
console.log('\n3. STORAGE ACCESS TEST:');
if (chrome.storage) {
    chrome.storage.local.get(['geminiApiKey', 'autoGenerateOnClick']).then(settings => {
        console.log('✅ Storage access successful');
        console.log('API key configured:', !!settings.geminiApiKey);
        console.log('Auto-generate enabled:', settings.autoGenerateOnClick);
    }).catch(error => {
        console.log('❌ Storage access failed:', error.message);
    });
} else {
    console.log('❌ Chrome storage not available');
}

// 4. Check for comment buttons
console.log('\n4. COMMENT BUTTON DETECTION:');
function detectCommentButtons() {
    // Try multiple approaches to find comment buttons
    const approaches = [
        {
            name: 'Artdeco text approach',
            selector: '.artdeco-button__text',
            filter: el => el.textContent?.toLowerCase().includes('comment')
        },
        {
            name: 'Aria-label approach',
            selector: 'button[aria-label*="comment" i]',
            filter: () => true
        },
        {
            name: 'SVG icon approach',
            selector: 'button svg[aria-label*="comment" i]',
            filter: () => true
        },
        {
            name: 'Social action buttons',
            selector: '.feed-shared-social-action-bar button, .social-actions button',
            filter: () => true
        }
    ];
    
    approaches.forEach(approach => {
        try {
            const elements = document.querySelectorAll(approach.selector);
            const filtered = Array.from(elements).filter(approach.filter);
            console.log(`  ${approach.name}: Found ${elements.length} elements, ${filtered.length} potential comment buttons`);
        } catch (error) {
            console.log(`  ${approach.name}: Error - ${error.message}`);
        }
    });
    
    // Check your specific class pattern
    console.log('  Specific class pattern approach:');
    try {
        const specificButtons = document.querySelectorAll('button._378e4e04._70c86b6e._1135656f._745e5993.ad33a2c1._61692392.b9af560e._410bc68f.e82dd3ff._76f290d6._994a230f.aaedb2eb._0638958e');
        console.log(`    Found ${specificButtons.length} buttons with exact class pattern`);
        
        if (specificButtons.length > 0) {
            console.log('    ✅ Your specific class pattern is working!');
        }
    } catch (error) {
        console.log(`    Error checking specific pattern: ${error.message}`);
    }
}

detectCommentButtons();

// 5. Test manual comment generation
console.log('\n5. MANUAL COMMENT GENERATION TEST:');
async function testManualGeneration() {
    if (!chrome.runtime) {
        console.log('❌ Chrome runtime not available');
        return;
    }
    
    console.log('Testing ping message...');
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('❌ Ping failed:', chrome.runtime.lastError.message);
        } else {
            console.log('✅ Ping successful:', response);
        }
    });
}

// 6. Instructions for proper testing
console.log('\n=== HOW TO PROPERLY TEST THE EXTENSION ===');
console.log('1. Make sure you are on a LinkedIn page (feed or post)');
console.log('2. Ensure the extension is enabled in Chrome (chrome://extensions/)');
console.log('3. Check that you have configured your Gemini API key in the extension popup');
console.log('4. Enable "Auto-generate when clicking comment buttons" in the popup');
console.log('5. Find a post and click the comment button');
console.log('6. Watch for the generated comment to appear in the comment box');

console.log('\n=== TROUBLESHOOTING TIPS ===');
console.log('If the extension is not working:');
console.log('1. Reload the extension in chrome://extensions/');
console.log('2. Refresh the LinkedIn page');
console.log('3. Check that your API key is valid');
console.log('4. Verify extension permissions include LinkedIn access');
console.log('5. Check browser console for any error messages');

console.log('\n=== RUN ADDITIONAL TESTS ===');
console.log('Run these commands for more detailed testing:');
console.log('- testExtensionBasics() // If available');
console.log('- testBackgroundCommunication() // If available');
console.log('- window.commentronDebug?.showState() // If debug utils are loaded');

console.log('\n✅ DIAGNOSTIC COMPLETE');