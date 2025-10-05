# Custom CommenTron - LinkedIn Comment Generator

An advanced Chrome extension that generates human-like, contextually relevant LinkedIn comments using Google's Gemini AI. Now with **Profile-Aware Commenting** for personalized, authentic interactions.

## 🚀 New Features

### Profile-Aware Comments
- **Automatic Profile Detection**: Extract your LinkedIn profile information to make comments more personalized
- **Context-Aware Responses**: Comments reference your experience, skills, and professional background when relevant
- **Smart Relevance**: Only incorporates profile data when it naturally fits the conversation
- **Privacy Focused**: Profile data is stored locally in your browser and never shared

### Advanced Comment Generation
- **Radical Humanization**: Comments sound genuinely human with natural imperfections
- **Anti-AI Detection**: Sophisticated techniques to avoid generic AI-sounding responses
- **Content Type Detection**: Automatically adapts tone and approach based on post type (advice, story, opinion, etc.)
- **Industry-Specific Language**: Uses appropriate terminology and perspective for your field

## 📋 How It Works

### Setting Up Profile-Aware Comments

1. **Extract Your Profile**:
   - Navigate to your LinkedIn profile page
   - Open the extension popup
   - Click "Extract Profile from Current Page"
   - Your professional information is now stored for personalized comments

2. **Enable Profile-Aware Mode**:
   - Check "Use my LinkedIn profile for personalized comments" in the popup
   - Comments will now incorporate your background when relevant

### Comment Generation Process

1. **Automatic Generation**: Click any comment button on LinkedIn posts and the extension automatically generates a relevant, human-like comment
2. **Profile Integration**: The AI considers your professional background, experience, and expertise when crafting responses
3. **Natural Language**: Comments use authentic language patterns, casual expressions, and industry-appropriate terminology
4. **Context Matching**: Different strategies for advice posts, personal stories, opinion pieces, and general content

## 🎯 Example Improvements

### Before (Generic AI):
> "This resonates! I've found that productivity tips are really valuable. Thanks for sharing!"

### After (Profile-Aware & Human):
> "Yeah, been trying similar approaches since joining the startup world. The Pomodoro thing actually helped during my time at TechCorp when we had those crazy sprint cycles... have you found any specific tools that work better for remote teams?"

## ⚙️ Configuration Options

### Profile Settings
- **Use Profile Data**: Toggle profile-aware commenting on/off
- **Extract Profile**: Pull information from your current LinkedIn profile page
- **Clear Profile**: Remove stored profile data

### Comment Customization
- **Length**: Super-short to multi-paragraph options
- **Tone**: Supportive, excited, witty, professional, thoughtful, etc.
- **Industry Focus**: Technology, marketing, healthcare, finance, education, consulting
- **Auto-Generation**: Automatically generate when clicking comment buttons

### Advanced Features
- **Content Type Detection**: Automatically identifies advice posts, personal stories, opinions, questions
- **Natural Language Patterns**: Uses "tbh", "ngl", "lol", casual punctuation naturally
- **Anti-AI Patterns**: Avoids common AI phrases like "This resonates!" and forced enthusiasm
- **Smart Questioning**: Only asks questions when genuinely curious (not every comment)

## 🔧 Technical Details

### Profile Data Extraction
The extension intelligently extracts:
- **Basic Info**: Name, headline, location
- **Experience**: Current and previous roles (top 3)
- **Skills**: Professional competencies (top 10)
- **Education**: Degrees and institutions (top 2)
- **About Section**: Professional summary when available

### Privacy & Security
- All profile data is stored locally in Chrome's storage
- No data is transmitted to external servers except for AI generation
- Profile extraction only occurs when explicitly requested
- Data can be cleared at any time

### AI Integration
- Uses Google Gemini 2.5 Flash for natural language generation
- Enhanced prompts incorporate profile context intelligently
- Higher temperature settings for natural variation
- Advanced parameters to reduce repetition and increase authenticity

## 📥 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Get a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
6. Configure the extension with your API key

## 🎨 Usage Examples

### For Advice Posts
**Input**: "5 productivity tips for remote workers..."
**Profile-Aware Output**: "Number 3 really hits home - had to figure this out the hard way when I transitioned to remote work at [Company]. The calendar blocking thing has been a game changer, especially for deep focus work. Anyone found good tools for async team coordination?"

### For Personal Stories
**Input**: "Sharing my journey from junior developer to CTO..."
**Profile-Aware Output**: "This is so similar to my path in the tech space! The imposter syndrome part especially resonates - felt that hard during my early days as a software engineer. The mentorship piece you mentioned is huge... curious what specific advice helped you most during those tough middle years?"

### For Opinion Posts
**Input**: "I think remote work is here to stay..."
**Profile-Aware Output**: "From my experience managing remote teams in fintech, completely agree. We've seen productivity actually increase since going distributed. The key challenge isn't performance - it's culture and spontaneous collaboration. What's worked for your team on that front?"

## 🔬 Advanced Prompt Engineering

The extension uses sophisticated prompt engineering techniques:

- **Profile Context Integration**: Seamlessly weaves professional background into responses
- **Content Type Analysis**: Detects post patterns and adjusts response strategy
- **Natural Language Modeling**: Uses authentic speech patterns and informal expressions
- **Relevance Filtering**: Only includes profile information when contextually appropriate
- **Anti-Pattern Detection**: Actively avoids common AI writing patterns

## 🛠️ Files Structure

- `manifest.json` - Extension configuration
- `popup.html/css/js` - Extension interface with profile management
- `content.js` - LinkedIn page interaction and profile extraction
- `background.js` - AI integration and profile-aware prompt generation
- `README.md` - Documentation

## 🚨 Important Notes

- Requires a valid Google Gemini API key
- Works only on LinkedIn pages
- Profile extraction works best on your own LinkedIn profile page
- Generated comments appear in the comment box - you still need to review and post them
- Profile data is stored locally and can be cleared anytime

## 💡 Tips for Best Results

1. **Keep Profile Updated**: Extract your profile after making significant updates to LinkedIn
2. **Review Comments**: Always review generated comments before posting
3. **Adjust Settings**: Experiment with different tones and lengths for your style
4. **Industry Specificity**: Set your industry focus for more targeted language
5. **Natural Usage**: Use the auto-generate feature for seamless integration

## 🔄 Version History

### v2.0 - Profile-Aware Comments
- Added LinkedIn profile extraction and storage
- Implemented profile-aware prompt generation
- Enhanced natural language patterns
- Improved content type detection
- Added comprehensive profile management UI

### v1.0 - Basic Comment Generation
- Initial human-like comment generation
- Basic prompt engineering
- Auto-generation on comment button clicks

---

**Ready to transform your LinkedIn engagement with personalized, authentic comments that sound genuinely human? Install Custom CommenTron and start building more meaningful professional connections!**
