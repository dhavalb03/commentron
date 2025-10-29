// Direct API Test - bypasses background script communication
// Add this to your browser console on LinkedIn to test direct API calls

async function testDirectGeminiAPI() {
    console.log('🔬 Testing direct Gemini API call...');
    
    // Get API key from extension storage
    const settings = await chrome.storage.local.get(['geminiApiKey', 'commentLength', 'tone', 'industry']);
    
    if (!settings.geminiApiKey) {
        console.error('❌ No API key found in extension storage');
        return;
    }
    
    console.log('✅ Found API key:', settings.geminiApiKey.substring(0, 10) + '...');
    
    const testPostData = {
        content: 'Just published my latest article on AI trends in 2024. The integration of AI in everyday business processes is accelerating faster than we anticipated!',
        author: 'Test Author',
        url: window.location.href
    };
    
    const prompt = `You are a professional LinkedIn engagement specialist. Generate thoughtful, valuable comments that add to the conversation.

Please generate a supportive LinkedIn comment in response to this post by ${testPostData.author}:

\"${testPostData.content}\"

Requirements:
- Length: 2-3 sentences (50-100 words)
- Tone: supportive and encouraging
- Industry context: general
- Add genuine value to the conversation
- Be authentic and professional
- Include a relevant insight or question if appropriate
- Avoid generic responses like \"Great post!\" or \"Thanks for sharing\"

The comment should feel natural and contribute meaningfully to the discussion.`;
    
    try {
        console.log('📡 Making direct API call to Gemini...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 100
                }
            })
        });
        
        console.log('📊 API Response Status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }
        
        const data = await response.json();
        console.log('📦 API Response Data:', data);
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const comment = data.candidates[0].content.parts[0]?.text?.trim();
            console.log('✅ Generated Comment:', comment);
            
            // Try to insert into comment box
            const commentBox = document.querySelector('.comments-comment-box-comment__text-editor');
            if (commentBox) {
                commentBox.textContent = comment;
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('✅ Comment inserted into comment box!');
            } else {
                console.log('⚠️ No comment box found for insertion');
            }
            
        } else {
            console.error('❌ No comment generated from API response');
        }
        
    } catch (error) {
        console.error('❌ Direct API test failed:', error);
    }
}

// Auto-run the test
testDirectGeminiAPI();