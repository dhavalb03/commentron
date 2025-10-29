// Content script for LinkedIn automation
(function() {
    'use strict';
    
    // Prevent multiple initialization
    if (window.commentronInitialized) {
        console.log('🔄 CommenTron already initialized, skipping...');
        return;
    }
    
    // Early context validation before initialization
    try {
        if (!chrome || !chrome.runtime || !chrome.storage) {
            console.error('❌ Chrome APIs not available at load time - skipping initialization');
            return;
        }
        
        // Test if extension context is valid
        const testId = chrome.runtime.id;
        if (!testId) {
            console.error('❌ Extension context appears invalidated at load time - skipping initialization');
            return;
        }
        
        console.log('✅ Extension context valid at load time, proceeding with initialization');
        
    } catch (error) {
        console.error('❌ Extension context test failed at load time:', error);
        return;
    }
    
    console.log('🚀 CommenTron initializing...');
    window.commentronInitialized = true;
    
    // Add global error handler for debugging
    window.addEventListener('error', (event) => {
        if (event.error && event.error.message?.includes('commentron')) {
            console.error('🔥 GLOBAL ERROR caught by CommenTron:', event.error);
            console.error('🔥 Error details:', {
                message: event.error.message,
                stack: event.error.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        }
    });
    
    // Add unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && (event.reason.message?.includes('commentron') || event.reason.message?.includes('Extension context'))) {
            console.error('🔥 UNHANDLED PROMISE REJECTION caught by CommenTron:', event.reason);
            console.error('🔥 Promise rejection details:', {
                reason: event.reason,
                promise: event.promise
            });
        }
    });

class LinkedInCommentBot {
    constructor() {
        console.log('🔥 === LinkedInCommentBot CONSTRUCTOR START ===');
        console.log('🚀 LinkedInCommentBot initializing...');
        this.isGenerating = false;
        this.generatedComments = new Map(); // Store generated comments per post
        this.contextValid = true;
        
        console.log('🔥 About to call init()...');
        try {
            this.init();
            console.log('🔥 init() called successfully');
        } catch (error) {
            console.error('🔥 ERROR in constructor calling init():', error);
        }
        console.log('🔥 === LinkedInCommentBot CONSTRUCTOR END ===');
    }

    init() {
        console.log('🔥 === INIT METHOD START ===');
        console.log('📋 LinkedInCommentBot init() called');
        
        // Enhanced chrome runtime availability test
        console.log('🔍 Testing chrome.runtime availability...');
        try {
            // Check if chrome object and required APIs exist
            if (!chrome || !chrome.runtime || !chrome.storage) {
                console.error('❌ Chrome APIs not available');
                this.contextValid = false;
                return;
            }
            
            // Check for runtime errors
            if (chrome.runtime.lastError) {
                console.error('❌ Chrome runtime has errors:', chrome.runtime.lastError.message);
                this.contextValid = false;
                return;
            }
            
            // Test if we can access runtime id (this will fail if context is invalidated)
            const runtimeId = chrome.runtime.id;
            if (!runtimeId) {
                console.error('❌ Cannot access runtime ID - context likely invalidated');
                this.contextValid = false;
                return;
            }
            
            console.log('✅ Chrome runtime available with ID:', runtimeId);
            
        } catch (error) {
            console.error('❌ Chrome runtime test failed:', error);
            this.contextValid = false;
            return;
        }
        
        // Listen for messages from background script with error handling
        console.log('🔍 Setting up message listener...');
        try {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                console.log('📩 Message received in content script:', message);
                if (message.action === 'postComment') {
                    this.postComment(message.comment);
                }
            });
            console.log('✅ Message listener set up successfully');
        } catch (error) {
            console.error('❌ Failed to set up message listener:', error);
            this.contextValid = false;
            return;
        }
        
        // Wait for page to be fully loaded
        console.log('🔍 Checking page ready state:', document.readyState);
        if (document.readyState === 'loading') {
            console.log('⏳ Page still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => {
                console.log('✅ DOMContentLoaded fired, setting up bot...');
                this.setupBot();
            });
        } else {
            console.log('✅ Page already loaded, setting up bot immediately...');
            this.setupBot();
        }
        
        console.log('🔥 === INIT METHOD END ===');
    }
    
    setupBot() {
        console.log('🔧 Setting up LinkedInCommentBot...');
        
        if (!this.contextValid) {
            console.error('❌ Cannot setup bot - context invalid');
            return;
        }
        
        // Set up comment button listeners using aggressive detection
        this.setupCommentButtonListeners();
        
        // Re-setup listeners when new content loads (for infinite scroll)
        this.observeForNewContent();
        
        console.log('✅ LinkedInCommentBot setup complete!');
    }
    
    // Add a new method for aggressive button detection
    findAllCommentButtonsAggressively() {
        console.log('🔍 AGGRESSIVE BUTTON DETECTION STARTED');
        
        const allButtons = Array.from(document.querySelectorAll('button'));
        console.log(`Found ${allButtons.length} total buttons`);
        
        let commentButtons = new Set();
        
        allButtons.forEach((button, index) => {
            // Skip buttons in comment areas
            if (button.closest('.comments-comment-box') || button.closest('.comments-comment-item')) {
                return;
            }
            
            let isCommentButton = false;
            let detectionMethods = [];
            
            // Method 1: Text content check
            const text = button.textContent?.toLowerCase().trim();
            if (text && (text.includes('comment') || text.includes('reply'))) {
                isCommentButton = true;
                detectionMethods.push('text-content');
            }
            
            // Method 2: aria-label check
            const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
            if (ariaLabel && (ariaLabel.includes('comment') || ariaLabel.includes('reply'))) {
                isCommentButton = true;
                detectionMethods.push('aria-label');
            }
            
            // Method 3: SVG icon check
            const svgs = button.querySelectorAll('svg');
            svgs.forEach(svg => {
                const svgLabel = svg.getAttribute('aria-label')?.toLowerCase();
                if (svgLabel && (svgLabel.includes('comment') || svgLabel.includes('reply'))) {
                    isCommentButton = true;
                    detectionMethods.push('svg-icon');
                }
            });
            
            // Method 4: Your specific class pattern check
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
                detectionMethods.push(`class-pattern(${classMatches}/${targetClasses.length})`);
            }
            
            // Method 5: Artdeco elements check
            const artdecoText = button.querySelector('.artdeco-button__text');
            if (artdecoText) {
                const artdecoContent = artdecoText.textContent?.toLowerCase().trim();
                if (artdecoContent && artdecoContent.includes('comment')) {
                    isCommentButton = true;
                    detectionMethods.push('artdeco-text');
                }
            }
            
            // Method 6: Social action context check
            const parent = button.closest('.feed-shared-social-action-bar, .social-actions, .feed-shared-social-actions');
            if (parent && detectionMethods.length > 0) {
                detectionMethods.push('social-context');
            }
            
            if (isCommentButton) {
                commentButtons.add(button);
                console.log(`✅ DETECTED COMMENT BUTTON #${index}:`, {
                    methods: detectionMethods,
                    text: text,
                    ariaLabel: ariaLabel,
                    className: className.substring(0, 100)
                });
            }
        });
        
        console.log(`🎯 TOTAL COMMENT BUTTONS DETECTED: ${commentButtons.size}`);
        return commentButtons;
    }

    setupCommentButtonListeners() {
        console.log('🚀 SETTING UP COMMENT BUTTON LISTENERS (AGGRESSIVE MODE)');
        
        // Use aggressive detection
        const commentButtons = this.findAllCommentButtonsAggressively();
        
        if (commentButtons.size === 0) {
            console.log('⚠️ NO COMMENT BUTTONS FOUND, TRYING ALTERNATIVE APPROACH');
            
            // Try one more time with a broader search
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(button => {
                // Skip if in comment area
                if (button.closest('.comments-comment-box') || button.closest('.comments-comment-item')) {
                    return;
                }
                
                // Look for buttons in social action areas with any SVG
                const parent = button.closest('.feed-shared-social-action-bar, .social-actions, .feed-shared-social-actions');
                const svgs = button.querySelectorAll('svg');
                
                if (parent && svgs.length > 0) {
                    commentButtons.add(button);
                    console.log('✅ ADDED BUTTON FROM ALTERNATIVE APPROACH:', {
                        className: button.className,
                        parentClass: parent.className,
                        svgCount: svgs.length
                    });
                }
            });
        }
        
        console.log(`🎯 ATTACHING TO ${commentButtons.size} COMMENT BUTTONS`);
        
        // Add event listeners to all detected comment buttons
        commentButtons.forEach((button, index) => {
            // Remove any existing listeners to prevent duplicates
            if (button._commentronHandler) {
                button.removeEventListener('click', button._commentronHandler);
            }
            
            // Create a handler specific to this button
            const handler = (e) => {
                console.log(`🎯 COMMENT BUTTON #${index} CLICKED!`, {
                    className: button.className,
                    text: button.textContent?.trim(),
                    ariaLabel: button.getAttribute('aria-label')
                });
                
                try {
                    this.handleCommentButtonClick(e, button);
                } catch (error) {
                    console.error('🔥 ERROR IN COMMENT BUTTON HANDLER:', error);
                    console.error('Error stack:', error.stack);
                }
            };
            
            // Store reference to remove later if needed
            button._commentronHandler = handler;
            
            // Add the listener with capture phase to ensure we catch the event
            button.addEventListener('click', handler, true);
            console.log(`✅ ATTACHED TO BUTTON #${index}`);
        });
        
        console.log('🚀 COMMENT BUTTON SETUP COMPLETE');
    }
    
    observeForNewContent() {
        console.log('Setting up content observer for comment buttons...');
        
        const observer = new MutationObserver((mutations) => {
            let shouldSetupListeners = false;
            
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new comment-related elements were added
                            const hasCommentElements = 
                                node.querySelector && (
                                    node.querySelector('.artdeco-button__text') ||
                                    node.querySelector('button[aria-label*="Comment"]') ||
                                    node.querySelector('button[aria-label*="comment"]') ||
                                    node.querySelector('button svg[aria-label*="comment"]') ||
                                    node.querySelector('button svg[aria-label*="Comment"]') ||
                                    (node.tagName === 'BUTTON' && 
                                     node.textContent?.toLowerCase().includes('comment'))
                                ) ||
                                (node.classList && node.classList.contains('artdeco-button__text')) ||
                                (node.tagName === 'BUTTON' && 
                                 node.textContent?.toLowerCase().includes('comment'));
                            
                            if (hasCommentElements) {
                                shouldSetupListeners = true;
                                console.log('New comment-related elements detected, will re-setup listeners');
                            }
                        }
                    });
                }
            });
            
            if (shouldSetupListeners) {
                // Delay to ensure DOM is stable
                setTimeout(() => {
                    console.log('Re-setting up comment button listeners due to DOM changes');
                    this.setupCommentButtonListeners();
                }, 1000);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('Content observer started for comment buttons');
    }
    
    async handleCommentButtonClick(event, button) {
        console.log('🔥 === HANDLE COMMENT BUTTON CLICK START ===');
        console.log('🔥 Event type:', event.type);
        console.log('🔥 Event timestamp:', event.timeStamp);
        console.log('🔥 Button element:', button);
        console.log('🔥 Button text content:', button.textContent?.trim());
        console.log('🔥 Button aria-label:', button.getAttribute('aria-label'));
        console.log('🔥 Button class name:', button.className);
        
        // Add immediate debug logging
        console.log('🔥 IMMEDIATE DEBUG: handleCommentButtonClick called successfully');
        
        try {
            console.log('🔥 Comment button click handler triggered!');
            
            // Enhanced context validation
            if (!this.contextValid) {
                console.error('❌ Extension context is invalid!');
                return;
            }
            
            // Test chrome runtime with comprehensive error handling
            console.log('🔍 Testing chrome runtime...');
            try {
                // Test if chrome object exists and has required properties
                if (!chrome || !chrome.runtime || !chrome.storage) {
                    throw new Error('Chrome APIs not available');
                }
                
                // Test runtime connection
                if (chrome.runtime.lastError) {
                    throw new Error(`Runtime error: ${chrome.runtime.lastError.message}`);
                }
                
                // Quick storage test with timeout
                const testPromise = chrome.storage.local.get(['test']);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Storage test timeout')), 1000)
                );
                
                await Promise.race([testPromise, timeoutPromise]);
                console.log('✅ Chrome runtime test passed');
                
            } catch (error) {
                console.error('❌ Chrome runtime test failed:', error);
                
                // Check if this is a context invalidation error
                if (error.message?.includes('context invalidated') || 
                    error.message?.includes('Extension context') ||
                    error.message?.includes('receiving end does not exist')) {
                    
                    console.error('❌ EXTENSION CONTEXT INVALIDATED - Extension needs reload');
                    this.contextValid = false;
                    
                    // Show user-friendly message
                    const postContainer = button.closest('.feed-shared-update-v2, .occludable-update');
                    if (postContainer) {
                        this.showTemporaryMessage(postContainer, '⚠️ Extension reloaded. Please refresh the page.', 'warning');
                    }
                    
                    return;
                }
                
                // For other errors, mark context as invalid and return
                this.contextValid = false;
                return;
            }
            
            // Check if extension is enabled for auto-generation
            console.log('🔍 Checking extension settings...');
            const settings = await chrome.storage.local.get(['autoGenerateOnClick', 'geminiApiKey']);
            console.log('📋 Settings retrieved:', {
                autoGenerateOnClick: settings.autoGenerateOnClick,
                hasApiKey: !!settings.geminiApiKey,
                apiKeyLength: settings.geminiApiKey?.length || 0
            });
            
            // Add explicit check for autoGenerateOnClick
            console.log('🔍 Auto-generate setting check:');
            console.log('  Setting value:', settings.autoGenerateOnClick);
            console.log('  Setting type:', typeof settings.autoGenerateOnClick);
            console.log('  Is explicitly true:', settings.autoGenerateOnClick === true);
            
            if (settings.autoGenerateOnClick !== true) {
                console.log('❌ Auto-generate on click is DISABLED in extension settings');
                console.log('📝 To enable: Open extension popup → Check "Auto-generate when clicking comment buttons"');
                // Don't show message as it might interfere, just log
                return; // Let normal LinkedIn behavior proceed
            }
            
            if (!settings.geminiApiKey) {
                console.log('❌ No Gemini API key configured');
                console.log('📝 To configure: Open extension popup → Enter your Gemini API key');
                // Don't show message as it might interfere, just log
                return;
            }
            
            console.log('✅ Auto-generation is enabled, proceeding...');
            
            // Find the post container - try multiple selectors
            console.log('🔍 Searching for post container...');
            const postContainerSelectors = [
                '.feed-shared-update-v2',
                '.occludable-update', 
                '.feed-shared-update-v2__content',
                '.update-components-update-v2',
                '[data-test-id="main-feed-activity-card"]',
                '.feed-shared-update-v2__wrapper'
            ];
            
            let postContainer = null;
            for (const selector of postContainerSelectors) {
                postContainer = button.closest(selector);
                if (postContainer) {
                    console.log(`✅ Found post container using selector: ${selector}`);
                    break;
                }
            }
            
            if (!postContainer) {
                console.log('❌ Could not find post container for button:', button);
                console.log('Button parent chain:', this.getParentChain(button));
                return;
            }
            
            console.log('🎯 FOUND POST CONTAINER:');
            console.log('Post container element:', postContainer);
            console.log('Post container classes:', postContainer.className);
            console.log('Post container preview:', postContainer.outerHTML.substring(0, 300) + '...');
            
            // Quick preview of post content to verify we have the right post
            const quickContentCheck = postContainer.querySelector('.feed-shared-update-v2__description-wrapper')?.innerText?.trim();
            console.log('Quick content preview:', quickContentCheck?.substring(0, 100) + '...');
            
            const postId = this.getPostId(postContainer);
            console.log('🆔 Post ID:', postId);
            
            // Don't prevent the default behavior - let LinkedIn open the comment box
            // We'll wait for it to appear and then generate the comment
            console.log('⏳ Setting timeout to generate comment in 1200ms...');
            setTimeout(async () => {
                console.log('⚙️ Timeout triggered - attempting to generate and insert comment...');
                await this.generateAndInsertComment(postContainer, postId);
            }, 1200); // Increased delay to ensure comment box is fully loaded
            
        } catch (error) {
            console.error('🔥 === CRITICAL ERROR in handleCommentButtonClick ===');
            console.error('🔥 Error:', error);
            console.error('🔥 Error message:', error.message);
            console.error('🔥 Error stack:', error.stack);
            console.error('🔥 Error name:', error.name);
            
            if (error.message?.includes('Extension context invalidated')) {
                console.error('❌ Extension context was invalidated - please reload the page');
                this.contextValid = false;
            }
            
            // Show error to user
            try {
                const postContainer = button.closest('.feed-shared-update-v2, .occludable-update');
                if (postContainer) {
                    this.showTemporaryMessage(postContainer, '❌ Comment generation failed. Check console.', 'error');
                }
            } catch (displayError) {
                console.error('🔥 Failed to show error message:', displayError);
            }
        }
        
        console.log('🔥 === HANDLE COMMENT BUTTON CLICK END ===');
    }
    
    getParentChain(element, maxDepth = 5) {
        const chain = [];
        let current = element;
        for (let i = 0; i < maxDepth && current; i++) {
            chain.push({
                tagName: current.tagName,
                className: current.className,
                id: current.id
            });
            current = current.parentElement;
        }
        return chain;
    }
    
    getPostId(postContainer) {
        // Try to get a unique identifier for the post
        const urnElement = postContainer.querySelector('[data-urn]');
        if (urnElement) {
            return urnElement.getAttribute('data-urn');
        }
        
        // Fallback: use post content hash
        const contentElement = postContainer.querySelector('.feed-shared-update-v2__description-wrapper');
        if (contentElement) {
            return btoa(contentElement.innerText?.trim().substring(0, 50) || Math.random().toString());
        }
        
        return Math.random().toString();
    }
    
    async generateAndInsertComment(postContainer, postId) {
        console.log('🚀 === STARTING COMMENT GENERATION PROCESS ===');
        console.log('Post container:', postContainer);
        console.log('Post ID:', postId);
        
        try {
            if (this.isGenerating) {
                console.log('⚠️ Already generating comment, skipping...');
                return;
            }
            
            // Check if we already have a comment for this post
            const existingComment = this.generatedComments.get(postId);
            
            if (existingComment) {
                console.log('🔄 Regenerating comment for existing post...');
                // Regenerate comment
                this.showRegeneratingIndicator(postContainer);
                this.generatedComments.delete(postId);
            } else {
                console.log('🆕 First time generating comment for this post...');
                this.showGeneratingIndicator(postContainer);
            }
            
            this.isGenerating = true;
            console.log('✅ Set isGenerating = true');
            
            // Extract post data
            console.log('🔍 Extracting post data...');
            const postData = this.extractPostData(postContainer);
            if (!postData) {
                console.log('❌ Failed to extract post data!');
                this.hideGeneratingIndicator(postContainer);
                this.isGenerating = false;
                return;
            }
            console.log('✅ Post data extracted successfully:', postData);
            
            // Generate comment using Gemini API
            console.log('🤖 Calling generateComment with Gemini API...');
            const comment = await this.generateComment(postData);
            console.log('💬 Generated comment result:', comment ? comment.substring(0, 50) + '...' : 'NULL');
            
            if (comment) {
                console.log('✅ Comment generated successfully, storing and inserting...');
                // Store the generated comment
                this.generatedComments.set(postId, comment);
                
                // Insert comment into the comment box
                await this.insertCommentIntoBox(postContainer, comment);
                
                this.showCommentInsertedIndicator(postContainer);
                console.log('✅ Comment insertion process completed!');
            } else {
                console.log('❌ Comment generation returned null/empty result');
                this.showErrorIndicator(postContainer);
            }
            
        } catch (error) {
            console.error('❌ Error in generateAndInsertComment:', error);
            console.error('Error stack:', error.stack);
            this.showErrorIndicator(postContainer);
        } finally {
            console.log('🔄 Cleaning up: setting isGenerating = false');
            this.isGenerating = false;
            setTimeout(() => {
                console.log('🧹 Hiding generating indicator after 3 seconds');
                this.hideGeneratingIndicator(postContainer);
            }, 3000);
        }
        
        console.log('🏁 === COMMENT GENERATION PROCESS ENDED ===');
    }
    
    // New method to extract user's LinkedIn profile data
    async extractUserProfile() {
        console.log('🔍 PROFILE: =========================');
        console.log('🔍 PROFILE: STARTING PROFILE EXTRACTION');
        console.log('🔍 PROFILE: =========================');
        console.log('🔍 PROFILE: Current URL:', window.location.href);
        console.log('🔍 PROFILE: Page title:', document.title);
        console.log('🔍 PROFILE: Ready state:', document.readyState);
        
        const profileData = {
            name: null,
            headline: null,
            industry: null,
            location: null,
            experience: [],
            skills: [],
            education: [],
            about: null,
            profileUrl: null
        };
        
        try {
            // Check if we're actually on a profile page
            const isProfilePage = window.location.href.includes('/in/') || 
                                window.location.href.includes('/profile/') ||
                                document.title.includes('Profile') ||
                                document.querySelector('[data-control-name="identity_profile_photo"]');
            
            console.log('🔍 PROFILE: Is profile page?', isProfilePage);
            
            if (isProfilePage) {
                console.log('🔍 PROFILE: On a profile page - extracting from current page');
                // Wait a bit for dynamic content to load
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // We're on a profile page - extract from current page
                profileData.name = this.extractProfileName();
                profileData.headline = this.extractProfileHeadline();
                profileData.about = this.extractProfileAbout();
                profileData.experience = this.extractProfileExperience();
                profileData.skills = this.extractProfileSkills();
                profileData.education = this.extractProfileEducation();
                profileData.location = this.extractProfileLocation();
                profileData.profileUrl = window.location.href;
            } else {
                console.log('🔍 PROFILE: Not on profile page - trying to get info from navigation');
                // Try to get profile info from navigation/header area
                profileData.name = this.extractCurrentUserName();
                profileData.profileUrl = this.extractCurrentUserProfileUrl();
            }
            
            console.log('🔍 PROFILE: Extracted profile data:', profileData);
            
            // Check if we got any meaningful data
            const hasData = profileData.name || profileData.headline || profileData.experience?.length > 0;
            console.log(`🔍 PROFILE: Has meaningful profile data: ${hasData}`);
            
            if (!hasData) {
                console.log('❌ PROFILE: No meaningful profile data extracted');
                
                // Debug: Log all h1 and h2 elements
                console.log('🔍 PROFILE: DEBUG - All headings on page:');
                document.querySelectorAll('h1, h2, h3').forEach((heading, index) => {
                    console.log(`🔍 PROFILE: Heading ${index} (${heading.tagName}): "${heading.textContent?.trim()}"`);
                });
                
                // Debug: Log all text-containing elements near profile area
                console.log('🔍 PROFILE: DEBUG - All main content:');
                const mainContent = document.querySelector('main');
                if (mainContent) {
                    const textElements = mainContent.querySelectorAll('*');
                    Array.from(textElements).slice(0, 20).forEach((el, index) => {
                        const text = el.textContent?.trim();
                        if (text && text.length > 5 && text.length < 100) {
                            console.log(`🔍 PROFILE: Text element ${index}: "${text}"`);
                        }
                    });
                }
                
                return null;
            }
            
            console.log('✅ PROFILE: Successfully extracted profile data');
            return profileData;
            
        } catch (error) {
            console.error('❌ PROFILE: Error extracting profile data:', error);
            return null;
        }
    }
    
    extractProfileName() {
        console.log('🔍 PROFILE: Starting name extraction...');
        console.log('🔍 PROFILE: Current URL:', window.location.href);
        console.log('🔍 PROFILE: Page title:', document.title);
        
        const nameSelectors = [
            'h1[data-anonymize="person-name"]',
            '.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            '.pv-top-card--list li:first-child h1',
            '.pv-entity__summary-info h1',
            'h1.break-words',
            '.profile-top-card__title',
            // More specific selectors
            '.ph5 .pv-text-details__left-panel h1',
            '.artdeco-card .text-heading-xlarge',
            '.pv-top-card .pv-text-details__left-panel h1',
            // New selectors for current LinkedIn interface
            'section.pv-top-card h1',
            '.pv-top-card-profile-picture__container + div h1',
            '.pv-entity__summary-info h1',
            '.profile-photo-edit__preview + * h1',
            'h1:has-text("View")',
            '[data-control-name="identity_profile_photo"] ~ * h1',
            'main h1',
            '.artdeco-card h1',
            '.pv-text-details__left-panel .text-heading-xlarge',
            'h1.text-heading-xlarge'
        ];
        
        for (const selector of nameSelectors) {
            try {
                console.log(`🔍 PROFILE: Trying selector: ${selector}`);
                const elements = document.querySelectorAll(selector);
                console.log(`🔍 PROFILE: Found ${elements.length} elements`);
                
                elements.forEach((el, index) => {
                    console.log(`🔍 PROFILE: Element ${index}:`, el.textContent?.trim(), el);
                });
                
                const element = document.querySelector(selector);
                if (element && element.textContent?.trim()) {
                    const name = element.textContent.trim();
                    if (name.length > 2 && !name.includes('LinkedIn') && !name.includes('Profile') && !name.includes('View')) {
                        console.log(`✅ PROFILE: Name found with selector ${selector}: ${name}`);
                        return name;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ PROFILE: Selector failed: ${selector}`, error);
            }
        }
        
        // Advanced DOM traversal
        console.log('🔍 PROFILE: Trying advanced extraction methods...');
        
        // Method 1: Look for profile picture aria-label
        const profileImages = document.querySelectorAll('img[alt*="profile picture"], img[alt*="headshot"], img[aria-label*="profile"]');
        profileImages.forEach((img, index) => {
            console.log(`🔍 PROFILE: Profile image ${index}:`, img.alt, img.ariaLabel);
            if (img.alt && img.alt.includes("'s profile picture")) {
                const name = img.alt.replace("'s profile picture", '').trim();
                if (name.length > 2) {
                    console.log(`✅ PROFILE: Name from image alt: ${name}`);
                    return name;
                }
            }
        });
        
        // Method 2: Look in page source
        const pageSource = document.documentElement.innerHTML;
        const nameMatch = pageSource.match(/"firstName":"([^"]+)"|"lastName":"([^"]+)"/g);
        if (nameMatch) {
            console.log('🔍 PROFILE: Found name in page source:', nameMatch);
        }
        
        // Method 3: Check all h1 elements
        const allH1s = document.querySelectorAll('h1');
        console.log(`🔍 PROFILE: Found ${allH1s.length} h1 elements:`);
        allH1s.forEach((h1, index) => {
            const text = h1.textContent?.trim();
            console.log(`🔍 PROFILE: H1 ${index}: "${text}"`, h1);
            if (text && text.length > 2 && text.length < 50 && 
                !text.includes('LinkedIn') && !text.includes('Profile') && 
                !text.includes('View') && !text.includes('Edit') &&
                !text.includes('Add') && !text.includes('Save') &&
                /^[A-Za-z\s.-]+$/.test(text)) {
                console.log(`✅ PROFILE: Potential name from h1: ${text}`);
                return text;
            }
        });
        
        console.log('❌ PROFILE: No name found');
        return null;
    }
    
    extractProfileHeadline() {
        console.log('🔍 PROFILE: Starting headline extraction...');
        
        const headlineSelectors = [
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            '.pv-top-card--list-bullet',
            '.pv-entity__summary-info .pv-entity__summary-info-content',
            '.profile-top-card__headline',
            // New selectors for current LinkedIn interface
            '.pv-top-card--list .text-body-medium',
            'section.pv-top-card .text-body-medium',
            '.pv-entity__summary-info .text-body-medium',
            '.profile-rail-card__body .text-body-medium',
            '[data-field="headline"]',
            '.pv-top-card .text-body-medium:not(.pv-top-card--list-bullet)',
            '.pv-text-details__left-panel > div:nth-child(2)',
            'h1 + .text-body-medium',
            '.text-heading-xlarge + .text-body-medium'
        ];
        
        for (const selector of headlineSelectors) {
            try {
                console.log(`🔍 PROFILE: Trying headline selector: ${selector}`);
                const elements = document.querySelectorAll(selector);
                console.log(`🔍 PROFILE: Found ${elements.length} headline elements`);
                
                elements.forEach((el, index) => {
                    const text = el.textContent?.trim();
                    console.log(`🔍 PROFILE: Headline element ${index}: "${text}"`);
                    if (text && text.length > 10 && text.length < 200 && 
                        !text.includes('LinkedIn') && !text.includes('connections') &&
                        !text.includes('followers') && !text.includes('View') &&
                        !text.includes('Edit') && !text.includes('Add')) {
                        console.log(`✅ PROFILE: Valid headline found: ${text}`);
                        return text;
                    }
                });
                
                const element = document.querySelector(selector);
                if (element && element.textContent?.trim()) {
                    const headline = element.textContent.trim();
                    if (headline.length > 10 && headline.length < 200 && 
                        !headline.includes('connections') &&
                        !headline.includes('followers')) {
                        console.log(`✅ PROFILE: Headline found with selector ${selector}: ${headline}`);
                        return headline;
                    }
                }
            } catch (error) {
                console.warn(`⚠️ PROFILE: Headline selector failed: ${selector}`, error);
            }
        }
        
        console.log('❌ PROFILE: No headline found');
        return null;
    }
    
    extractProfileAbout() {
        const aboutSelectors = [
            '.pv-about__summary-text .break-words',
            '.pv-about-section .pv-about__summary-text',
            '.summary-section .pv-about__summary-text',
            '[data-section="summary"] .break-words'
        ];
        
        for (const selector of aboutSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
                return element.textContent.trim();
            }
        }
        return null;
    }
    
    extractProfileExperience() {
        const experiences = [];
        const experienceItems = document.querySelectorAll('.pv-entity__summary-info, .pv-experience-section__summary');
        
        experienceItems.forEach(item => {
            const title = item.querySelector('h3, .pv-entity__summary-title')?.textContent?.trim();
            const company = item.querySelector('.pv-entity__secondary-title, .pv-entity__summary-info-v2')?.textContent?.trim();
            const duration = item.querySelector('.pv-entity__bullet-item-v2, .pv-entity__date-range')?.textContent?.trim();
            
            if (title && company) {
                experiences.push({
                    title,
                    company: company.replace(/^at\s+/i, ''),
                    duration: duration || ''
                });
            }
        });
        
        return experiences.slice(0, 3); // Keep top 3 experiences
    }
    
    extractProfileSkills() {
        const skills = [];
        const skillElements = document.querySelectorAll('.pv-skill-category-entity__name span[aria-hidden="true"], .skill-category-entity__name');
        
        skillElements.forEach(element => {
            const skill = element.textContent?.trim();
            if (skill && skills.length < 10) { // Limit to top 10 skills
                skills.push(skill);
            }
        });
        
        return skills;
    }
    
    extractProfileEducation() {
        const education = [];
        const educationItems = document.querySelectorAll('.pv-education-entity, .education-section__item');
        
        educationItems.forEach(item => {
            const school = item.querySelector('h3, .pv-entity__school-name')?.textContent?.trim();
            const degree = item.querySelector('.pv-entity__degree-name, .pv-entity__fos')?.textContent?.trim();
            
            if (school) {
                education.push({
                    school,
                    degree: degree || ''
                });
            }
        });
        
        return education.slice(0, 2); // Keep top 2 education entries
    }
    
    extractProfileLocation() {
        const locationSelectors = [
            '.text-body-small.inline.t-black--light.break-words',
            '.pv-text-details__left-panel .text-body-small',
            '.profile-top-card__location'
        ];
        
        for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim() && 
                !element.textContent.includes('connections') &&
                !element.textContent.includes('followers')) {
                return element.textContent.trim();
            }
        }
        return null;
    }
    
    extractCurrentUserName() {
        // Try to extract current user name from navigation or header area
        console.log('🔍 Trying to extract current user name...');
        
        const nameSelectors = [
            // Updated selectors for current LinkedIn interface
            '.global-nav__me-text',
            '.nav-item__profile-member-name',
            '.profile-dropdown-menu-trigger__label',
            '.a11y-dropdown-body .t-16',
            'button[data-test-global-nav-profile] span',
            '.me-photo-compact + span',
            '.profile-chevron-label',
            '.global-nav__me-button span:not(.visually-hidden)',
            '.profile-link .profile-link__title',
            // Fallback selectors
            '.global-nav__me-photo + span',
            '.nav-item__profile-member-photo + span'
        ];
        
        for (const selector of nameSelectors) {
            console.log(`🔍 Trying selector: ${selector}`);
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 Found ${elements.length} elements`);
            
            for (const element of elements) {
                const text = element.textContent?.trim();
                console.log(`🔍 Element text: "${text}"`);
                
                if (text && text.length > 1 && text.length < 100 && 
                    !text.includes('View profile') && 
                    !text.includes('My profile') &&
                    !text.includes('Profile') &&
                    !text.toLowerCase().includes('menu')) {
                    console.log(`✅ Found current user name: ${text}`);
                    return text;
                }
            }
        }
        
        console.log('⚠️ Could not find current user name');
        return null;
    }
    
    extractCurrentUserProfileUrl() {
        // Try to find the current user's profile URL from navigation
        console.log('🔍 Trying to extract current user profile URL...');
        
        const profileLinkSelectors = [
            // Updated selectors for current LinkedIn interface
            'a[href*="/in/"][data-test-global-nav-profile]',
            'button[data-test-global-nav-profile]',
            '.global-nav__me a[href*="/in/"]',
            '.nav-item__profile-member-photo[href*="/in/"]',
            'a[href*="/in/"][data-control-name="identity_profile_photo"]',
            '.profile-link[href*="/in/"]',
            '.me-photo-compact[href*="/in/"]',
            // Fallback approach - look for any profile links
            'a[href*="/in/me"]'
        ];
        
        for (const selector of profileLinkSelectors) {
            console.log(`🔍 Trying selector: ${selector}`);
            const element = document.querySelector(selector);
            
            if (element) {
                let url = element.href || element.getAttribute('href');
                console.log(`🔍 Found element with URL: ${url}`);
                
                if (url) {
                    // Ensure it's a full URL
                    if (url.startsWith('/')) {
                        url = 'https://www.linkedin.com' + url;
                    }
                    
                    if (url.includes('/in/')) {
                        console.log(`✅ Found profile URL: ${url}`);
                        return url;
                    }
                }
            }
        }
        
        console.log('⚠️ Could not find current user profile URL');
        return null;
    }

    extractPostData(postContainer) {
        console.log('🔍 EXTRACTING POST DATA');
        console.log('Post container element:', postContainer);
        console.log('Post container HTML preview:', postContainer.outerHTML.substring(0, 200) + '...');
        
        // Enhanced selectors for different LinkedIn layouts
        const postSelectors = [
            '.feed-shared-update-v2__description-wrapper .break-words',
            '.feed-shared-update-v2__description-wrapper span[dir="ltr"]',
            '.feed-shared-update-v2__description-wrapper',
            '.feed-shared-text',
            '.feed-shared-update-v2__commentary',
            '.feed-shared-article__description',
            '.feed-shared-text__text-view',
            '.update-components-text',
            '.update-components-text span[dir="ltr"]',
            '.feed-shared-text span[dir="ltr"]',
            'span[dir="ltr"]:not(.visually-hidden)',
            '.feed-shared-update-v2 span[dir="ltr"]'
        ];
        
        const authorSelectors = [
            '.feed-shared-actor__name .visually-hidden',
            '.feed-shared-actor__name span[aria-hidden="true"]',
            '.feed-shared-actor__name',
            '.update-components-actor__name',
            '.feed-shared-actor__title',
            '.update-components-actor__name span[aria-hidden="true"]'
        ];
        
        let postContent = null;
        let authorName = null;
        
        // Try to find post content within this specific post container
        console.log('🔎 Searching for post content in container...');
        for (const selector of postSelectors) {
            const elements = postContainer.querySelectorAll(selector);
            console.log(`Selector '${selector}' found ${elements.length} elements in this post container`);
            
            for (const element of elements) {
                if (element && element.innerText?.trim() && element.innerText.length > 10) {
                    console.log(`Checking element text: "${element.innerText.trim().substring(0, 80)}..."`);
                    
                    // Skip elements that are likely names or very short text
                    if (!element.closest('.feed-shared-actor__name') && 
                        !element.closest('.feed-shared-actor__title')) {
                        postContent = element;
                        console.log('✅ FOUND POST CONTENT:', element.innerText.trim().substring(0, 150) + '...');
                        break;
                    } else {
                        console.log('❌ Skipped element (author name/title)');
                    }
                }
            }
            if (postContent) break;
        }
        
        // Try to find author name within this specific post container
        for (const selector of authorSelectors) {
            authorName = postContainer.querySelector(selector);
            if (authorName && authorName.innerText?.trim()) {
                break;
            }
        }
        
        // If still no content found, try getting any meaningful text from the post
        if (!postContent) {
            const allTextElements = postContainer.querySelectorAll('span, p, div');
            for (const element of allTextElements) {
                const text = element.innerText?.trim();
                if (text && text.length > 20 && text.length < 5000) {
                    // Exclude common UI elements
                    if (!text.includes('Like') && !text.includes('Comment') && 
                        !text.includes('Share') && !text.includes('Send') &&
                        !text.includes('ago') && !text.includes('•')) {
                        postContent = element;
                        break;
                    }
                }
            }
        }
        
        if (!postContent || !postContent.innerText?.trim()) {
            console.log('No post content found in container:', postContainer);
            return null;
        }

        const result = {
            content: postContent.innerText?.trim() || '',
            author: authorName?.innerText?.trim() || 'Unknown',
            url: window.location.href
        };
        
        console.log('🎯 FINAL EXTRACTED POST DATA:');
        console.log('Content:', result.content.substring(0, 200) + '...');
        console.log('Author:', result.author);
        console.log('Full result object:', result);
        return result;
    }
    
    async generateComment(postData) {
        console.log('🤖 === STARTING GENERATECOMMENT METHOD ===');
        console.log('Post data received:', postData);
        
        try {
            // Test if context is still valid
            if (!this.contextValid) {
                console.log('❌ Extension context is invalid!');
                throw new Error('Extension context is invalid');
            }
            console.log('✅ Extension context is valid');
            
            console.log('🔍 Getting settings from storage...');
            const settings = await chrome.storage.local.get([
                'geminiApiKey', 'commentLength', 'tone', 'industry', 'useProfileData', 'commentStyle', 'includeQuestions'
            ]);
            console.log('📋 Settings retrieved:', {
                hasApiKey: !!settings.geminiApiKey,
                apiKeyLength: settings.geminiApiKey?.length || 0,
                commentLength: settings.commentLength,
                tone: settings.tone,
                industry: settings.industry,
                useProfileData: settings.useProfileData,
                commentStyle: settings.commentStyle,
                includeQuestions: settings.includeQuestions
            });
            
            // Extract user profile data if enabled
            let userProfile = null;
            if (settings.useProfileData !== false) { // Default to true if not set
                console.log('🔍 Extracting user profile data...');
                userProfile = await this.extractUserProfile();
                
                console.log('🔍 Profile extraction result:', userProfile);
                
                // If no profile data found on current page, check stored profile
                if (!userProfile || (!userProfile.name && !userProfile.headline)) {
                    console.log('🔍 No profile data on current page, checking stored profile...');
                    const storedProfile = await chrome.storage.local.get(['userProfile']);
                    if (storedProfile.userProfile) {
                        console.log('✅ Using stored profile data');
                        userProfile = storedProfile.userProfile;
                    } else {
                        console.log('⚠️ No stored profile data found');
                    }
                } else {
                    // Store extracted profile for future use
                    console.log('✅ Storing extracted profile data');
                    await chrome.storage.local.set({ userProfile: userProfile });
                }
            }
            
            if (!settings.geminiApiKey) {
                console.log('❌ No Gemini API key found in settings!');
                throw new Error('Gemini API key not configured. Please set it in the extension popup.');
            }
            console.log('✅ Gemini API key found');
            
            console.log('📤 Sending message to background script for comment generation...');
            
            // Send message to background script to generate comment with timeout
            return new Promise((resolve, reject) => {
                console.log('⏳ Setting up 50-second timeout for API call...');
                const timeout = setTimeout(() => {
                    console.log('⏰ API call timeout reached!');
                    reject(new Error('Comment generation timeout. Please try again.'));
                }, 50000); // 50 second timeout (longer than background script)
                
                try {
                    console.log('📤 Sending chrome.runtime.sendMessage...');
                    chrome.runtime.sendMessage({
                        action: 'generateComment',
                        postData: postData,
                        settings: settings,
                        userProfile: userProfile
                    }, (response) => {
                        console.log('📨 Received response from background script:', response);
                        clearTimeout(timeout);
                        
                        if (chrome.runtime.lastError) {
                            console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
                            const errorMessage = chrome.runtime.lastError.message || 'Unknown extension communication error';
                            reject(new Error('Extension communication error: ' + errorMessage));
                        } else if (response && response.error) {
                            console.error('❌ Background script error:', response.error);
                            reject(new Error(response.error));
                        } else if (response && response.comment) {
                            console.log('✅ Comment generated successfully from background script');
                            resolve(response.comment);
                        } else {
                            console.log('❌ Invalid response structure:', response);
                            reject(new Error('Invalid response from background script'));
                        }
                    });
                } catch (error) {
                    console.error('❌ Error sending message to background:', error);
                    clearTimeout(timeout);
                    reject(new Error('Failed to communicate with extension background script: ' + error.message));
                }
            });
        } catch (error) {
            console.error('❌ Error in generateComment method:', error);
            console.error('Error stack:', error.stack);
            // Show user-friendly error message
            this.showTemporaryMessage(document.body, `Comment generation failed: ${error.message}`, 'error');
            throw error;
        }
    }
    
    async insertCommentIntoBox(postContainer, comment) {
        console.log('Attempting to insert comment into editable comment input box...');
        console.log('Comment to insert:', comment.substring(0, 50) + '...');
        
        // Debug: Show which post we're working with
        const postContent = postContainer.querySelector('.feed-shared-update-v2__description-wrapper')?.innerText?.trim();
        console.log('Target post content preview:', postContent?.substring(0, 100) + '...');
        
        // Updated selectors prioritizing main editable comment input areas
        const commentBoxSelectors = [
            // Primary selectors for main comment input (not replies or read-only areas)
            '.comments-comment-box-comment__text-editor[contenteditable="true"]',
            '.comments-comment-box__text-editor[contenteditable="true"]',
            
            // Look for the main comment input container with placeholder text
            'div[contenteditable="true"][placeholder*="comment"]',
            'div[contenteditable="true"][data-placeholder*="comment"]',
            'div[contenteditable="true"][aria-label*="comment"]',
            
            // Specific LinkedIn comment input patterns
            '.comments-comment-box-comment__text-editor:not([aria-expanded="false"]):not(.comments-comment-box-comment__text-editor--minimal)',
            '.comments-comment-box__text-editor:not([aria-expanded="false"])',
            
            // Generic contenteditable with textbox role (avoid reply boxes)
            'div[contenteditable="true"][role="textbox"]:not(.comments-comment-box-comment__text-editor--minimal)',
            
            // Last resort - any visible contenteditable
            '.comments-comment-box-comment__text-editor',
            '.comments-comment-box__comment-text-editor'
        ];
        
        let commentBox = null;
        
        console.log('Searching for main editable comment input box...');
        
        // Enhanced detection logic - prioritize main comment input within the specific post
        // First, try to find comment box within the specific post container
        for (const selector of commentBoxSelectors) {
            const boxes = postContainer.querySelectorAll(selector);
            console.log(`Post-specific selector '${selector}' found ${boxes.length} boxes`);
            
            for (const box of boxes) {
                // Check if this is a main comment input (not a reply or read-only area)
                if (this.isMainCommentInput(box, postContainer)) {
                    commentBox = box;
                    console.log(`Found main comment input in post container with selector: ${selector}`);
                    break;
                }
            }
            if (commentBox) break;
        }
        
        // If no main comment input found in post container, search for recently opened comment boxes
        if (!commentBox) {
            console.log('Main comment input not found in post container, searching for recently opened comment boxes...');
            
            // Look for comment boxes that are likely related to this post
            // Priority 1: Comment boxes near this post container
            const postRect = postContainer.getBoundingClientRect();
            
            for (const selector of commentBoxSelectors) {
                const boxes = document.querySelectorAll(selector);
                
                // Find the comment box closest to this post (spatially)
                let closestBox = null;
                let closestDistance = Infinity;
                
                for (const box of boxes) {
                    if (this.isElementVisible(box) && this.isMainCommentInput(box, postContainer)) {
                        const boxRect = box.getBoundingClientRect();
                        // Calculate distance between post and comment box
                        const distance = Math.abs(boxRect.top - postRect.bottom);
                        
                        if (distance < closestDistance && distance < 1200) { // Within 1200px
                            closestDistance = distance;
                            closestBox = box;
                        }
                    }
                }
                
                if (closestBox) {
                    commentBox = closestBox;
                    console.log(`Found closest comment box with distance ${closestDistance}px using selector: ${selector}`);
                    break;
                }
            }
            
            // Priority 2: If no close comment box found, look for the most recently focused comment box
            if (!commentBox) {
                for (const selector of commentBoxSelectors) {
                    const boxes = document.querySelectorAll(selector);
                    
                    // Look for the most recently visible main comment input (last in DOM order)
                    for (let i = boxes.length - 1; i >= 0; i--) {
                        const box = boxes[i];
                        if (this.isElementVisible(box) && this.isMainCommentInput(box, postContainer)) {
                            commentBox = box;
                            console.log(`Found visible main comment input at index ${i} with selector: ${selector}`);
                            break;
                        }
                    }
                    if (commentBox) break;
                }
            }
        }
        
        // If still not found, wait and try with more targeted search
        if (!commentBox) {
            console.log('Comment input still not found, waiting 3 seconds and trying more targeted search...');
            await this.wait(3000);
            
            // Try again with focus on the specific post area
            const postRect = postContainer.getBoundingClientRect();
            const allEditableBoxes = document.querySelectorAll('[contenteditable="true"]');
            console.log(`Found ${allEditableBoxes.length} contenteditable elements on retry`);
            
            // Look for comment boxes that appeared after clicking (likely the one we want)
            for (const box of allEditableBoxes) {
                if (this.isMainCommentInput(box, postContainer)) {
                    const boxRect = box.getBoundingClientRect();
                    // Prioritize comment boxes near our post
                    const distance = Math.abs(boxRect.top - postRect.bottom);
                    
                    if (distance < 600) { // Within 600px of the post
                        commentBox = box;
                        console.log(`Found comment box near post at distance ${distance}px on retry`);
                        break;
                    }
                }
            }
            
            // Last resort - any visible main comment input (ignore distance)
            if (!commentBox) {
                console.log('Still no nearby comment input found, trying last resort without distance check...');
                for (const box of allEditableBoxes) {
                    if (this.isMainCommentInput(box, null)) { // Don't pass postContainer to skip distance check
                        commentBox = box;
                        console.log('Found comment box using last resort criteria (no distance check)');
                        break;
                    }
                }
            }
        }
        
        if (commentBox) {
            console.log('Comment box found! Inserting comment...');
            console.log('Comment box element:', commentBox);
            
            // Clear existing content
            commentBox.innerHTML = '';
            commentBox.textContent = comment;
            
            // Trigger comprehensive events to ensure LinkedIn recognizes the input
            const events = [
                { type: 'focus', bubbles: true },
                { type: 'input', bubbles: true, cancelable: true },
                { type: 'change', bubbles: true },
                { type: 'keyup', bubbles: true },
                { type: 'keydown', bubbles: true },
                { type: 'paste', bubbles: true },
                { type: 'textInput', bubbles: true }
            ];
            
            events.forEach(eventConfig => {
                const event = new Event(eventConfig.type, eventConfig);
                commentBox.dispatchEvent(event);
            });
            
            // Also trigger InputEvent specifically
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                inputType: 'insertText',
                data: comment
            });
            commentBox.dispatchEvent(inputEvent);
            
            // Focus and select the content
            commentBox.focus();
            
            // Force a visual update
            if (commentBox.style) {
                commentBox.style.minHeight = 'auto';
                commentBox.style.minHeight = commentBox.scrollHeight + 'px';
            }
            
            console.log('Comment successfully inserted into main editable comment input box');
            
            // Verify the content was set
            setTimeout(() => {
                console.log('Verification - Comment box content after 1 second:', commentBox.textContent?.substring(0, 50));
            }, 1000);
            
        } else {
            console.log('ERROR: Could not find any suitable main comment input box');
            console.log('Available contenteditable elements:', 
                document.querySelectorAll('[contenteditable="true"]').length);
            console.log('Available comment-related elements:', 
                document.querySelectorAll('[class*="comments-comment-box"]').length);
            
            // Debug: List all found contenteditable elements for troubleshooting
            const allEditable = document.querySelectorAll('[contenteditable="true"]');
            console.log('All contenteditable elements found:');
            allEditable.forEach((el, i) => {
                console.log(`  [${i}] Class: ${el.className}, Placeholder: ${el.getAttribute('placeholder')}, Visible: ${this.isElementVisible(el)}`);
            });
        }
    }
    
    isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetParent !== null;
    }
    
    isMainCommentInput(element, postContainer = null) {
        if (!element) return false;
        
        // Check if it's contenteditable (must be editable)
        if (element.getAttribute('contenteditable') !== 'true') {
            console.log('Element is not contenteditable=true, skipping');
            return false;
        }
        
        // Check if it's not a minimal/collapsed comment box
        if (element.classList.contains('comments-comment-box-comment__text-editor--minimal')) {
            console.log('Element is minimal comment box, skipping');
            return false;
        }
        
        // Check if it's not inside a nested reply area
        const isInReplyArea = element.closest('.comments-comment-item__inline-comment-form') ||
                             element.closest('.comments-comment-item__nested-comments') ||
                             element.closest('.comments-reply-box');
        
        if (isInReplyArea) {
            console.log('Element is in a reply area, skipping');
            return false;
        }
        
        // Check if it's not read-only (should not have readonly attribute)
        if (element.hasAttribute('readonly') || element.hasAttribute('disabled')) {
            console.log('Element is readonly or disabled, skipping');
            return false;
        }
        
        // Prefer elements with placeholder text about adding comments
        const hasCommentPlaceholder = element.getAttribute('placeholder')?.toLowerCase().includes('comment') ||
                                    element.getAttribute('data-placeholder')?.toLowerCase().includes('comment') ||
                                    element.getAttribute('aria-label')?.toLowerCase().includes('comment');
        
        // Check parent structure to ensure it's a main comment form
        const isInMainCommentForm = element.closest('.comments-comment-box') && 
                                   !element.closest('.comments-comment-item');
        
        // If we have a specific post container, check spatial proximity
        if (postContainer) {
            try {
                const postRect = postContainer.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const distance = Math.abs(elementRect.top - postRect.bottom);
                
                // Comment box should be relatively close to the post (within 1200px)
                // Increased from 800px because LinkedIn often uses shared comment boxes
                if (distance > 1200) {
                    console.log(`Element is too far from post (${distance}px), skipping`);
                    return false;
                }
            } catch (error) {
                // If we can't get bounding rects, don't use spatial filtering
                console.log('Could not calculate spatial proximity, ignoring distance check');
            }
        }
        
        console.log(`Element validation: placeholder=${hasCommentPlaceholder}, mainForm=${isInMainCommentForm}`);
        
        return this.isElementVisible(element) && (hasCommentPlaceholder || isInMainCommentForm);
    }
    
    showTemporaryMessage(postContainer, message, type = 'info') {
        this.removeExistingIndicators(postContainer);
        
        const colors = {
            'warning': '#ff9800',
            'error': '#dc3545',
            'info': '#0a66c2',
            'success': '#28a745'
        };
        
        const indicator = document.createElement('div');
        indicator.className = 'commentron-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: -40px;
                right: 10px;
                background: ${colors[type]};
                color: white;
                padding: 8px 12px;
                border-radius: 16px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                max-width: 250px;
                text-align: center;
            ">
                ${message}
            </div>
        `;
        
        const commentSection = postContainer.querySelector('.social-actions-buttons, .feed-shared-social-action-bar');
        if (commentSection) {
            commentSection.style.position = 'relative';
            commentSection.appendChild(indicator);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (indicator.parentElement) {
                    indicator.remove();
                }
            }, 5000);
        }
    }
    
    showGeneratingIndicator(postContainer) {
        this.removeExistingIndicators(postContainer);
        
        const indicator = document.createElement('div');
        indicator.className = 'commentron-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: -40px;
                right: 10px;
                background: #0a66c2;
                color: white;
                padding: 8px 12px;
                border-radius: 16px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                animation: pulse 1.5s infinite;
            ">
                🤖 Generating comment...
            </div>
        `;
        
        const commentSection = postContainer.querySelector('.social-actions-buttons, .feed-shared-social-action-bar');
        if (commentSection) {
            commentSection.style.position = 'relative';
            commentSection.appendChild(indicator);
        }
    }
    
    showRegeneratingIndicator(postContainer) {
        this.removeExistingIndicators(postContainer);
        
        const indicator = document.createElement('div');
        indicator.className = 'commentron-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: -40px;
                right: 10px;
                background: #7c4dff;
                color: white;
                padding: 8px 12px;
                border-radius: 16px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                animation: pulse 1.5s infinite;
            ">
                🔄 Regenerating comment...
            </div>
        `;
        
        const commentSection = postContainer.querySelector('.social-actions-buttons, .feed-shared-social-action-bar');
        if (commentSection) {
            commentSection.style.position = 'relative';
            commentSection.appendChild(indicator);
        }
    }
    
    showCommentInsertedIndicator(postContainer) {
        this.removeExistingIndicators(postContainer);
        
        const indicator = document.createElement('div');
        indicator.className = 'commentron-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: -40px;
                right: 10px;
                background: #28a745;
                color: white;
                padding: 8px 12px;
                border-radius: 16px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
                ✅ Comment generated!
            </div>
        `;
        
        const commentSection = postContainer.querySelector('.social-actions-buttons, .feed-shared-social-action-bar');
        if (commentSection) {
            commentSection.style.position = 'relative';
            commentSection.appendChild(indicator);
        }
    }
    
    showErrorIndicator(postContainer) {
        this.removeExistingIndicators(postContainer);
        
        const indicator = document.createElement('div');
        indicator.className = 'commentron-indicator';
        indicator.innerHTML = `
            <div style="
                position: absolute;
                top: -40px;
                right: 10px;
                background: #dc3545;
                color: white;
                padding: 8px 12px;
                border-radius: 16px;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            ">
                ❌ Generation failed
            </div>
        `;
        
        const commentSection = postContainer.querySelector('.social-actions-buttons, .feed-shared-social-action-bar');
        if (commentSection) {
            commentSection.style.position = 'relative';
            commentSection.appendChild(indicator);
        }
    }
    
    hideGeneratingIndicator(postContainer) {
        this.removeExistingIndicators(postContainer);
    }
    
    removeExistingIndicators(postContainer) {
        const existingIndicators = postContainer.querySelectorAll('.commentron-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
    }

    async postComment(comment) {
        try {
            // Find the active comment box or create one
            let commentBox = document.querySelector('.comments-comment-box__comment-text-editor p');
            
            if (!commentBox) {
                // Click comment button to open comment box
                const commentButton = document.querySelector('.comment-button');
                if (commentButton) {
                    commentButton.click();
                    await this.wait(1000);
                    commentBox = document.querySelector('.comments-comment-box__comment-text-editor p');
                }
            }

            if (commentBox) {
                // Clear and set new content
                commentBox.innerHTML = '';
                commentBox.textContent = comment;
                
                // Trigger input events
                const inputEvent = new Event('input', { bubbles: true });
                commentBox.dispatchEvent(inputEvent);
                
                await this.wait(500);
                
                // Find and click submit button
                const submitButton = document.querySelector('.comments-comment-box__submit-button:not([disabled])');
                if (submitButton) {
                    submitButton.click();
                    console.log('Comment posted automatically:', comment);
                }
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .commentron-debug {
        position: fixed;
        top: 10px;
        right: 10px;
        background: #0a66c2;
        color: white;
        padding: 10px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
    }
`;
document.head.appendChild(style);

// Initialize the bot
console.log('🔥 === ABOUT TO INITIALIZE BOT ===');
try {
    const linkedInBot = new LinkedInCommentBot();
    console.log('🔥 Bot initialized successfully:', linkedInBot);
    
    // Add global reference for debugging
    window.linkedInBot = linkedInBot;
    
    // Add manual test function
    window.testExtensionBasics = function() {
        console.log('🔥 === MANUAL EXTENSION TEST ===');
        console.log('Chrome runtime available:', !!chrome.runtime);
        console.log('Chrome storage available:', !!chrome.storage);
        console.log('Bot context valid:', linkedInBot.contextValid);
        console.log('Bot is generating:', linkedInBot.isGenerating);
        
        // Test chrome storage
        chrome.storage.local.get(['autoGenerateOnClick', 'geminiApiKey']).then(settings => {
            console.log('Current settings:', {
                autoGenerateOnClick: settings.autoGenerateOnClick,
                hasApiKey: !!settings.geminiApiKey,
                apiKeyLength: settings.geminiApiKey?.length || 0
            });
        }).catch(error => {
            console.error('Storage test failed:', error);
        });
        
        // Test if buttons are found
        const commentButtons = document.querySelectorAll('.social-actions-buttons button, .feed-shared-social-action-bar button');
        console.log(`Found ${commentButtons.length} potential comment buttons`);
        
        let actualCommentButtons = 0;
        commentButtons.forEach(button => {
            const text = button.innerText?.toLowerCase()?.trim() || '';
            if (text.includes('comment')) {
                actualCommentButtons++;
                console.log('Comment button found:', {
                    text: text,
                    className: button.className,
                    hasListener: !!button.dataset.commentronEnabled
                });
            }
        });
        
        console.log(`Total actual comment buttons: ${actualCommentButtons}`);
        console.log('🔥 === MANUAL TEST COMPLETE ===');
    };
    
    // Add background script test function
    window.testBackgroundCommunication = function() {
        console.log('🔥 === TESTING BACKGROUND COMMUNICATION ===');
        
        // Send a ping message to background script
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('🔥 Background communication FAILED:', chrome.runtime.lastError);
            } else {
                console.log('🔥 Background communication SUCCESS:', response);
            }
        });
        
        // Test with a simple generateComment message
        const testPostData = {
            content: 'This is a test post for API testing',
            author: 'Test User',
            url: window.location.href
        };
        
        chrome.storage.local.get(['geminiApiKey', 'commentLength', 'tone', 'industry']).then(settings => {
            console.log('🔥 Sending test generateComment message...');
            
            chrome.runtime.sendMessage({
                action: 'generateComment',
                postData: testPostData,
                settings: settings
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('🔥 Test generateComment FAILED:', chrome.runtime.lastError);
                } else {
                    console.log('🔥 Test generateComment SUCCESS:', response);
                }
            });
        });
        
        console.log('🔥 Background communication test sent, check console for results...');
    };
    
} catch (error) {
    console.error('🔥 FAILED TO INITIALIZE BOT:', error);
    console.error('🔥 Error stack:', error.stack);
}

// Add global test function for debugging
window.testCommentGeneration = async function() {
    console.log('=== TESTING COMMENT GENERATION WITH SPECIFIC CLASSES ===');
    
    // Find elements with artdeco-button__text class that contain "comment"
    const artdecoTextElements = document.querySelectorAll('.artdeco-button__text');
    console.log(`Found ${artdecoTextElements.length} .artdeco-button__text elements`);
    
    let commentButton = null;
    
    artdecoTextElements.forEach((textElement, index) => {
        const text = textElement.innerText?.toLowerCase()?.trim() || '';
        console.log(`Element ${index}: "${text}"`);
        
        if (text.includes('comment') && !commentButton) {
            commentButton = textElement.closest('button');
            console.log('Found comment button:', commentButton);
        }
    });
    
    if (commentButton) {
        console.log('Testing with artdeco-button__text comment button');
        
        // Simulate clicking the button
        commentButton.click();
        
        // Wait for comment box to appear
        setTimeout(async () => {
            console.log('Looking for .comments-comment-box-comment__text-editor...');
            
            const commentBoxes = document.querySelectorAll('.comments-comment-box-comment__text-editor');
            console.log(`Found ${commentBoxes.length} .comments-comment-box-comment__text-editor elements`);
            
            if (commentBoxes.length > 0) {
                const commentBox = commentBoxes[commentBoxes.length - 1]; // Get the last one
                const testComment = 'This is a test comment generated by CommenTron!';
                
                console.log('Inserting test comment...');
                commentBox.textContent = testComment;
                
                // Trigger events
                const inputEvent = new Event('input', { bubbles: true });
                commentBox.dispatchEvent(inputEvent);
                commentBox.focus();
                
                console.log('Test comment inserted successfully!');
            } else {
                console.log('No .comments-comment-box-comment__text-editor found');
            }
        }, 2000);
    } else {
        console.log('No comment button found with .artdeco-button__text');
    }
};

// Add global test functions for debugging
window.testExtensionBasics = function() {
    console.log('🔥 === MANUAL EXTENSION TEST ===');
    console.log('Chrome runtime available:', !!chrome.runtime);
    console.log('Chrome storage available:', !!chrome.storage);
    console.log('Bot context valid:', window.linkedInBot?.contextValid);
    console.log('Bot is generating:', window.linkedInBot?.isGenerating);
    
    // Test chrome storage
    chrome.storage.local.get(['autoGenerateOnClick', 'geminiApiKey']).then(settings => {
        console.log('Current settings:', {
            autoGenerateOnClick: settings.autoGenerateOnClick,
            hasApiKey: !!settings.geminiApiKey,
            apiKeyLength: settings.geminiApiKey?.length || 0
        });
    }).catch(error => {
        console.error('Storage test failed:', error);
    });
    
    // Test if buttons are found
    const commentButtons = document.querySelectorAll('.social-actions-buttons button, .feed-shared-social-action-bar button');
    console.log(`Found ${commentButtons.length} potential comment buttons`);
    
    let actualCommentButtons = 0;
    commentButtons.forEach(button => {
        const text = button.innerText?.toLowerCase()?.trim() || '';
        if (text.includes('comment')) {
            actualCommentButtons++;
            console.log('Comment button found:', {
                text: text,
                className: button.className,
                hasListener: !!button.dataset.commentronEnabled
            });
        }
    });
    
    console.log(`Total actual comment buttons: ${actualCommentButtons}`);
    console.log('🔥 === MANUAL TEST COMPLETE ===');
};

// Add background script test function
window.testBackgroundCommunication = function() {
    console.log('🔥 === TESTING BACKGROUND COMMUNICATION ===');
    
    // Send a ping message to background script
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('🔥 Background communication FAILED:', chrome.runtime.lastError);
        } else {
            console.log('🔥 Background communication SUCCESS:', response);
        }
    });
    
    // Test with a simple generateComment message
    const testPostData = {
        content: 'This is a test post for API testing',
        author: 'Test User',
        url: window.location.href
    };
    
    chrome.storage.local.get(['geminiApiKey', 'commentLength', 'tone', 'industry']).then(settings => {
        console.log('🔥 Sending test generateComment message...');
        
        chrome.runtime.sendMessage({
            action: 'generateComment',
            postData: testPostData,
            settings: settings
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('🔥 Test generateComment FAILED:', chrome.runtime.lastError);
            } else {
                console.log('🔥 Test generateComment SUCCESS:', response);
            }
        });
    });
    
    console.log('🔥 Background communication test sent, check console for results...');
};

// Add debug info to page
const debugDiv = document.createElement('div');
debugDiv.className = 'commentron-debug';
debugDiv.innerHTML = `
    CommenTron Debug Active<br>
    <small>Open console and run: testCommentGeneration()</small>
`;
document.body.appendChild(debugDiv);

// Auto-remove debug div after 10 seconds
setTimeout(() => {
    if (debugDiv.parentElement) {
        debugDiv.remove();
    }
}, 10000);

})(); // Close IIFE wrapper