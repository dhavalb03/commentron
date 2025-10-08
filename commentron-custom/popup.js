class CustomCommenTron {
    constructor() {
        this.init();
    }

    async init() {
        this.loadSettings();
        this.bindEvents();
        await this.checkApiKey();
    }

    async loadSettings() {
        const settings = await chrome.storage.local.get([
            'commentLength', 'tone', 'industry', 'autoDelay', 'autoGenerateOnClick', 'useProfileData', 'commentStyle', 'includeQuestions'
        ]);
        
        if (settings.commentLength) {
            document.getElementById('comment-length').value = settings.commentLength;
        }
        if (settings.tone) {
            document.getElementById('tone').value = settings.tone;
        }
        if (settings.industry) {
            document.getElementById('industry').value = settings.industry;
        }
        if (settings.commentStyle) {
            document.getElementById('comment-style').value = settings.commentStyle;
        }
        if (settings.autoDelay) {
            document.getElementById('delay').value = settings.autoDelay;
        }
        
        // Enable auto-generate on click by default if not set
        const autoGenerateOnClick = settings.autoGenerateOnClick !== undefined ? settings.autoGenerateOnClick : true;
        document.getElementById('auto-generate-on-click').checked = autoGenerateOnClick;
        
        // Enable profile data usage by default if not set
        const useProfileData = settings.useProfileData !== undefined ? settings.useProfileData : true;
        document.getElementById('use-profile-data').checked = useProfileData;
        
        // Enable questions by default if not set, but use explicit boolean logic
        const includeQuestions = settings.includeQuestions === true; // Must be explicitly true, not just truthy
        document.getElementById('include-questions').checked = includeQuestions;
        
        console.log('📋 Question settings:', {
            rawValue: settings.includeQuestions,
            processedValue: includeQuestions,
            checkboxValue: document.getElementById('include-questions').checked
        });
        
        // Save the default values if they weren't set before
        if (settings.autoGenerateOnClick === undefined || settings.useProfileData === undefined || settings.includeQuestions === undefined) {
            const defaultSettings = {
                autoGenerateOnClick: autoGenerateOnClick,
                useProfileData: useProfileData,
                includeQuestions: false // Default to false to prevent unwanted questions
            };
            
            await chrome.storage.local.set(defaultSettings);
            console.log('📋 Set default values:', defaultSettings);
        }
        
        // Load and display profile data if available
        await this.loadProfileData();
    }

    bindEvents() {
        document.getElementById('save-api').addEventListener('click', () => this.saveApiKey());
        document.getElementById('generate-comment').addEventListener('click', () => this.generateComment());
        document.getElementById('post-comment').addEventListener('click', () => this.postComment());
        document.getElementById('auto-comment').addEventListener('change', (e) => this.toggleAutoComment(e.target.checked));
        document.getElementById('auto-generate-on-click').addEventListener('change', (e) => this.toggleAutoGenerateOnClick(e.target.checked));
        document.getElementById('use-profile-data').addEventListener('change', (e) => this.toggleUseProfileData(e.target.checked));
        document.getElementById('include-questions').addEventListener('change', (e) => this.toggleIncludeQuestions(e.target.checked));
        document.getElementById('extract-profile').addEventListener('click', () => this.extractProfile());
        document.getElementById('clear-profile').addEventListener('click', () => this.clearProfile());
        
        // Save settings on change
        ['comment-length', 'tone', 'industry', 'delay', 'comment-style'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.saveSettings());
        });
    }

    async checkApiKey() {
        const result = await chrome.storage.local.get(['geminiApiKey']);
        if (result.geminiApiKey) {
            this.updateStatus('Ready to generate comments', 'success');
            document.getElementById('api-section').style.display = 'none';
        } else {
            this.updateStatus('Please configure your Gemini API key', 'warning');
        }
    }

    async saveApiKey() {
        const apiKey = document.getElementById('api-key').value.trim();
        if (!apiKey) {
            this.updateStatus('Please enter an API key', 'error');
            return;
        }

        await chrome.storage.local.set({ geminiApiKey: apiKey });
        this.updateStatus('API key saved successfully', 'success');
        document.getElementById('api-section').style.display = 'none';
        document.getElementById('api-key').value = '';
    }

    async saveSettings() {
        const settings = {
            commentLength: document.getElementById('comment-length').value,
            tone: document.getElementById('tone').value,
            industry: document.getElementById('industry').value,
            commentStyle: document.getElementById('comment-style').value,
            autoDelay: parseInt(document.getElementById('delay').value),
            useProfileData: document.getElementById('use-profile-data').checked,
            includeQuestions: document.getElementById('include-questions').checked // Explicit boolean value
        };
        
        console.log('📋 Saving settings:', settings);
        console.log('📋 Question checkbox state:', {
            checked: document.getElementById('include-questions').checked,
            savedValue: settings.includeQuestions
        });
        
        await chrome.storage.local.set(settings);
        console.log('✅ Settings saved successfully');
    }

    async generateComment() {
        try {
            this.updateStatus('Generating comment...', 'info');
            
            // Get current tab and extract post content
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            console.log('Current tab URL:', tab.url);
            
            if (!tab.url.includes('linkedin.com')) {
                this.updateStatus('Please navigate to LinkedIn first', 'error');
                return;
            }

            // Execute content script to get post data
            console.log('Executing content script to extract post data...');
            const postData = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.extractPostContent
            });

            console.log('Post data result:', postData);

            let finalPostData = postData[0].result;
            
            // If no post detected, create a generic fallback
            if (!finalPostData) {
                console.log('No post detected, using fallback approach...');
                
                // Try to give more specific guidance first
                if (tab.url.includes('/feed/')) {
                    // For feed pages, try a simplified extraction
                    const simplifiedData = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: this.extractAnyContent
                    });
                    
                    if (simplifiedData[0].result) {
                        finalPostData = simplifiedData[0].result;
                        console.log('Found content using simplified extraction:', finalPostData);
                    } else {
                        // Last resort: create a generic context
                        finalPostData = {
                            content: 'LinkedIn professional content',
                            author: 'LinkedIn Professional',
                            url: tab.url
                        };
                        console.log('Using generic fallback content');
                        this.updateStatus('No specific post detected, generating general professional comment...', 'info');
                    }
                } else {
                    this.updateStatus('Please navigate to LinkedIn feed or a specific post', 'error');
                    return;
                }
            }

            console.log('Successfully prepared post data:', finalPostData);
            const comment = await this.callGemini(finalPostData);
            
            if (comment) {
                document.getElementById('generated-comment').textContent = comment;
                document.getElementById('generated-comment').classList.add('show');
                document.getElementById('post-comment').style.display = 'block';
                this.updateStatus('Comment generated successfully', 'success');
            }
            
        } catch (error) {
            console.error('Error generating comment:', error);
            this.updateStatus('Error generating comment: ' + error.message, 'error');
        }
    }

    extractAnyContent() {
        console.log('=== SIMPLIFIED CONTENT EXTRACTION ===');
        console.log('Page URL:', window.location.href);
        
        // Very simple approach - just find any substantial text on the page
        const textElements = document.querySelectorAll('span, p, div, h1, h2, h3');
        console.log(`Found ${textElements.length} text elements to analyze`);
        
        const contentCandidates = [];
        
        textElements.forEach((element, index) => {
            const text = element.innerText?.trim();
            if (text && text.length > 20 && text.length < 1000) {
                // Skip obvious UI elements
                const skipPatterns = [
                    /^(Home|Jobs|Network|Messaging|Notifications)$/,
                    /^\d+[smhd]$/,
                    /^(Like|Comment|Share|Send)$/,
                    /^[\d,]+ (like|comment|share)/,
                    /LinkedIn/,
                    /Sign in|Sign up/
                ];
                
                const shouldSkip = skipPatterns.some(pattern => pattern.test(text)) ||
                                 element.closest('nav') ||
                                 element.closest('header') ||
                                 element.closest('button') ||
                                 element.closest('[role="navigation"]');
                
                if (!shouldSkip) {
                    contentCandidates.push({
                        text: text,
                        length: text.length,
                        element: element
                    });
                }
            }
        });
        
        console.log(`Found ${contentCandidates.length} content candidates`);
        
        // Sort by length and pick the longest meaningful content
        contentCandidates.sort((a, b) => b.length - a.length);
        
        if (contentCandidates.length > 0) {
            const bestContent = contentCandidates[0];
            console.log('Selected content:', bestContent.text.substring(0, 100) + '...');
            
            return {
                content: bestContent.text,
                author: 'LinkedIn Professional',
                url: window.location.href
            };
        }
        
        console.log('No suitable content found');
        return null;
    }

    extractPostContent() {
        console.log('Extracting post content from LinkedIn page...');
        
        // Enhanced selectors for different LinkedIn layouts and post types
        const postSelectors = [
            // Main feed posts
            '.feed-shared-update-v2__description-wrapper .break-words',
            '.feed-shared-update-v2__description-wrapper span[dir="ltr"]',
            '.feed-shared-update-v2__description-wrapper',
            '.feed-shared-text',
            '.feed-shared-update-v2__commentary',
            
            // Article and shared content
            '.feed-shared-article__description',
            '.feed-shared-text__text-view',
            '.feed-shared-article__title',
            
            // Update components (newer LinkedIn UI)
            '.update-components-text',
            '.update-components-text span[dir="ltr"]',
            '.update-components-article__title',
            '.update-components-article__description',
            
            // General text elements
            '.feed-shared-text span[dir="ltr"]',
            'span[dir="ltr"]:not(.visually-hidden)',
            '.feed-shared-update-v2 span[dir="ltr"]',
            
            // Fallback selectors
            '.feed-shared-update-v2 .break-words',
            '.occludable-update .break-words',
            '[data-test-id="main-feed-activity-card"] span[dir="ltr"]'
        ];
        
        const authorSelectors = [
            '.feed-shared-actor__name .visually-hidden',
            '.feed-shared-actor__name span[aria-hidden="true"]',
            '.feed-shared-actor__name',
            '.update-components-actor__name',
            '.feed-shared-actor__title',
            '.update-components-actor__name span[aria-hidden="true"]',
            '.feed-shared-actor__description'
        ];
        
        let postContent = null;
        let authorName = null;
        
        console.log('Trying post selectors...');
        
        // Try to find post content
        for (const selector of postSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`Selector '${selector}' found ${elements.length} elements`);
            
            for (const element of elements) {
                const text = element.innerText?.trim();
                if (text && text.length > 15 && text.length < 10000) {
                    // Skip elements that are likely names, buttons, or UI elements
                    if (!element.closest('.feed-shared-actor__name') && 
                        !element.closest('.feed-shared-actor__title') &&
                        !element.closest('button') &&
                        !text.includes('Like') && 
                        !text.includes('Comment') && 
                        !text.includes('Share') &&
                        !text.includes('Send') &&
                        !text.includes('••') &&
                        !text.match(/^\d+[smh]$/) && // Skip time indicators like "2h"
                        !text.match(/^\d+[,\d]* (likes?|comments?|shares?)$/i)) {
                        postContent = element;
                        console.log('Found post content:', text.substring(0, 100) + '...');
                        break;
                    }
                }
            }
            if (postContent) break;
        }
        
        // Try to find author name
        for (const selector of authorSelectors) {
            const element = document.querySelector(selector);
            if (element && element.innerText?.trim()) {
                authorName = element;
                console.log('Found author:', element.innerText.trim());
                break;
            }
        }
        
        // If still no content found, try a more aggressive approach
        if (!postContent) {
            console.log('No content found with specific selectors, trying fallback approach...');
            
            // Look for any meaningful text in feed updates
            const feedUpdates = document.querySelectorAll('.feed-shared-update-v2, .occludable-update, [data-test-id="main-feed-activity-card"]');
            console.log(`Found ${feedUpdates.length} feed updates`);
            
            for (const update of feedUpdates) {
                const allTextElements = update.querySelectorAll('span, p, div');
                for (const element of allTextElements) {
                    const text = element.innerText?.trim();
                    if (text && text.length > 30 && text.length < 5000) {
                        // More strict filtering for fallback
                        const excludePatterns = [
                            /^(Like|Comment|Share|Send|View|See)\s/i,
                            /\b(ago|•|likes?|comments?|shares?)\b/i,
                            /^\d+[smhd]$/,
                            /^[\d,]+ (likes?|comments?|shares?)$/i,
                            /^(Follow|Connect|Message)$/i
                        ];
                        
                        const shouldExclude = excludePatterns.some(pattern => pattern.test(text)) ||
                                            element.closest('button') ||
                                            element.closest('.feed-shared-actor__name') ||
                                            element.closest('.feed-shared-actor__title') ||
                                            element.closest('.social-actions-buttons') ||
                                            element.closest('.feed-shared-social-action-bar');
                        
                        if (!shouldExclude) {
                            postContent = element;
                            console.log('Found fallback content:', text.substring(0, 100) + '...');
                            break;
                        }
                    }
                }
                if (postContent) break;
            }
        }
        
        // Final fallback: look for any substantial text on the page
        if (!postContent) {
            console.log('Still no content found, trying final fallback...');
            const allElements = document.querySelectorAll('span[dir="ltr"], p, div');
            for (const element of allElements) {
                const text = element.innerText?.trim();
                if (text && text.length > 50 && text.length < 3000 && 
                    !text.includes('LinkedIn') &&
                    !text.includes('Home') &&
                    !text.includes('My Network') &&
                    !text.includes('Jobs') &&
                    !text.includes('Messaging')) {
                    postContent = element;
                    console.log('Found final fallback content:', text.substring(0, 100) + '...');
                    break;
                }
            }
        }
        
        if (!postContent || !postContent.innerText?.trim()) {
            console.log('No post content found on this page');
            console.log('Page URL:', window.location.href);
            console.log('Page title:', document.title);
            return null;
        }

        const result = {
            content: postContent.innerText?.trim() || '',
            author: authorName?.innerText?.trim() || 'LinkedIn User',
            url: window.location.href
        };
        
        console.log('Final extracted post data:', result);
        return result;
    }

    async callGemini(postData) {
        const result = await chrome.storage.local.get(['geminiApiKey', 'commentLength', 'tone', 'industry', 'includeQuestions']);
        
        if (!result.geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        const prompt = this.buildPrompt(postData, result);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${result.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a LinkedIn engagement specialist focused on creating high-impact, professional comments that generate meaningful discussion and demonstrate expertise.\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,  // More controlled for professional tone
                    topK: 30,
                    topP: 0.9,
                    maxOutputTokens: this.getMaxTokens(result.commentLength),
                    candidateCount: 1,
                    presencePenalty: 0.1,  // Slight penalty for repetition
                    frequencyPenalty: 0.2  // Encourage variety while maintaining quality
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text?.trim();
    }

    buildPrompt(postData, settings) {
        // Check if user prefers professional or casual style
        const commentStyle = settings.commentStyle || 'professional';
        
        if (commentStyle === 'professional') {
            return this.buildProfessionalPrompt(postData, settings);
        } else {
            return this.buildCasualPrompt(postData, settings);
        }
    }

    buildProfessionalPrompt(postData, settings) {
        const lengthGuide = {
            'super-short': '1-2 thoughtful sentences (60-80 words)',
            'brief': '2-3 professional sentences (80-150 words)',
            'concise': '3-4 strategic sentences (150-200 words)',
            'in-length': '4-6 sentences with deep insight (200-300 words)',
            'multi-paragraph': '2-3 paragraphs with comprehensive analysis (300+ words)'
        };

        const toneGuide = {
            'supportive': 'encouraging and constructive',
            'excited': 'enthusiastic and energetic',
            'happy': 'positive and optimistic',
            'gracious': 'grateful and appreciative',
            'polite': 'courteous and respectful',
            'witty': 'clever and insightful',
            'professional': 'business-focused and strategic',
            'thoughtful': 'reflective and analytical'
        };

        // Enhanced professional prompt based on successful examples
        const professionalPrompt = this.createProfessionalPrompt(postData, settings);
        
        return `You are a senior LinkedIn professional known for generating high-engagement comments. Your comments regularly receive 50+ impressions and meaningful responses.

${professionalPrompt}

Post by ${postData.author}:
"${postData.content}"

Your goal: Create a comment that demonstrates expertise, sparks discussion, and positions you as a thought leader in ${settings.industry}.`;
    }

    buildCasualPrompt(postData, settings) {
        const lengthGuide = {
            'super-short': '1-2 sentences (under 50 words)',
            'brief': '2-3 sentences (50-100 words)',
            'concise': '3-4 sentences (100-150 words)',
            'in-length': '4-6 sentences (150-250 words)',
            'multi-paragraph': '2-3 paragraphs (250+ words)'
        };

        const toneGuide = {
            'supportive': 'supportive and encouraging',
            'excited': 'enthusiastic and energetic',
            'happy': 'positive and upbeat',
            'gracious': 'grateful and appreciative',
            'polite': 'courteous and respectful',
            'witty': 'clever and mildly humorous',
            'professional': 'business-focused and formal',
            'thoughtful': 'reflective and insightful'
        };

        // Enhanced human-like prompt with radical authenticity
        const humanPrompt = this.createRadicallyHumanPrompt(postData, settings);
        
        return `You are writing a LinkedIn comment as a real ${settings.industry} professional. Your goal is to sound 100% human - imperfect, casual, genuine.

${humanPrompt}

Post by ${postData.author}:
"${postData.content}"

Write like you're commenting as yourself - not as a perfect professional, but as a real person with opinions, quirks, and natural speech patterns.`;
    }

    createProfessionalPrompt(postData, settings) {
        const lengthGuide = {
            'super-short': 'Write 1-2 simple, clear sentences',
            'brief': 'Write 2-3 straightforward sentences',
            'concise': 'Write 3-4 easy-to-read sentences',
            'in-length': 'Write a solid paragraph that is easy to follow',
            'multi-paragraph': 'Write 2-3 clear paragraphs with good insights'
        };

        const professionalTones = {
            'supportive': 'Be encouraging while adding real value',
            'excited': 'Show genuine excitement for new ideas and progress',
            'happy': 'Be positive while sharing useful insights',
            'gracious': 'Show appreciation while adding something meaningful',
            'polite': 'Stay professional but friendly with helpful analysis',
            'witty': 'Use smart humor and clever observations',
            'professional': 'Show industry knowledge and smart thinking',
            'thoughtful': 'Provide deep insights and careful analysis'
        };

        const contentType = this.detectContentType(postData.content);
        const includeQuestions = settings.includeQuestions === true; // Must be explicitly true
        
        let questionGuidance = '';
        if (includeQuestions) {
            questionGuidance = '• End with good questions 70% of the time\n';
        } else {
            questionGuidance = '• DO NOT include questions - use statements and observations only\n• End with insights, conclusions, or supportive statements\n';
        }
        
        return lengthGuide[settings.commentLength] + '\n\n' +
               'Professional Approach: ' + professionalTones[settings.tone] + '\n\n' +
               'Content Strategy: ' + contentType.strategy + '\n\n' +
               'WRITE WITH SIMPLE BUT SMART LANGUAGE:\n' +
               '• Use everyday words that everyone understands\n' +
               '• Show business knowledge without fancy terms\n' +
               (includeQuestions ? '• Ask questions that make people want to respond\n' : '• Make strong statements that show expertise\n') +
               '• Reference specific things from the post\n' +
               '• Share expertise in a friendly way\n' +
               questionGuidance +
               '• Sound like an expert who is easy to talk to\n\n' +
               'EXAMPLES OF SIMPLE BUT HIGH-ENGAGING COMMENTS:\n' +
               (includeQuestions ? 
                   '"This shows an important part of [topic] that people often miss. I am curious about [specific question]?"\n' +
                   '"Great results that prove how well [specific insight] works. I would love to know more about [practical detail]?"\n' +
                   '"This is a perfect example of [broader idea]. I wonder [thought-provoking question]?"' :
                   '"This shows an important part of [topic] that people often miss. The key insight here is [specific observation]."\n' +
                   '"Great results that prove how well [specific insight] works. This demonstrates the power of [principle]."\n' +
                   '"This is a perfect example of [broader idea]. The real value comes from [key insight]."'
               ) + '\n\n' +
               'AVOID THESE LOW-ENGAGEMENT PATTERNS:\n' +
               '• Generic praise ("Great post!", "So true!", "Amazing!")\n' +
               '• Fancy words when simple ones work better\n' +
               '• Promoting yourself\n' +
               '• Surface-level observations\n' +
               (includeQuestions ? '• Questions that do not add value\n' : '• Weak or generic statements\n') +
               '• Sounding like a robot\n\n' +
               'FOCUS ON ' + (includeQuestions ? 'GETTING DISCUSSION GOING' : 'PROVIDING VALUABLE INSIGHTS') + ' AND SHOWING YOU KNOW YOUR STUFF.';
    }

    detectContentType(content) {
        const lower = content.toLowerCase();
        
        if (lower.includes('tip') || lower.includes('advice') || lower.includes('should') || lower.includes('how to')) {
            return {
                type: 'advice/tips post',
                strategy: 'Add your own related tip or share how you apply it. Be practical, not theoretical.'
            };
        }
        
        if (lower.includes('story') || lower.includes('experience') || lower.includes('happened') || lower.includes('learned')) {
            return {
                type: 'personal story',
                strategy: 'Share a brief related moment or lesson. Connect authentically, not just "me too".'
            };
        }
        
        if (lower.includes('think') || lower.includes('believe') || lower.includes('opinion') || lower.includes('unpopular')) {
            return {
                type: 'opinion piece',
                strategy: 'Add your perspective honestly. Agree, disagree, or nuance - but be real about it.'
            };
        }
        
        if (lower.includes('question') || content.includes('?')) {
            return {
                type: 'question post',
                strategy: 'Give a genuine answer based on your experience. No need to ask another question.'
            };
        }
        
        return {
            type: 'general post',
            strategy: 'React naturally. Share what this makes you think about or remember.'
        };
    }

    getEngagementStrategy(postContent, tone) {
        const contentLower = postContent.toLowerCase();
        
        // Detect post type and provide contextual guidance
        let contextualOpener, engagementRule;
        
        if (contentLower.includes('challenge') || contentLower.includes('difficult') || contentLower.includes('struggle')) {
            contextualOpener = "This post discusses challenges. Share relatable experience or supportive insights.";
            engagementRule = "Share a brief personal experience or offer practical advice. End with an empathetic question.";
        } else if (contentLower.includes('success') || contentLower.includes('achievement') || contentLower.includes('proud')) {
            contextualOpener = "This is a success/achievement post. Celebrate genuinely and relate it to broader insights.";
            engagementRule = "Celebrate authentically, then connect to a broader lesson or ask about their process.";
        } else if (contentLower.includes('opinion') || contentLower.includes('think') || contentLower.includes('believe')) {
            contextualOpener = "This post shares an opinion or perspective. Engage thoughtfully with your own viewpoint.";
            engagementRule = "Add your perspective respectfully, share a related experience, then ask for others' thoughts.";
        } else if (contentLower.includes('tip') || contentLower.includes('advice') || contentLower.includes('learn')) {
            contextualOpener = "This is educational/advice content. Build upon it with additional insights.";
            engagementRule = "Add complementary advice or share how you've applied similar concepts. Ask about implementation.";
        } else {
            contextualOpener = "General professional post. Respond naturally with relevant personal insights.";
            engagementRule = tone === 'witty' ? 
                "Add a touch of appropriate humor, then ask a thoughtful question." :
                "Share a genuine reaction and personal insight, ending with a conversation-starter question.";
        }
        
        return { contextualOpener, engagementRule };
    }

    getQuestionPrompts(industry, tone) {
        const questionStyles = {
            'witty': [
                "\u2713 End with a playful but relevant question",
                "\u2713 Use light humor to ask for others' experiences",
                "\u2713 Ask something slightly unexpected but on-topic"
            ],
            'thoughtful': [
                "\u2713 Ask a deep, reflective question about implications",
                "\u2713 Inquire about others' perspectives on the deeper meaning",
                "\u2713 Ask how this connects to broader industry trends"
            ],
            'excited': [
                "\u2713 Ask an enthusiastic question about next steps",
                "\u2713 Ask others to share their own exciting experiences",
                "\u2713 Ask about future possibilities with genuine enthusiasm"
            ],
            'supportive': [
                "\u2713 Ask a caring question about their experience",
                "\u2713 Ask how you or others can help",
                "\u2713 Ask about lessons learned that could help others"
            ]
        };
        
        const industryQuestions = {
            'technology': 'Consider asking about technical implementation, future developments, or real-world applications',
            'marketing': 'Ask about campaign results, audience insights, or creative process',
            'healthcare': 'Inquire about patient impact, best practices, or professional development',
            'finance': 'Ask about market implications, practical applications, or risk considerations',
            'education': 'Ask about learning outcomes, student engagement, or teaching strategies',
            'sales': 'Inquire about client reactions, sales process, or relationship building'
        };
        
        const toneQuestions = questionStyles[tone] || questionStyles['thoughtful'];
        const industryContext = industryQuestions[industry] || 'Ask relevant questions about professional experience or industry insights';
        
        return "\nQUESTION GUIDELINES (Choose ONE approach):\n" + toneQuestions.join('\n') + "\n\nINDUSTRY CONTEXT: " + industryContext;
    }

    getMaxTokens(length) {
        const tokenMap = {
            'super-short': 80,
            'brief': 150,
            'concise': 220,
            'in-length': 320,
            'multi-paragraph': 500
        };
        return tokenMap[length] || 150;
    }

    async postComment() {
        try {
            const comment = document.getElementById('generated-comment').textContent;
            if (!comment) return;

            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.postToLinkedIn,
                args: [comment]
            });

            this.updateStatus('Comment posted successfully!', 'success');
            document.getElementById('generated-comment').classList.remove('show');
            document.getElementById('post-comment').style.display = 'none';
            
        } catch (error) {
            console.error('Error posting comment:', error);
            this.updateStatus('Error posting comment', 'error');
        }
    }

    postToLinkedIn(comment) {
        // Find comment box and post the comment
        const commentButton = document.querySelector('.comment-button');
        if (commentButton) {
            commentButton.click();
            
            setTimeout(() => {
                const commentBox = document.querySelector('.comments-comment-box__comment-text-editor p');
                if (commentBox) {
                    commentBox.textContent = comment;
                    
                    // Trigger input event to enable post button
                    const event = new Event('input', { bubbles: true });
                    commentBox.dispatchEvent(event);
                    
                    setTimeout(() => {
                        const submitButton = document.querySelector('.comments-comment-box__submit-button:not([disabled])');
                        if (submitButton) {
                            submitButton.click();
                        }
                    }, 1000);
                }
            }, 1000);
        }
    }

    async toggleAutoComment(enabled) {
        if (enabled) {
            const result = await chrome.storage.local.get(['geminiApiKey']);
            if (!result.geminiApiKey) {
                this.updateStatus('Please configure API key first', 'error');
                document.getElementById('auto-comment').checked = false;
                return;
            }
            
            // Start automation
            chrome.storage.local.set({ autoCommentEnabled: true });
            this.updateStatus('Auto-comment enabled', 'success');
        } else {
            // Stop automation
            chrome.storage.local.set({ autoCommentEnabled: false });
            this.updateStatus('Auto-comment disabled', 'info');
        }
    }

    async toggleUseProfileData(enabled) {
        chrome.storage.local.set({ useProfileData: enabled });
        if (enabled) {
            this.updateStatus('Profile-aware comments enabled', 'success');
        } else {
            this.updateStatus('Profile-aware comments disabled', 'info');
        }
    }

    async loadProfileData() {
        const result = await chrome.storage.local.get(['userProfile']);
        const profileElement = document.getElementById('profile-info');
        
        if (result.userProfile && (result.userProfile.name || result.userProfile.headline)) {
            const profile = result.userProfile;
            let profileHtml = '<div class="profile-data">';
            
            if (profile.name) {
                profileHtml += `<div><strong>Name:</strong> ${profile.name}</div>`;
            }
            if (profile.headline) {
                profileHtml += `<div><strong>Headline:</strong> ${profile.headline}</div>`;
            }
            if (profile.location) {
                profileHtml += `<div><strong>Location:</strong> ${profile.location}</div>`;
            }
            if (profile.experience && profile.experience.length > 0) {
                profileHtml += `<div><strong>Experience:</strong> ${profile.experience[0].title} at ${profile.experience[0].company}</div>`;
            }
            
            profileHtml += '</div>';
            profileElement.innerHTML = profileHtml;
            
            // Show clear button
            document.getElementById('clear-profile').style.display = 'inline-block';
        } else {
            // Only show this message in the profile section, don't make it an error
            profileElement.innerHTML = '<div class="no-profile">No profile data stored. Navigate to your LinkedIn profile and click "Extract Profile" to personalize comments.</div>';
            document.getElementById('clear-profile').style.display = 'none';
            
            // Don't show this as a status error - it's just informational
            // The extension can still work without profile data
        }
    }

    async extractProfile() {
        try {
            this.updateStatus('Extracting profile data...', 'info');
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('linkedin.com')) {
                this.updateStatus('Please navigate to LinkedIn first', 'error');
                return;
            }
            
            // Check if we're on a profile page
            if (!tab.url.includes('/in/')) {
                this.updateStatus('Navigate to your LinkedIn profile page first, then click Extract Profile', 'warning');
                return;
            }

            // Execute content script to extract profile data
            const profileData = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.extractLinkedInProfile
            });

            const profile = profileData[0].result;
            
            if (profile && (profile.name || profile.headline)) {
                // Store the profile data
                await chrome.storage.local.set({ userProfile: profile });
                
                this.updateStatus('Profile data extracted and saved!', 'success');
                await this.loadProfileData(); // Refresh the display
            } else {
                this.updateStatus('No profile data found. Make sure you\'re on your LinkedIn profile page (URL should contain /in/).', 'warning');
            }
            
        } catch (error) {
            console.error('Error extracting profile:', error);
            this.updateStatus('Error extracting profile: ' + error.message, 'error');
        }
    }

    extractLinkedInProfile() {
        console.log('Extracting LinkedIn profile data from current page...');
        
        const profileData = {
            name: null,
            headline: null,
            industry: null,
            location: null,
            experience: [],
            skills: [],
            education: [],
            about: null,
            profileUrl: window.location.href
        };
        
        // Extract name
        const nameSelectors = [
            '.text-heading-xlarge',
            '.pv-text-details__left-panel h1',
            'h1.break-words',
            '.profile-top-card__title'
        ];
        
        for (const selector of nameSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim()) {
                profileData.name = element.textContent.trim();
                break;
            }
        }
        
        // Extract headline
        const headlineSelectors = [
            '.text-body-medium.break-words',
            '.pv-text-details__left-panel .text-body-medium',
            '.profile-top-card__headline'
        ];
        
        for (const selector of headlineSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim() && 
                !element.textContent.includes('connections') &&
                !element.textContent.includes('followers')) {
                profileData.headline = element.textContent.trim();
                break;
            }
        }
        
        // Extract location
        const locationSelectors = [
            '.text-body-small.inline.t-black--light.break-words',
            '.pv-text-details__left-panel .text-body-small'
        ];
        
        for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent?.trim() && 
                !element.textContent.includes('connections') &&
                !element.textContent.includes('followers')) {
                profileData.location = element.textContent.trim();
                break;
            }
        }
        
        // Extract top experience
        const experienceItems = document.querySelectorAll('.pv-entity__summary-info, .experience-item');
        experienceItems.forEach((item, index) => {
            if (index < 3) { // Only top 3
                const title = item.querySelector('h3, .pv-entity__summary-title')?.textContent?.trim();
                const company = item.querySelector('.pv-entity__secondary-title')?.textContent?.trim();
                
                if (title && company) {
                    profileData.experience.push({
                        title,
                        company: company.replace(/^at\s+/i, '')
                    });
                }
            }
        });
        
        // Extract skills
        const skillElements = document.querySelectorAll('.pv-skill-category-entity__name span[aria-hidden="true"]');
        skillElements.forEach((element, index) => {
            if (index < 10) { // Top 10 skills
                const skill = element.textContent?.trim();
                if (skill) {
                    profileData.skills.push(skill);
                }
            }
        });
        
        console.log('Extracted profile data:', profileData);
        return profileData;
    }

    async clearProfile() {
        try {
            await chrome.storage.local.remove(['userProfile']);
            this.updateStatus('Profile data cleared', 'info');
            await this.loadProfileData(); // Refresh the display
        } catch (error) {
            console.error('Error clearing profile:', error);
            this.updateStatus('Error clearing profile data', 'error');
        }
    }

    async toggleIncludeQuestions(enabled) {
        console.log('📋 Toggling includeQuestions to:', enabled);
        await chrome.storage.local.set({ includeQuestions: enabled });
        
        // Verify the setting was saved correctly
        const verification = await chrome.storage.local.get(['includeQuestions']);
        console.log('📋 Verification - stored value:', verification.includeQuestions);
        
        if (enabled) {
            this.updateStatus('Comments will include engaging questions', 'success');
        } else {
            this.updateStatus('Comments will focus on statements and observations only', 'info');
        }
    }

    async toggleAutoGenerateOnClick(enabled) {
        if (enabled) {
            const result = await chrome.storage.local.get(['geminiApiKey']);
            if (!result.geminiApiKey) {
                this.updateStatus('Please configure API key first', 'error');
                document.getElementById('auto-generate-on-click').checked = false;
                return;
            }
            
            // Enable auto-generation on click
            chrome.storage.local.set({ autoGenerateOnClick: true });
            this.updateStatus('Auto-generate on comment click enabled', 'success');
        } else {
            // Disable auto-generation on click
            chrome.storage.local.set({ autoGenerateOnClick: false });
            this.updateStatus('Auto-generate on comment click disabled', 'info');
        }
    }

    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status ${type}`;
    }
}

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new CustomCommenTron();
});