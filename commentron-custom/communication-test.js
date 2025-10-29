// Communication test to verify content script to background script communication

console.log('=== COMMUNICATION TEST BETWEEN CONTENT SCRIPT AND BACKGROUND ===');

// Test 1: Background ping test
console.log('\n1. BACKGROUND PING TEST:');
function testBackgroundPing() {
    console.log('Sending ping to background script...');
    
    if (!chrome.runtime) {
        console.log('❌ Chrome runtime not available');
        return;
    }
    
    try {
        chrome.runtime.sendMessage({action: 'ping'}, (response) => {
            if (chrome.runtime.lastError) {
                console.log('❌ Background ping failed:', chrome.runtime.lastError.message);
            } else {
                console.log('✅ Background ping successful:', response);
            }
        });
    } catch (error) {
        console.log('❌ Error sending ping message:', error.message);
    }
}

// Test 2: Direct comment generation test
console.log('\n2. DIRECT COMMENT GENERATION TEST:');
async function testDirectCommentGeneration() {
    console.log('Testing direct comment generation with background script...');
    
    // Create test post data
    const testPostData = {
        content: 'This is a test post to verify the communication between content script and background script.',
        author: 'Communication Test',
        url: window.location.href
    };
    
    console.log('Test post data:', testPostData);
    
    // Get settings from storage
    if (!chrome.storage) {
        console.log('❌ Chrome storage not available');
        return;
    }
    
    try {
        console.log('Retrieving settings from storage...');
        const settings = await chrome.storage.local.get([
            'geminiApiKey', 'commentLength', 'tone', 'industry', 'useProfileData', 'commentStyle', 'includeQuestions'
        ]);
        
        console.log('Settings retrieved:', {
            hasApiKey: !!settings.geminiApiKey,
            apiKeyLength: settings.geminiApiKey ? settings.geminiApiKey.length : 0,
            commentLength: settings.commentLength,
            tone: settings.tone,
            industry: settings.industry
        });
        
        if (!settings.geminiApiKey) {
            console.log('❌ NO API KEY FOUND - Cannot test comment generation');
            return;
        }
        
        console.log('Sending generateComment message to background script...');
        chrome.runtime.sendMessage({
            action: 'generateComment',
            postData: testPostData,
            settings: settings,
            userProfile: null
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('❌ Background communication error:', chrome.runtime.lastError.message);
                console.log('This indicates a communication issue between content script and background script');
            } else {
                console.log('✅ Background response received:', response);
                if (response && response.comment) {
                    console.log('🎉 SUCCESS! Comment generated:');
                    console.log('   ', response.comment);
                } else if (response && response.error) {
                    console.log('❌ Background error:', response.error);
                    console.log('This indicates an issue with the API call or comment generation');
                } else {
                    console.log('❌ Unexpected response format:', response);
                }
            }
        });
        
    } catch (error) {
        console.log('❌ Error in direct generation test:', error.message);
        console.log('Error stack:', error.stack);
    }
}

// Test 3: Storage access test
console.log('\n3. STORAGE ACCESS TEST:');
function testStorageAccess() {
    console.log('Testing storage access...');
    
    if (!chrome.storage) {
        console.log('❌ Chrome storage not available');
        return;
    }
    
    const testKeys = [
        'geminiApiKey', 
        'autoGenerateOnClick', 
        'useProfileData', 
        'includeQuestions',
        'commentLength',
        'tone',
        'industry'
    ];
    
    chrome.storage.local.get(testKeys).then(settings => {
        console.log('✅ Storage access successful');
        console.log('Settings retrieved:');
        
        Object.keys(settings).forEach(key => {
            if (key === 'geminiApiKey' && settings[key]) {
                console.log(`  ${key}: ${settings[key] ? '[API KEY PRESENT]' : '[NOT SET]'}`);
            } else {
                console.log(`  ${key}: ${settings[key]}`);
            }
        });
        
        // Check for critical settings
        if (!settings.geminiApiKey) {
            console.log('⚠️  CRITICAL: No API key configured');
        }
        
        if (settings.autoGenerateOnClick !== true) {
            console.log('⚠️  WARNING: Auto-generate is not enabled (may be intentional)');
        }
        
    }).catch(error => {
        console.log('❌ Storage access failed:', error.message);
    });
}

// Test 4: Event listener test
console.log('\n4. EVENT LISTENER TEST:');
function testEventListeners() {
    console.log('Testing event listener functionality...');
    
    if (!window.linkedInBot) {
        console.log('❌ Extension not loaded');
        return;
    }
    
    // Check if required methods exist
    const requiredMethods = [
        'handleCommentButtonClick',
        'generateComment',
        'extractPostData',
        'insertCommentIntoBox'
    ];
    
    requiredMethods.forEach(method => {
        if (typeof window.linkedInBot[method] === 'function') {
            console.log(`✅ Method ${method} exists`);
        } else {
            console.log(`❌ Method ${method} missing`);
        }
    });
    
    // Test button detection
    console.log('Testing button detection methods...');
    if (typeof window.linkedInBot.findAllCommentButtonsAggressively === 'function') {
        try {
            const buttons = window.linkedInBot.findAllCommentButtonsAggressively();
            console.log(`✅ Button detection found ${buttons.size} buttons`);
        } catch (error) {
            console.log('❌ Button detection failed:', error.message);
        }
    } else {
        console.log('❌ Button detection method missing');
    }
}

// Test 5: Manual API call test
console.log('\n5. MANUAL API CALL TEST:');
async function testManualAPICall() {
    console.log('Testing manual API call to Gemini...');
    
    try {
        // Get API key
        const settings = await chrome.storage.local.get(['geminiApiKey']);
        
        if (!settings.geminiApiKey) {
            console.log('❌ No API key found');
            return;
        }
        
        const apiKey = settings.geminiApiKey;
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        console.log('Making direct API call to Gemini...');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Write a brief, professional LinkedIn comment about technology trends.' }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 100,
                    candidateCount: 1
                }
            })
        });
        
        console.log('API response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API call successful');
            console.log('Response data:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const comment = data.candidates[0].content.parts[0]?.text?.trim();
                console.log('Generated comment:', comment);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ API call failed:', response.status, errorText);
        }
        
    } catch (error) {
        console.log('❌ Manual API call failed:', error.message);
        console.log('Error stack:', error.stack);
    }
}

// Run basic tests
console.log('\n=== RUNNING BASIC COMMUNICATION TESTS ===');
testBackgroundPing();
testStorageAccess();
testEventListeners();

console.log('\n=== AVAILABLE TEST FUNCTIONS ===');
console.log('Run these functions for more detailed testing:');
console.log('1. testDirectCommentGeneration() - Test full comment generation flow');
console.log('2. testManualAPICall() - Test direct API call to Gemini');
console.log('3. testBackgroundPing() - Test background script communication');
console.log('4. testStorageAccess() - Test storage access');
console.log('5. testEventListeners() - Test event listener functionality');

console.log('\n=== COMMUNICATION TEST READY ===');