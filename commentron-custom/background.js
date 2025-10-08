console.log('🔥 BACKGROUND: Script starting...');

// Simple and reliable background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🔥 BACKGROUND: Message received:', message.action);
    
    if (message.action === 'ping') {
        console.log('🔥 BACKGROUND: Ping received');
        sendResponse({ 
            pong: true, 
            timestamp: Date.now(), 
            status: 'Background script working!' 
        });
        return false;
    }
    
    if (message.action === 'generateComment') {
        console.log('🔥 BACKGROUND: Generate comment request');
        console.log('🔥 BACKGROUND: Post data:', message.postData);
        console.log('🔥 BACKGROUND: Settings:', message.settings);
        console.log('🔥 BACKGROUND: User profile:', message.userProfile);
        
        // Handle async
        generateComment(message.postData, message.settings, message.userProfile)
            .then(comment => {
                console.log('🔥 BACKGROUND: Success, sending response');
                sendResponse({ comment });
            })
            .catch(error => {
                console.error('🔥 BACKGROUND: Error:', error);
                sendResponse({ error: error.message });
            });
        
        return true; // Keep channel open
    }
    
    return false;
});

async function generateComment(postData, settings, userProfile) {
    console.log('🔥 BACKGROUND: generateComment called with profile data');
    console.log('🔥 BACKGROUND: Profile available:', !!userProfile);
    
    if (!settings.geminiApiKey) {
        throw new Error('No API key configured');
    }
    
    // Use defaults if settings missing with explicit logging
    const config = {
        commentLength: settings.commentLength || 'brief',
        tone: settings.tone || 'professional',
        industry: settings.industry || 'general',
        commentStyle: settings.commentStyle || 'professional',
        includeQuestions: settings.includeQuestions === true // CRITICAL: Must be explicitly true
    };
    
    console.log('📋 BACKGROUND: Final config for generation:', config);
    console.log('📋 BACKGROUND: Question setting - raw:', settings.includeQuestions, 'processed:', config.includeQuestions);
    
    // Enhanced human-like prompt for more natural comments
    const prompt = config.commentStyle === 'professional' 
        ? createProfessionalPrompt(postData, config, userProfile)
        : createHumanLikePrompt(postData, config, userProfile);
    
    console.log('🔥 BACKGROUND: Enhanced prompt created:', prompt.substring(0, 150) + '...');
    
    // Try different models
    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
    
    for (const model of models) {
        try {
            console.log(`🔥 BACKGROUND: Trying ${model}`);
            const result = await callAPI(model, prompt, settings.geminiApiKey, config);
            console.log(`🔥 BACKGROUND: Success with ${model}`);
            return result;
        } catch (error) {
            console.warn(`🔥 BACKGROUND: ${model} failed:`, error.message);
            if (model === models[models.length - 1]) {
                throw error;
            }
        }
    }
}

function createProfessionalPrompt(postData, config, userProfile = null) {
    const lengthTokens = {
        'super-short': 60,
        'brief': 120,
        'concise': 180,
        'in-length': 280,
        'multi-paragraph': 400
    };
    
    // Detect content patterns for more specific responses
    const contentLower = postData.content.toLowerCase();
    const isAdvicePost = contentLower.includes('tip') || contentLower.includes('advice') || contentLower.includes('should');
    const isPersonalStory = contentLower.includes('story') || contentLower.includes('experience') || contentLower.includes('learned');
    const isOpinionPost = contentLower.includes('think') || contentLower.includes('believe') || contentLower.includes('opinion');
    const isSuccessPost = contentLower.includes('success') || contentLower.includes('achievement') || contentLower.includes('milestone');
    const isQuestionPost = postData.content.includes('?');
    
    // Build question guidance based on setting
    let questionGuidance = '';
    let promptInstructions = '';
    if (config.includeQuestions) {
        questionGuidance = '• End with engaging questions 70% of the time\n';
        promptInstructions = 'Generate a comment that shows expertise and gets discussion going';
    } else {
        questionGuidance = '• CRITICAL: ABSOLUTELY NO QUESTIONS ALLOWED - ZERO TOLERANCE\n• FORBIDDEN: No question marks (?) anywhere in the comment\n• BANNED: No interrogative words (what, how, why, when, where, who, which, can, could, would, will, should, do, does, did, is, are, was, were)\n• MANDATORY: End with strong statements, insights, or observations ONLY\n• REQUIRED: Use declarative sentences and definitive conclusions\n• STRICT: Any question will be considered a complete failure\n';
        promptInstructions = 'Generate a comment with ZERO QUESTIONS - only statements, insights, and declarations. No question marks or interrogative language allowed whatsoever.';
    }
    
    // Build profile context if available
    let profileContext = '';
    let professionalPerspective = '';
    
    if (userProfile && (userProfile.name || userProfile.headline || userProfile.experience?.length > 0)) {
        console.log('🔥 BACKGROUND: Building profile-aware context');
        
        const experienceContext = userProfile.experience && userProfile.experience.length > 0 
            ? userProfile.experience.slice(0, 2).map(exp => `${exp.title} at ${exp.company}`).join(', ')
            : '';
            
        const skillsContext = userProfile.skills && userProfile.skills.length > 0 
            ? userProfile.skills.slice(0, 5).join(', ')
            : '';
            
        if (experienceContext) {
            professionalPerspective = `

YOUR PROFESSIONAL BACKGROUND:
• Experience: ${experienceContext}
• Skills: ${skillsContext || 'General business'}
• Industry: ${config.industry || 'Professional services'}`;
        }
    }
    
    return `You are an expert LinkedIn engagement specialist. Your comments consistently receive 100+ likes and meaningful responses. You understand human psychology and what makes people want to engage.

Post Content: "${postData.content}"${professionalPerspective}

YOUR MISSION: Write a comment that feels like it came from a thoughtful industry expert who naturally drives engagement.

CRITICAL WRITING RULES:
• Every sentence MUST be complete with subject + verb + object
• Use transitional phrases to connect ideas smoothly ("This shift", "What's interesting", "The real impact")
• Build momentum from observation → insight → broader implication
• End with a compelling statement that invites mental engagement
${questionGuidance}
• Write like you're having an intelligent conversation, not giving a presentation

SENTENCE STRUCTURE EXAMPLES:
❌ BAD: "AI tools change. Photography different now. Levels playing field."
✅ GOOD: "This shift in AI tools demonstrates how technology democratizes expertise. What used to require hiring a professional photographer can now be achieved by anyone with the right tools."

COMMENT FLOW TEMPLATE:
1. **Hook with insight**: Start with "This [insight/trend/shift] shows..."
2. **Personal angle**: "I've noticed..." or "What strikes me..."
3. **Broader implication**: "The real impact is..." or "This means..."
4. ${config.includeQuestions ? '**Engaging question**: Ask something that makes people think' : '**Strong conclusion**: End with a definitive statement about the future/impact'}

HIGH-ENGAGEMENT EXAMPLES:
${config.includeQuestions ? 
`"This perfectly captures how AI is reshaping traditional barriers to entry. I've watched photography transform from requiring expensive equipment and years of training to being accessible to anyone with a smartphone and the right AI tools. The democratization we're seeing across industries is incredible – what other professional skills do you think will become accessible to everyone in the next few years?"

"The shift you're describing highlights something fascinating about modern business. Traditional gatekeepers – whether photographers, designers, or even writers – are being replaced by accessible AI tools. This levels the playing field dramatically, especially for entrepreneurs and small businesses who couldn't afford professional services before. Which industries do you think will be most transformed by this democratization?"` :
`"This perfectly captures how AI is reshaping traditional barriers to entry. What used to require expensive equipment and years of training is now accessible to anyone with a smartphone and the right AI tools. The democratization we're seeing across industries represents one of the most significant shifts in how business gets done."

"The shift you're describing highlights something fascinating about modern business. Traditional gatekeepers are being replaced by accessible AI tools, which levels the playing field dramatically for entrepreneurs and small businesses who couldn't afford professional services before. This democratization of expertise is reshaping entire industries."` }

AVOID THESE ENGAGEMENT KILLERS:
• Sentence fragments ("Now, anyone.")
• Choppy, disconnected thoughts
• Generic observations without personal insight
• Ending abruptly without impact
• Corporate buzzword salad

TONE: ${config.tone} but conversational and insightful

LENGTH TARGET: ${lengthTokens[config.commentLength]} characters

Generate a comment that ${promptInstructions} while demonstrating genuine expertise and sparking meaningful discussion.`;
}

function createHumanLikePrompt(postData, config, userProfile = null) {
    const lengthTokens = {
        'super-short': 40,   // ~40 characters - 1 sentence max
        'brief': 80,         // ~80 characters - 1-2 sentences
        'concise': 150,      // ~150 characters - 2-3 sentences
        'in-length': 250,    // ~250 characters - 3-4 sentences
        'multi-paragraph': 400  // ~400 characters - multiple sentences
    };
    
    const lengthGuidelines = {
        'super-short': 'Write ONLY 1 short sentence (maximum 40 characters). Be extremely brief.',
        'brief': 'Write 1-2 short sentences (maximum 80 characters total). Keep it very brief.',
        'concise': 'Write 2-3 sentences (maximum 150 characters total). Stay natural and concise.',
        'in-length': 'Write 3-4 sentences (maximum 250 characters total). Be conversational.',
        'multi-paragraph': 'Write multiple sentences (maximum 400 characters total). Stay natural.'
    };
    
    // Detect content patterns for more specific responses
    const contentLower = postData.content.toLowerCase();
    const isAdvicePost = contentLower.includes('tip') || contentLower.includes('advice') || contentLower.includes('should');
    const isPersonalStory = contentLower.includes('story') || contentLower.includes('experience') || contentLower.includes('learned');
    const isOpinionPost = contentLower.includes('think') || contentLower.includes('believe') || contentLower.includes('opinion');
    const isSuccessPost = contentLower.includes('success') || contentLower.includes('achievement') || contentLower.includes('milestone');
    const isQuestionPost = postData.content.includes('?');
    
    // Build question guidance based on setting
    let questionGuidance = '';
    let casualPromptInstructions = '';
    if (config.includeQuestions) {
        questionGuidance = '• End with engaging questions 70% of the time\n';
        casualPromptInstructions = 'curiosity, and strategic thinking while fostering meaningful professional discussion';
    } else {
        questionGuidance = '• CRITICAL: ABSOLUTELY NO QUESTIONS ALLOWED - ZERO TOLERANCE\n• FORBIDDEN: No question marks (?) anywhere in the comment\n• BANNED: No interrogative words (what, how, why, when, where, who, which, can, could, would, will, should, do, does, did, is, are, was, were)\n• MANDATORY: End with strong statements and natural observations\n• REQUIRED: Only use declarative sentences and insights\n• STRICT: Any question will be considered a complete failure\n';
        casualPromptInstructions = 'insight, and strategic thinking while providing valuable professional perspective - ZERO QUESTIONS ALLOWED';
    }
    
    // Build profile context if available
    let profileContext = '';
    let professionalPerspective = '';
    
    if (userProfile && (userProfile.name || userProfile.headline || userProfile.experience?.length > 0)) {
        console.log('🔥 BACKGROUND: Building profile-aware context');
        
        const experienceContext = userProfile.experience && userProfile.experience.length > 0 
            ? userProfile.experience.slice(0, 2).map(exp => `${exp.title} at ${exp.company}`).join(', ')
            : '';
            
        const skillsContext = userProfile.skills && userProfile.skills.length > 0 
            ? userProfile.skills.slice(0, 5).join(', ')
            : '';
            
        if (experienceContext) {
            professionalPerspective = `

YOUR PROFESSIONAL BACKGROUND:
• Experience: ${experienceContext}
• Skills: ${skillsContext || 'General business'}
• Industry: ${config.industry || 'Professional services'}`;
        }
    }
    
    return `You're commenting on LinkedIn like a real person, not a business bot. Write naturally, like you're talking to someone at a coffee shop.

Post Content: "${postData.content}"${professionalPerspective}

CRITICAL: ${lengthGuidelines[config.commentLength]}

WRITE LIKE A REAL HUMAN:
• Use simple, everyday words
• Sound like you're texting a friend about work
• Be genuine and relatable
• No fancy business speak or jargon
• ${config.commentLength === 'super-short' ? 'Just one quick sentence!' : 'Keep it conversational and brief'}
${questionGuidance}

REAL CASUAL EXAMPLES:
${config.commentLength === 'super-short' ? 
'• "This is so cool!"\n• "Love this setup."\n• "Game changer for sure."' : 
config.commentLength === 'brief' ? 
'• "This is incredible. The setup looks amazing."\n• "Love this approach. Really smart thinking."' : 
'• "This setup is absolutely incredible. The way you\'ve combined tech with aesthetics is exactly what modern content creation should look like."'}

AVOID SOUNDING LIKE:
• A consultant or business expert
• Someone giving a presentation
• Using words like "articulated," "perceived value," "foundational"
• Being too formal or stuffy

TONE: ${config.tone} and friendly

STRICT LIMIT: Maximum ${lengthTokens[config.commentLength]} characters.

Write ${config.commentLength === 'super-short' ? 'one short sentence' : 'a brief, natural comment'} that ${casualPromptInstructions}.`;
}

async function callAPI(model, prompt, apiKey, config) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    console.log(`🔥 BACKGROUND: Calling API: ${model}`);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: config.includeQuestions ? 0.7 : 0.5,  // Lower for more coherent statements
                topK: config.includeQuestions ? 30 : 15,           // More focused vocabulary
                topP: config.includeQuestions ? 0.9 : 0.8,         // Higher quality threshold
                maxOutputTokens: 250,                              // Optimal length for complete thoughts
                candidateCount: 1,
                stopSequences: [],
                presencePenalty: 0.4,   // Strong penalty against repetition
                frequencyPenalty: 0.5   // Encourage varied, complete expressions
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH', 
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
            ]
        })
    });
    
    console.log(`🔥 BACKGROUND: API response status: ${response.status}`);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log('🔥 BACKGROUND: API response received');
    
    let comment = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!comment) {
        throw new Error('Empty response from API');
    }
    
    // COMPREHENSIVE comment post-processing for quality and readability
    console.log('📝 BACKGROUND: Original comment before processing:', comment);
    
    // Step 1: Fix capitalization issues
    comment = fixCapitalization(comment);
    
    // Step 2: AGGRESSIVE question removal if checkbox is unchecked
    if (!config.includeQuestions) {
        console.log('🚫 Questions disabled - applying aggressive filtering');
        comment = removeQuestions(comment);
    }
    
    // Step 3: Improve sentence flow and completeness
    comment = improveSentenceFlow(comment);
    
    // Step 4: Final cleanup and validation
    comment = finalCleanup(comment);
    
    console.log('✅ BACKGROUND: Final processed comment:', comment);
    return comment;
}

function fixCapitalization(text) {
    // Fix common capitalization issues
    let fixed = text;
    
    // Fix sentences that start mid-word due to AI errors
    fixed = fixed.replace(/([a-z])\s+([A-Z][a-z])/g, '$1. $2');
    
    // Fix random capital letters in middle of sentences
    fixed = fixed.replace(/([a-z])\s+([A-Z])([a-z])/g, (match, before, capital, after) => {
        // Don't fix proper nouns or acronyms
        const word = capital + after;
        const properNouns = ['LinkedIn', 'AI', 'API', 'CEO', 'CTO', 'HR', 'IT', 'SEO', 'ROI', 'KPI'];
        if (properNouns.includes(word.split(' ')[0])) {
            return match;
        }
        return `${before} ${capital.toLowerCase()}${after}`;
    });
    
    // Ensure sentences start with capital letters
    fixed = fixed.replace(/(^|[.!?]\s+)([a-z])/g, (match, punctuation, letter) => {
        return punctuation + letter.toUpperCase();
    });
    
    return fixed;
}

function removeQuestions(text) {
    let filtered = text;
    
    // Remove all question marks and replace with periods
    filtered = filtered.replace(/\?/g, '.');
    
    // Remove sentences that start with interrogative words
    filtered = filtered.replace(/\b(What|How|Why|When|Where|Who|Which|Can|Could|Would|Will|Should|Do|Does|Did|Is|Are|Was|Were)[^.!?]*[.!?]?/gi, '');
    
    // Remove question-like phrases
    filtered = filtered.replace(/\b(isn't it|don't you think|wouldn't you agree|right|correct me if|am I right|have you|did you|will you|can you)\b[^.!?]*[.!?]?/gi, '');
    
    // Remove sentences ending with question-like patterns
    filtered = filtered.replace(/[^.!]*\b(though|right|eh|no|yes)\s*\.+/gi, '');
    
    return filtered;
}

function improveSentenceFlow(text) {
    let improved = text;
    
    console.log('🔧 FLOW: Starting sentence flow improvement');
    console.log('🔧 FLOW: Input:', improved);
    
    // Fix common fragment patterns
    // Pattern: "Word. Another word." -> "Word with another word."
    improved = improved.replace(/([a-z]+)\. ([A-Z][a-z]+)\.(?=\s+[A-Z])/g, '$1 with $2.');
    
    // Pattern: "Now, anyone." -> "Now anyone can do this."
    improved = improved.replace(/Now,\s+anyone\./g, 'Now anyone can do this.');
    
    // Pattern: "Change. Something different." -> "Change means something different."
    improved = improved.replace(/([A-Z][a-z]+)\. ([A-Z][a-z\s]+)\.(?=\s+[A-Z])/g, '$1 means $2.');
    
    // Fix incomplete sentences ending with periods
    improved = improved.replace(/\b([A-Z][a-z]{1,4})\./g, (match, word) => {
        const completeWord = {
            'AI': 'AI technology',
            'Now': 'Now everyone',
            'This': 'This approach',
            'But': 'But the reality',
            'So': 'So the impact',
            'Yet': 'Yet the benefits'
        };
        return completeWord[word] ? completeWord[word] + '.' : match;
    });
    
    // Connect fragments that should be together
    improved = improved.replace(/([a-z])\s+([A-Z][a-z\s]*\w)\s*\.(?=\s*[A-Z])/g, '$1, and $2.');
    
    // Fix choppy transitions
    improved = improved.replace(/\.\s+([A-Z][a-z\s]*\w)\s*\.(?=\s+This|That|It|The)/g, '. $1, which');
    
    // Ensure sentences have proper subjects and verbs
    improved = improved.replace(/^([A-Z][a-z]+)\s+([a-z]+)\./, '$1 really $2.');
    
    console.log('🔧 FLOW: Output:', improved);
    return improved;
}

function finalCleanup(text) {
    let cleaned = text;
    
    console.log('🧹 CLEANUP: Starting final cleanup');
    console.log('🧹 CLEANUP: Input:', cleaned);
    
    // Clean up multiple spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Fix multiple periods
    cleaned = cleaned.replace(/\.+/g, '.');
    
    // Remove leading/trailing spaces and periods
    cleaned = cleaned.replace(/^[\s.]+|[\s.]+$/g, '').trim();
    
    // Ensure proper ending punctuation
    if (cleaned && !cleaned.match(/[.!]$/)) {
        cleaned += '.';
    }
    
    // Validate sentence completeness and fix if needed
    const sentences = cleaned.split(/[.!]\s+/).filter(s => s.trim());
    const improvedSentences = sentences.map(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length < 10) {
            // Too short, likely fragment
            return null;
        }
        
        // Check if sentence has subject and verb
        const words = trimmed.split(/\s+/);
        if (words.length < 3) {
            // Too few words, expand
            if (trimmed.toLowerCase().startsWith('this')) {
                return `${trimmed} demonstrates the power of technological advancement`;
            } else if (trimmed.toLowerCase().includes('change')) {
                return `${trimmed} represents a significant shift in the industry`;
            } else {
                return `${trimmed} shows the evolving landscape of professional services`;
            }
        }
        
        return trimmed;
    }).filter(Boolean);
    
    if (improvedSentences.length === 0) {
        cleaned = 'This development highlights how technology continues to democratize professional services and level the playing field for everyone.';
    } else {
        cleaned = improvedSentences.join('. ') + '.';
    }
    
    // Ensure comment starts with capital letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    // Ensure minimum quality threshold
    if (cleaned.length < 40) {
        cleaned += ' This shift represents a fundamental change in how professionals approach their craft.';
    }
    
    console.log('🧹 CLEANUP: Output:', cleaned);
    return cleaned;
}

console.log('🔥 BACKGROUND: Script loaded successfully');