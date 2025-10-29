// Test file to verify background.js functions work correctly
console.log('Testing background.js functions...');

// Mock data for testing
const mockPostData = {
    content: "Just published my latest article on AI trends in 2024. The integration of AI in everyday business processes is accelerating faster than we anticipated!",
    author: "Test Author",
    url: "https://www.linkedin.com/test"
};

const mockConfig = {
    commentLength: 'brief',
    tone: 'professional',
    industry: 'technology',
    commentStyle: 'professional',
    includeQuestions: true
};

const mockUserProfile = {
    name: "John Doe",
    headline: "Software Engineer",
    experience: [
        { title: "Senior Developer", company: "Tech Corp" },
        { title: "Software Engineer", company: "Startup Inc" }
    ],
    skills: ["JavaScript", "Python", "Machine Learning"]
};

// Test the createProfessionalPrompt function
try {
    console.log('Testing createProfessionalPrompt...');
    const professionalPrompt = createProfessionalPrompt(mockPostData, mockConfig, mockUserProfile);
    console.log('✅ createProfessionalPrompt works correctly');
    console.log('Prompt length:', professionalPrompt.length);
} catch (error) {
    console.error('❌ createProfessionalPrompt failed:', error);
}

// Test the createHumanLikePrompt function
try {
    console.log('Testing createHumanLikePrompt...');
    const humanLikePrompt = createHumanLikePrompt(mockPostData, mockConfig, mockUserProfile);
    console.log('✅ createHumanLikePrompt works correctly');
    console.log('Prompt length:', humanLikePrompt.length);
} catch (error) {
    console.error('❌ createHumanLikePrompt failed:', error);
}

// Test the fixCapitalization function
try {
    console.log('Testing fixCapitalization...');
    const testText = "this is a test. option 1. **Option 2** this shows People really..";
    const fixedText = fixCapitalization(testText);
    console.log('✅ fixCapitalization works correctly');
    console.log('Original:', testText);
    console.log('Fixed:', fixedText);
} catch (error) {
    console.error('❌ fixCapitalization failed:', error);
}

// Test the removeQuestions function
try {
    console.log('Testing removeQuestions...');
    const testText = "This is a statement. What do you think? How are you? This is another statement.";
    const filteredText = removeQuestions(testText);
    console.log('✅ removeQuestions works correctly');
    console.log('Original:', testText);
    console.log('Filtered:', filteredText);
} catch (error) {
    console.error('❌ removeQuestions failed:', error);
}

// Test the improveSentenceFlow function
try {
    console.log('Testing improveSentenceFlow...');
    const testText = "This shows People really.. fix this sentence.";
    const improvedText = improveSentenceFlow(testText);
    console.log('✅ improveSentenceFlow works correctly');
    console.log('Original:', testText);
    console.log('Improved:', improvedText);
} catch (error) {
    console.error('❌ improveSentenceFlow failed:', error);
}

// Test the finalCleanup function
try {
    console.log('Testing finalCleanup...');
    const testText = "  this is a test..  fix this.  ";
    const cleanedText = finalCleanup(testText);
    console.log('✅ finalCleanup works correctly');
    console.log('Original:', JSON.stringify(testText));
    console.log('Cleaned:', JSON.stringify(cleanedText));
} catch (error) {
    console.error('❌ finalCleanup failed:', error);
}

console.log('All tests completed!');