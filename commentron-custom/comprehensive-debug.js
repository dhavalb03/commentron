// Run this script on LinkedIn to debug what's happening
// Copy and paste into Chrome Console (F12 → Console) when on LinkedIn

console.log('=== COMPLETE LINKEDIN DEBUG ANALYSIS ===');

// 1. Check if content script is loaded
console.log('1. Content Script Status:');
console.log('- linkedInBot exists:', typeof window.linkedInBot !== 'undefined');
console.log('- testCommentGeneration exists:', typeof window.testCommentGeneration !== 'undefined');

// 2. Check for artdeco-button__text elements
console.log('\n2. Comment Button Analysis:');
const artdecoElements = document.querySelectorAll('.artdeco-button__text');
console.log(`- Found ${artdecoElements.length} .artdeco-button__text elements`);

let commentButtons = [];
artdecoElements.forEach((el, i) => {
    const text = el.innerText?.toLowerCase()?.trim();
    console.log(`  [${i}] "${text}"`);
    if (text && text.includes('comment')) {
        const button = el.closest('button');
        if (button) {
            commentButtons.push({element: el, button: button, text: text});
        }
    }
});

console.log(`- Found ${commentButtons.length} comment buttons`);

// 3. Check for comment text editors
console.log('\n3. Comment Text Editor Analysis:');
const commentEditors = document.querySelectorAll('.comments-comment-box-comment__text-editor');
console.log(`- Found ${commentEditors.length} .comments-comment-box-comment__text-editor elements`);

const altCommentEditors = document.querySelectorAll('[contenteditable="true"]');
console.log(`- Found ${altCommentEditors.length} contenteditable elements total`);

// 4. Check for post containers
console.log('\n4. Post Container Analysis:');
const feedUpdates = document.querySelectorAll('.feed-shared-update-v2');
console.log(`- Found ${feedUpdates.length} .feed-shared-update-v2 containers`);

const occludableUpdates = document.querySelectorAll('.occludable-update');
console.log(`- Found ${occludableUpdates.length} .occludable-update containers`);

// 5. Check for post content
console.log('\n5. Post Content Analysis:');
const postContentElements = document.querySelectorAll('.feed-shared-update-v2__description-wrapper, .feed-shared-text, span[dir="ltr"]');
console.log(`- Found ${postContentElements.length} potential post content elements`);

let meaningfulContent = [];
postContentElements.forEach((el, i) => {
    const text = el.innerText?.trim();
    if (text && text.length > 20 && text.length < 1000) {
        meaningfulContent.push({
            index: i,
            text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
            element: el
        });
    }
});

console.log(`- Found ${meaningfulContent.length} meaningful content elements:`);
meaningfulContent.slice(0, 5).forEach(content => {
    console.log(`  "${content.text}"`);
});

// 6. Test clicking a comment button
console.log('\n6. Comment Button Click Test:');
if (commentButtons.length > 0) {
    console.log('Testing click on first comment button...');
    const firstButton = commentButtons[0];
    console.log('Button to click:', firstButton.button);
    
    // Simulate click
    firstButton.button.click();
    
    setTimeout(() => {
        const newCommentEditors = document.querySelectorAll('.comments-comment-box-comment__text-editor');
        console.log(`After click: Found ${newCommentEditors.length} comment editors`);
        
        if (newCommentEditors.length > 0) {
            console.log('✅ Comment box appeared after clicking!');
            const editor = newCommentEditors[newCommentEditors.length - 1];
            console.log('Editor element:', editor);
            
            // Test inserting text
            editor.textContent = 'Test comment insertion!';
            const inputEvent = new Event('input', { bubbles: true });
            editor.dispatchEvent(inputEvent);
            console.log('✅ Test comment inserted!');
        } else {
            console.log('❌ No comment box appeared after clicking');
        }
    }, 2000);
} else {
    console.log('❌ No comment buttons found to test');
}

console.log('\n=== DEBUG COMPLETE ===');
console.log('Please share this output to help identify the issue.');