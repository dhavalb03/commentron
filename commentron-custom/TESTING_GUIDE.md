# CommenTron - Auto Comment Generation Test Guide

## Quick Test Steps

### Step 1: Reload Extension
1. Go to `chrome://extensions/`
2. Find "Custom CommenTron" 
3. Click the reload button (🔄)
4. Go back to LinkedIn

### Step 2: Enable Auto-Generation
1. Click the CommenTron extension icon
2. Make sure "Auto-generate when clicking comment buttons" is **CHECKED**
3. Verify your API key is configured

### Step 3: Test on LinkedIn
1. Go to LinkedIn feed: https://www.linkedin.com/feed/
2. You should see a small blue debug message in top-right corner for 10 seconds
3. Click any "Comment" button on any post
4. Watch for indicators: 🤖 Generating → ✅ Generated

### Step 4: Manual Test (if auto doesn't work)
1. On LinkedIn, press **F12** to open Developer Tools
2. Go to **Console** tab
3. Type: `testCommentGeneration()` and press Enter
4. This will manually trigger the process

### Step 5: Debug Information
In the console (F12 → Console), you should see logs like:
```
Setting up comment button listeners...
Selector 'button[aria-label*="Comment"]' found 5 buttons
Found valid comment button: {text: "comment", ariaLabel: "comment on john's post"}
Comment button clicked!
Auto-generation is enabled, proceeding...
Found post container using selector: .feed-shared-update-v2
```

## Expected Behavior

✅ **Working correctly:**
- You see debug logs in console
- Comment buttons are detected 
- Clicking Comment shows generation indicators
- Comment appears in the comment box

❌ **Not working:**
- No logs in console
- No comment buttons detected
- Clicking Comment does nothing
- No generation indicators appear

## Troubleshooting

### If No Comment Buttons Detected:
1. Check console for "Found X comment buttons" 
2. If 0 buttons found, LinkedIn may have changed their structure
3. Share console output with me

### If Buttons Detected But Nothing Happens:
1. Check if "Auto-generate when clicking comment buttons" is enabled
2. Check if API key is configured
3. Look for error messages in console

### If Comment Box Not Found:
1. Try waiting longer after clicking Comment
2. Check console for "Comment box not found"
3. Try different posts (some layouts may be different)

## Video Reference
The extension should work exactly like shown in your video:
1. Click Comment button on any LinkedIn post
2. Comment automatically generates and appears in the text box
3. Click Comment again to regenerate

## Share Debug Info
If it's still not working, please share:
1. Console output after clicking Comment button
2. Which LinkedIn page you're testing on
3. Whether you see the blue debug message when page loads