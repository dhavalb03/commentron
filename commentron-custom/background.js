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
    
    // Handle unknown messages
    console.log('🔥 BACKGROUND: Unknown message action:', message.action);
    sendResponse({ error: 'Unknown action: ' + message.action });
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
            let result = await callAPI(model, prompt, settings.geminiApiKey, config);
            console.log(`🔥 BACKGROUND: Success with ${model}`);
            // Enforce diversity and context alignment
            result = await ensureDiverseAndContextual(result, prompt, postData, settings.geminiApiKey, model, config);
            return result;
        } catch (error) {
            console.warn(`🔥 BACKGROUND: ${model} failed:`, error.message);
            if (model === models[models.length - 1]) {
                throw error;
            }
        }
    }
}

function getLengthToTokens(lengthKey) {
    // Map UI length to sensible max token limits
    const tokenMap = {
        'super-short': 80,
        'brief': 140,
        'concise': 220,
        'in-length': 320,
        'multi-paragraph': 460
    };
    return tokenMap[lengthKey] || 140;
}

function getToneTemperature(toneKey) {
    // Make tone have a real stylistic effect via temperature
    const toneToTemp = {
        supportive: 0.6,
        excited: 0.9,
        happy: 0.75,
        gracious: 0.55,
        polite: 0.55,
        witty: 0.85,
        professional: 0.5,
        thoughtful: 0.6
    };
    return toneToTemp[toneKey] ?? 0.7;
}

function getLengthPhrase(lengthKey) {
    const lengthPhrases = {
        'super-short': 'Write 1-2 quick sentences (under 40 words).',
        'brief': 'Write 2-3 sentences (about 50–90 words).',
        'concise': 'Write 3-4 sentences (about 90–140 words).',
        'in-length': 'Write a solid paragraph of 4–6 sentences (about 140–220 words).',
        'multi-paragraph': 'Write 2 short paragraphs (up to ~300 words).'
    };
    return lengthPhrases[lengthKey] || lengthPhrases['brief'];
}

function createProfessionalPrompt(postData, config, userProfile = null) {
    // Build question guidance based on setting
    let questionInstruction = '';
    if (config.includeQuestions) {
        questionInstruction = 'End with a thoughtful question that invites discussion.';
    } else {
        questionInstruction = 'Do NOT include any questions. End with a statement or observation.';
    }
    
    // Build profile context if available
    let profileContext = '';
    if (userProfile && (userProfile.name || userProfile.headline || userProfile.experience?.length > 0)) {
        console.log('🔥 BACKGROUND: Building profile-aware context');
        
        const experienceContext = userProfile.experience && userProfile.experience.length > 0 
            ? userProfile.experience.slice(0, 2).map(exp => `${exp.title} at ${exp.company}`).join(', ')
            : '';
            
        if (experienceContext) {
            profileContext = `\nYour background: ${experienceContext}`;
        }
    }
    
    const professionalToneCues = {
        supportive: `TONE: supportive. Affirm the point, add one practical tip, and keep language warm.
EXAMPLE: "Appreciate this reminder—small, consistent behaviors like this change outcomes over time."`,
        excited: `TONE: excited. Show controlled enthusiasm about momentum or results (one exclamation max). Focus on what's next.
EXAMPLE: "Love the energy here—this unlocks faster learning loops for teams."`,
        happy: `TONE: positive and upbeat. Keep it friendly and light; focus on wins without hype.
EXAMPLE: "This is refreshing—simple actions that actually move work forward."`,
        gracious: `TONE: appreciative. Acknowledge effort and offer one concise addition.
EXAMPLE: "Thanks for laying this out so clearly—one thing that also helps is…"`,
        polite: `TONE: courteous and respectful. Use neutral, precise language.
EXAMPLE: "Clear framing. A helpful complement is …"`,
        witty: `TONE: intelligent and lightly playful. One crisp analogy only; keep it professional.
EXAMPLE: "This is the ‘lint roller’ for messy processes—quick, simple, effective."`,
        professional: `TONE: professional. Use concise, outcome-focused language; minimize adjectives.
EXAMPLE: "This reduces coordination cost and improves throughput across teams."`,
        thoughtful: `TONE: thoughtful. Use cause-effect and trade-off language; connect to implications.
EXAMPLE: "It shifts attention from outputs to behaviors, which compounds over time."`
    };
    const tonePhrase = professionalToneCues[config.tone] || `TONE: ${config.tone}. Keep it consistent throughout.`;
    const lengthPhrase = getLengthPhrase(config.commentLength);

    return `Write a LinkedIn comment that sounds exactly like a real person having a natural conversation.

Post: "${postData.content}"${profileContext}

Your task: Write like the successful comments below (these got 50+ impressions and one got 4K):

${config.includeQuestions ? 
`SUCCESSFUL EXAMPLES:
"This story highlights the often-overlooked value of grit and resilience alongside technical skill. I wonder how many talented individuals are overlooked because they don't fit a traditional hiring mold?"

"Love this simple yet powerful habit! I've found that reflecting on even small wins cultivates a much-needed sense of accomplishment and fuels motivation for the next day. What's been your biggest surprise from tracking your daily wins?"

"Great reminder about often-overlooked hygiene! I wonder if the type of can material impacts the risk of contamination – perhaps aluminum is less porous than steel?"

"The initial grind is intense. Your point about delegating after establishing a system is key; what tools or strategies did you find most effective for that transition?"` :
`SUCCESSFUL EXAMPLES:
"This story highlights the often-overlooked value of grit and resilience alongside technical skill. So many talented individuals are overlooked simply because they don't fit traditional hiring molds."

"Love this simple yet powerful habit! Reflecting on even small wins cultivates a much-needed sense of accomplishment and fuels motivation for the next day."

"Great reminder about often-overlooked hygiene! The type of can material likely impacts contamination risk – aluminum being less porous than steel."

"The initial grind is intense. Your point about delegating after establishing a system is absolutely key to sustainable growth."`}

MATCH THIS STYLE:
- Start with natural phrases like "Love this", "Great point", "So true", "This highlights"
- Use simple words everyone understands
- Sound genuinely interested and thoughtful
- Be conversational, like talking to a colleague
- ${questionInstruction}
- Write complete, flowing sentences
- Show personal insight or experience
${tonePhrase}
${lengthPhrase}

AVOID:
- Starting with "This shows People really.."
- Incomplete sentences
- Business jargon or complex words
- AI-sounding phrases
- Multiple options or numbered lists

Write ONE natural comment that sounds human and gets people to engage:`;
}

function createHumanLikePrompt(postData, config, userProfile = null) {
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
    let casualPromptInstructions = '';
    if (config.includeQuestions) {
        questionGuidance = '• End with one natural question that invites replies\n';
        casualPromptInstructions = 'genuine curiosity and insight while fostering meaningful professional discussion';
    } else {
        // Relaxed, human-friendly guidance (previously too strict and robotic)
        questionGuidance = '• Do not include questions. End with a clear statement or observation\n';
        casualPromptInstructions = 'insight and expertise while providing valuable professional perspective (no questions)';
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
    
    // Tone-specific style cues and micro-examples to increase divergence
    const casualToneCues = {
        witty: `STYLE: Keep it light, clever, and a touch playful. Use one subtle metaphor or wordplay, never sarcastic. Avoid formal phrasing.
EXAMPLE OPENERS:
- "Okay, this gave my brain a tiny high-five."
- "Hot take, but this is the espresso shot most teams need."
PHRASING HINTS: swap "utilize"→"use", "therefore"→"so", sprinkle one smart comparison.`,
        thoughtful: `STYLE: Calm, reflective, and observant. Use cause-and-effect language and connect to broader implications. No punchlines.
EXAMPLE OPENERS:
- "This lands because it treats the root cause, not the symptom."
- "What I appreciate here is the practical path from idea to behavior."
PHRASING HINTS: use "it suggests", "it nudges", "the tradeoff is", avoid playful metaphors.`,
        excited: `STYLE: High energy, optimistic, forward-looking. One exclamation max. Focus on momentum and next steps.`,
        supportive: `STYLE: Warm and encouraging. Affirm the insight, add one helpful note from experience.`,
        professional: `STYLE: Direct and businesslike. Prioritize clarity and impact over flair.`
    };
    const toneCue = casualToneCues[config.tone] || '';

    return `You are writing a natural, conversational LinkedIn comment. Write like you're chatting with a colleague about something interesting you saw.

Post Content: "${postData.content}"${professionalPerspective}

WRITE NATURALLY:
• Use everyday words that anyone understands
• Sound like you're talking, not writing a report
• Be genuine and interested in the topic
• NO business jargon or complicated words
• NO multiple options or numbered points
${questionGuidance}

${toneCue}

YOUR NATURAL STYLE (like your successful comments):
${config.includeQuestions ?
`"Love this simple yet powerful habit! I've found that reflecting on even small wins cultivates a much-needed sense of accomplishment and fuels motivation for the next day. What's been your biggest surprise from tracking your daily wins?"

"So true! It seems 'culture' is often the ghost in the machine – invisible until it malfunctions spectacularly (or beautifully). What's the weirdest cultural quirk you've encountered that really defined a company?"

"Great reminder about often-overlooked hygiene! I wonder if the type of can material impacts the risk of contamination – perhaps aluminum is less porous than steel?"

"The initial grind is intense. Your point about delegating after establishing a system is key; what tools or strategies did you find most effective for that transition?"` :
`"Love this simple yet powerful habit! Reflecting on even small wins cultivates a much-needed sense of accomplishment and fuels motivation for the next day."

"So true! Culture is often the ghost in the machine – invisible until it malfunctions spectacularly or beautifully transforms everything."

"Great reminder about often-overlooked hygiene! The type of can material likely impacts contamination risk – aluminum being less porous than steel."

"The initial grind is intense. Your point about delegating after establishing a system is absolutely key to sustainable growth."` }

KEEP IT SIMPLE:
• Use "help" not "assist"
• Use "show" not "demonstrate"  
• Use "use" not "utilize"
• Use "start" not "commence"
• Use "make" not "create"
• Use "get" not "obtain"

AVOID SOUNDING LIKE AI:
• NO multiple numbered options
• NO corporate buzzwords
• NO overly formal language
• NO phrases like "arms race" or "hyper-specialization"

TONE: ${config.tone} and friendly
LENGTH: Around ${lengthTokens[config.commentLength]} characters

Write ONE simple, natural comment that shows you're genuinely interested in the topic.`;
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
                temperature: getToneTemperature(config.tone),
                topK: 24,
                topP: 0.85,
                maxOutputTokens: getLengthToTokens(config.commentLength),
                candidateCount: 1
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

    // Step 3.5: Remove boilerplate sentences and duplicates
    comment = removeBoilerplate(comment);

    // Step 3.6: Tweak common openers to avoid template-y starts
    comment = tweakOpeners(comment);
    
    // Step 4: Final cleanup and validation
    comment = finalCleanup(comment);
    // Step 5: Absolute guard – strip any sentence containing banned terms
    comment = removeBannedSentences(comment, postData.content);
    
    console.log('✅ BACKGROUND: Final processed comment:', comment);
    return comment;
}

function fixCapitalization(text) {
    let fixed = text;
    
    // Remove AI-sounding numbered options immediately
    fixed = fixed.replace(/\*\*Option \d+[^\*]*\*\*[^\*]*\*/g, '');
    fixed = fixed.replace(/Option \d+[^.]*/g, '');
    fixed = fixed.replace(/\d+\./g, '');
    
    // Replace complex business terms with simple alternatives
    const complexToSimple = {
        'facilitate': 'help',
        'utilize': 'use',
        'demonstrate': 'show',
        'leverage': 'use',
        'optimize': 'improve',
        'paradigm': 'way',
        'ecosystem': 'system',
        'hyper-specialization': 'specialization',
        'content arms race': 'content competition',
        'value proposition': 'value'
    };
    
    Object.entries(complexToSimple).forEach(([complex, simple]) => {
        const regex = new RegExp(`\\b${complex}\\b`, 'gi');
        fixed = fixed.replace(regex, simple);
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
    
    // Fix obvious broken patterns like "This shows People really.."
    improved = improved.replace(/This shows People really\.\./g, 'This really shows how people');
    improved = improved.replace(/People really\.\./g, 'people can really');
    
    // Fix incomplete sentences ending with ".." 
    improved = improved.replace(/([a-z]+)\.\./g, '$1');
    
    // Clean up any remaining fragments
    improved = improved.replace(/\b([A-Z][a-z]{1,4})\s*\.\s*$/g, '');
    
    console.log('🔧 FLOW: Output:', improved);
    return improved;
}

function removeBoilerplate(text) {
    // Remove stock phrases and duplicate sentences that Gemini can overuse
    const boilerplate = [
        /This\s+shift\s+represents\s+a\s+fundamental\s+change\s+in\s+how\s+professionals\s+approach\s+their\s+craft\.?/i,
        /This\s+represents\s+a\s+fundamental\s+shift\.?/i,
        /This\s+marks\s+a\s+fundamental\s+shift\.?/i,
        /A\s+fundamental\s+change\s+in\s+how\s+professionals\s+approach\s+their\s+craft\.?/i,
        /At the end of the day,/i,
        /In today'?s (fast-paced|rapidly changing) world/i,
        /paradigm\s+shift/i,
        /ever-?evolving\s+landscape/i,
        // Generic openers/questions we want to avoid
        /This\s+.*\s+highlights\b/i,
        /I'?ve\s+noticed\b/i,
        /The\s+real\s+impact\s+lies\b/i,
        /Which\s+of\s+these\s+frameworks\s+resonates\b/i
    ];
    
    // Split by sentence boundaries
    const parts = text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    
    const seen = new Set();
    const cleaned = [];
    for (const s of parts) {
        // Filter boilerplate
        const isBoiler = boilerplate.some(rx => rx.test(s));
        if (isBoiler) continue;
        // De-dup (case-insensitive)
        const key = s.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cleaned.push(s);
    }
    
    return cleaned.join(' ');
}

function tweakOpeners(text) {
    let t = text;
    // Replace templated openers with more human variants
    t = t.replace(/^This\s+.*?\s+highlights\b/i, (m) => m.replace(/This/i, 'What stands out here')).trim();
    t = t.replace(/^I'?ve\s+noticed\b/i, 'One thing I’ve run into');
    t = t.replace(/^The\s+real\s+impact\s+lies\b/i, 'The value shows up when');
    // Avoid trailing generic question prompts
    t = t.replace(/Which\s+of\s+these\s+frameworks\s+resonates[^.!?]*[.!?]/i, '');
    return t.trim();
}

function removeBannedSentences(text, postContent) {
    const bannedRx = [
        /fundamental\s+change/i,
        /approach\s+their\s+craft/i,
        /paradigm\s+shift/i,
        /ever-?evolving\s+landscape/i
    ];
    const sentences = text.split(/(?<=[.!?])\s+/);
    const kept = sentences.filter(s => !bannedRx.some(rx => rx.test(s)));
    let out = kept.join(' ').trim();
    if (!out) {
        // Fallback: build a minimal, context-safe line from the post
        const snippet = (postContent || '').trim().slice(0, 80);
        out = snippet ? `Interesting takeaway here: ${snippet}` : 'Good insight with practical value.';
    }
    return out;
}

// Simple in-memory recent history to avoid repeats across quick generations
let __recentComments = [];

function sentenceSimilarity(a, b) {
    const norm = s => new Set((s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2));
    const A = norm(a), B = norm(b);
    if (A.size === 0 || B.size === 0) return 0;
    let inter = 0;
    A.forEach(w => { if (B.has(w)) inter++; });
    const union = new Set([...A, ...B]).size;
    return inter / union;
}

async function ensureDiverseAndContextual(comment, basePrompt, postData, apiKey, model, config) {
    const banned = [
        'fundamental change',
        'approach their craft',
        'at the end of the day',
        'in today\'s fast-paced',
        'paradigm shift',
        'ever-evolving landscape',
        'highlights why',
        "i've noticed",
        'the real impact lies',
        'which of these frameworks resonates'
    ];
    // If comment contains banned phrases, or is too similar to recent ones, re-roll once with constraints
    const hasBanned = banned.some(p => comment.toLowerCase().includes(p));
    const tooSimilar = __recentComments.some(prev => sentenceSimilarity(comment, prev) > 0.55);
    const lacksConcrete = !hasConcreteReference(comment, postData.content);
    
    if (hasBanned || tooSimilar || lacksConcrete) {
        console.log('🎯 DIVERSITY: Rerolling due to', { hasBanned, tooSimilar, lacksConcrete });
        const avoidList = banned.map(p => `"${p}"`).join(', ');
        const reinforcement = `\nRESTRICTIONS:\n- Do NOT use: ${avoidList}.\n- Reference at least ONE concrete noun or phrase from the post (quote it).\n- Avoid generic openers like "This X highlights" or "I’ve noticed".\n- Ask a specific question tied to the quoted phrase (if questions are enabled).\n- Vary sentence lengths (mix short and medium).\n- Keep the selected TONE and LENGTH constraints.`;
        const diversifiedPrompt = basePrompt + reinforcement;
        // Slight temperature jitter for diversity
        const jittered = { ...config, tone: config.tone, __tempOverride: Math.min(0.95, Math.max(0.45, getToneTemperature(config.tone) + (Math.random() * 0.12 - 0.06))) };
        let diversified = await callAPI(model, diversifiedPrompt, apiKey, jittered);
        // Final safety: if still similar, lightly paraphrase by appending a targeted instruction
        if (__recentComments.some(prev => sentenceSimilarity(diversified, prev) > 0.55)) {
            diversified = diversified.replace(/\b(This|That|It)\b/g, '');
        }
        __recentComments.unshift(diversified);
        __recentComments = __recentComments.slice(0, 6);
        return diversified;
    }
    __recentComments.unshift(comment);
    __recentComments = __recentComments.slice(0, 6);
    return comment;
}

function hasConcreteReference(text, postContent) {
    // Require an overlapping content word (noun-ish heuristic) to ensure context use
    const words = (s) => (s || '').toLowerCase().match(/[a-z0-9]{4,}/g) || [];
    const postWords = new Set(words(postContent));
    const commentWords = new Set(words(text));
    let overlap = 0;
    commentWords.forEach(w => { if (postWords.has(w)) overlap++; });
    return overlap >= 1; // at least one concrete overlap
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
    
    // Fix broken sentences like "This shows People really.."
    cleaned = cleaned.replace(/This shows People really\.\./g, 'This really shows how');
    cleaned = cleaned.replace(/People really\.\./, 'people can really');
    
    // Fix incomplete fragments
    cleaned = cleaned.replace(/^([A-Za-z\s]{1,20})\.\.\s*/, 'This really highlights how ');
    
    // Light anti-AI phrasing cleanup
    const bannedPhrases = [
        /this resonates/gi,
        /thanks for sharing/gi,
        /great post/gi,
        /arms race/gi,
        /hyper[- ]specialization/gi,
        /this shift represents a fundamental change in how professionals approach their craft\.?/gi
    ];
    bannedPhrases.forEach(rx => { cleaned = cleaned.replace(rx, ''); });

    // Ensure proper ending punctuation
    if (cleaned && !cleaned.match(/[.!?]$/)) {
        cleaned += '.';
    }
    
    // Remove any remaining double periods
    cleaned = cleaned.replace(/\.\./g, '.');
    
    // Ensure comment starts with capital letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    console.log('🧹 CLEANUP: Output:', cleaned);
    return cleaned;
}

console.log('🔥 BACKGROUND: Script loaded successfully');