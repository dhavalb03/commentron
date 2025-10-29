// DEBUG UTILITIES FOR COMMENTRON EXTENSION
// Run this in the LinkedIn console to debug issues

console.log('=== COMMENTRON DEBUG UTILITIES LOADED ===');

// Utility 1: Comprehensive button analyzer
window.commentronDebug = {
    // Analyze all buttons on the page
    analyzeAllButtons: function() {
        console.log('\n=== COMPREHENSIVE BUTTON ANALYSIS ===');
        const allButtons = Array.from(document.querySelectorAll('button'));
        console.log(`Total buttons found: ${allButtons.length}`);
        
        let commentButtonCandidates = [];
        let socialButtons = [];
        
        allButtons.forEach((button, index) => {
            // Skip comment area buttons
            if (button.closest('.comments-comment-box, .comments-comment-item')) {
                return;
            }
            
            const info = {
                index: index,
                text: button.textContent?.trim(),
                ariaLabel: button.getAttribute('aria-label'),
                className: button.className,
                id: button.id,
                location: this.getElementLocation(button),
                svgCount: button.querySelectorAll('svg').length,
                hasArtdeco: !!button.querySelector('.artdeco-button__text')
            };
            
            // Check if it's likely a comment button
            const lowerText = (info.text || '').toLowerCase();
            const lowerAria = (info.ariaLabel || '').toLowerCase();
            
            if (lowerText.includes('comment') || lowerAria.includes('comment') || 
                lowerText.includes('reply') || lowerAria.includes('reply')) {
                commentButtonCandidates.push(info);
            }
            
            // Check if it's in a social action area
            const parent = button.closest('.feed-shared-social-action-bar, .social-actions, .feed-shared-social-actions');
            if (parent) {
                socialButtons.push({...info, parentClass: parent.className});
            }
        });
        
        console.log(`Comment button candidates: ${commentButtonCandidates.length}`);
        commentButtonCandidates.forEach((btn, i) => {
            console.log(`  ${i+1}.`, btn);
        });
        
        console.log(`Social action buttons: ${socialButtons.length}`);
        if (socialButtons.length > 0) {
            console.log('First 5 social buttons:');
            socialButtons.slice(0, 5).forEach((btn, i) => {
                console.log(`  ${i+1}.`, btn);
            });
        }
        
        return { commentButtonCandidates, socialButtons };
    },
    
    // Get element location in DOM
    getElementLocation: function(element) {
        const path = [];
        let current = element;
        while (current && current.parentNode) {
            const tag = current.tagName.toLowerCase();
            const cls = current.className ? `.${current.className.split(' ').join('.')}` : '';
            const id = current.id ? `#${current.id}` : '';
            path.unshift(`${tag}${id}${cls}`);
            current = current.parentNode;
            if (path.length > 5) break; // Limit depth
        }
        return path.join(' > ');
    },
    
    // Test extension communication
    testExtensionCommunication: async function() {
        console.log('\n=== EXTENSION COMMUNICATION TEST ===');
        
        try {
            // Test ping
            console.log('1. Testing ping message...');
            chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Ping failed:', chrome.runtime.lastError);
                } else {
                    console.log('✅ Ping successful:', response);
                }
            });
            
            // Test storage access
            console.log('2. Testing storage access...');
            const settings = await chrome.storage.local.get(['geminiApiKey', 'commentLength', 'tone']);
            console.log('✅ Storage access successful:', {
                hasApiKey: !!settings.geminiApiKey,
                commentLength: settings.commentLength,
                tone: settings.tone
            });
            
        } catch (error) {
            console.error('❌ Communication test failed:', error);
        }
    },
    
    // Force re-initialize extension
    forceReinitialize: function() {
        console.log('\n=== FORCE REINITIALIZATION ===');
        
        if (window.linkedInBot) {
            console.log('Existing bot found, cleaning up...');
            // Clean up existing listeners
            try {
                // This would need to be implemented in the actual extension
                console.log('Cleanup would happen here...');
            } catch (e) {
                console.log('Cleanup error (expected):', e.message);
            }
        }
        
        // Try to reinitialize
        console.log('Attempting reinitialization...');
        try {
            // This simulates what happens in the extension
            if (typeof LinkedInCommentBot !== 'undefined') {
                console.log('LinkedInCommentBot class found, creating new instance...');
                const newBot = new LinkedInCommentBot();
                window.linkedInBot = newBot;
                console.log('✅ Reinitialization successful');
            } else {
                console.log('❌ LinkedInCommentBot class not found');
            }
        } catch (error) {
            console.error('❌ Reinitialization failed:', error);
        }
    },
    
    // Test manual comment generation
    testManualGeneration: function() {
        console.log('\n=== MANUAL COMMENT GENERATION TEST ===');
        
        const testData = {
            content: 'This is a test post for debugging comment generation.',
            author: 'Debug Test',
            url: window.location.href
        };
        
        console.log('Test data:', testData);
        
        // Get settings
        chrome.storage.local.get([
            'geminiApiKey', 'commentLength', 'tone', 'industry', 'useProfileData', 'commentStyle', 'includeQuestions'
        ]).then(settings => {
            console.log('Settings retrieved');
            
            if (!settings.geminiApiKey) {
                console.log('❌ No API key found!');
                return;
            }
            
            console.log('Sending generateComment message...');
            chrome.runtime.sendMessage({
                action: 'generateComment',
                postData: testData,
                settings: settings
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Generation failed:', chrome.runtime.lastError);
                } else {
                    console.log('✅ Generation response:', response);
                    if (response && response.comment) {
                        console.log('🎉 SUCCESS! Generated comment:', response.comment);
                    }
                }
            });
        }).catch(error => {
            console.error('❌ Settings retrieval failed:', error);
        });
    },
    
    // Show current extension state
    showState: function() {
        console.log('\n=== CURRENT EXTENSION STATE ===');
        console.log('window.linkedInBot exists:', typeof window.linkedInBot !== 'undefined');
        
        if (window.linkedInBot) {
            console.log('Bot properties:');
            console.log('  contextValid:', window.linkedInBot.contextValid);
            console.log('  isGenerating:', window.linkedInBot.isGenerating);
            console.log('  generatedComments size:', window.linkedInBot.generatedComments?.size || 'N/A');
        }
        
        // Check for our test functions
        console.log('Test functions available:');
        console.log('  testExtensionBasics:', typeof window.testExtensionBasics !== 'undefined');
        console.log('  testBackgroundCommunication:', typeof window.testBackgroundCommunication !== 'undefined');
        console.log('  testCommentGeneration:', typeof window.testCommentGeneration !== 'undefined');
    }
};

console.log('\n=== AVAILABLE DEBUG COMMANDS ===');
console.log('window.commentronDebug.analyzeAllButtons() - Analyze all buttons on page');
console.log('window.commentronDebug.testExtensionCommunication() - Test extension communication');
console.log('window.commentronDebug.forceReinitialize() - Force reinitialize extension');
console.log('window.commentronDebug.testManualGeneration() - Test manual comment generation');
console.log('window.commentronDebug.showState() - Show current extension state');

console.log('\n=== QUICK DIAGNOSIS ===');
console.log('Run these commands to diagnose issues:');
console.log('1. window.commentronDebug.showState()');
console.log('2. window.commentronDebug.analyzeAllButtons()');
console.log('3. window.commentronDebug.testExtensionCommunication()');

console.log('\n=== DEBUG UTILITIES READY ===');