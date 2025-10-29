# CommenTron Custom Extension - Setup Instructions

## What's Fixed

1. **"No post found" Error**: Enhanced post detection with multiple selectors for different LinkedIn layouts
2. **Auto-generation on Comment Click**: Added toggle in popup to enable/disable automatic comment generation when clicking LinkedIn comment buttons
3. **Better Comment Box Detection**: Improved comment box insertion with fallback mechanisms
4. **Background Script Integration**: Fixed message handling between content script and background script

## How to Use

### Step 1: Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the folder: `c:\Users\Administrator\Downloads\commentron\commentron-custom\`

### Step 2: Configure the Extension
1. Click the extension icon in Chrome toolbar
2. Enter your Gemini API key and click "Save API Key"
3. Configure your comment preferences (length, tone, industry)
4. **Enable "Auto-generate when clicking comment buttons"** checkbox

### Step 3: Use on LinkedIn
1. Go to LinkedIn feed
2. Click on any comment button on any post
3. The extension will automatically:
   - Generate a comment based on the post content
   - Insert it into the comment box
   - Show status indicators (🤖 Generating, ✅ Generated, 🔄 Regenerating)
4. Click the comment button again to regenerate with a different comment
5. You can edit the generated comment before posting

## Features

- **Automatic Comment Generation**: Generates comments when you click LinkedIn comment buttons
- **Smart Post Detection**: Works with different LinkedIn post layouts and formats
- **Visual Feedback**: Shows generation status with animated indicators
- **Comment Regeneration**: Click the comment button again to get a new comment
- **Customizable Settings**: Control length, tone, and industry focus
- **Manual Generation**: Still works with the popup for manual comment generation

## Troubleshooting

If you still get "No post found":
1. Make sure you're on a LinkedIn post page (not just the main feed)
2. Try scrolling to make sure the post is fully loaded
3. Check that the extension is enabled and API key is configured
4. Check browser console (F12) for any error messages

## Status Indicators

- 🤖 **Generating comment...** - Extension is creating a comment
- 🔄 **Regenerating comment...** - Creating a new comment (on second click)
- ✅ **Comment generated!** - Comment successfully created and inserted
- ❌ **Generation failed** - Error occurred during generation