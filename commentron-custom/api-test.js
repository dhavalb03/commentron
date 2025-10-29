// Simple test to verify that the Gemini API call works without penalty parameters
async function testGeminiAPI() {
    // This is a mock test - in a real scenario, you would use a valid API key
    const API_KEY = "YOUR_API_KEY_HERE";
    const MODEL = "gemini-2.5-flash";
    
    const prompt = "Write a brief, professional LinkedIn comment about AI trends in 2024.";
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`, {
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
        
        if (!response.ok) {
            const error = await response.json();
            console.error('API Error:', error);
            return;
        }
        
        const data = await response.json();
        console.log('API Test Successful!');
        console.log('Response:', data);
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testGeminiAPI();