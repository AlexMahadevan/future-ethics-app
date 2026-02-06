# Future Ethics Decision Game

An interactive web-based game for AI ethics workshops at the Poynter Institute. Teams explore 5 future journalism scenarios and identify ethical decisions newsrooms will need to make.

## Features

- 🎮 **Interactive Card-Based Interface** - Navigate through 5 future scenarios
- 📝 **Free-Form Decision Input** - Teams add their own ethics decisions
- 💾 **Airtable Integration** - Auto-save responses for policy development
- 🎨 **Premium Design** - Dark mode with glassmorphism and smooth animations
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 💿 **Local Backup** - Decisions saved locally in case of connectivity issues

## Setup Instructions

### 1. Configure Airtable

1. **Create an Airtable Base** with a table for ethics decisions
2. **Recommended table structure:**
   - `Team Name` (Single line text)
   - `Scenario` (Single line text)
   - `Ethics Decision` (Long text)
   - `Timestamp` (Date with time)
   - `Workshop Date` (Date)

3. **Get your credentials:**
   - Personal Access Token: https://airtable.com/create/tokens
   - Base ID: Found in your Airtable URL (`https://airtable.com/YOUR_BASE_ID/...`)
   - Table Name: The name of your table

4. **Update `config.js`:**
   ```javascript
   const AIRTABLE_CONFIG = {
     apiKey: 'patXXXXXXXXXXXXXX',  // Your Personal Access Token
     baseId: 'appXXXXXXXXXXXXXX',   // Your Base ID
     tableName: 'Ethics Decisions',  // Your Table Name
   };
   ```

### 2. Run the Game

Simply open `index.html` in a web browser:

```bash
open index.html
```

Or use a local server:

```bash
# Python 3
python3 -m http.server 8000

# Then visit: http://localhost:8000
```

## How to Use in Workshops

1. **Share the link** with workshop participants
2. **Teams enter their name** at the start
3. **For each scenario**, teams:
   - Read the future scenario
   - Discuss ethical implications
   - Add decisions they identify
4. **Responses auto-save** to Airtable in real-time
5. **Summary view** shows all their decisions at the end
6. **Export option** available for offline records

## File Structure

```
future-ethics-app/
├── index.html          # Main HTML structure
├── styles.css          # Premium CSS design system
├── app.js              # Game logic & Airtable integration
├── config.js           # Airtable configuration
├── scenarios.json      # 5 future journalism scenarios
└── README.md           # This file
```

## The 5 Scenarios

1. **The Creator Century** - Audiences follow people, not institutions
2. **The AI Newsroom** - AI handles production across formats
3. **Beyond the Screen** - Ambient, conversational journalism
4. **The Fog of Information** - So much data, so much doubt
5. **The Post-Platform Rebellion** - Trust realignment after Big Tech collapse

## Accessing Workshop Data

All team responses are saved to your Airtable base. You can:

- **View in Airtable** - See all responses in real-time
- **Export from Airtable** - Download as CSV/Excel for analysis
- **Create Views** - Filter by scenario, team, or workshop date
- **Build Dashboards** - Visualize common themes and patterns

## Troubleshooting

**Airtable not saving?**
- Check that `config.js` has valid credentials
- Verify your Personal Access Token has write permissions
- Check browser console for error messages

**Scenarios not loading?**
- Ensure `scenarios.json` is in the same directory
- Check browser console for fetch errors

**Local storage full?**
- Clear browser data or export and restart

## Credits

Created for the Poynter Institute's AI Ethics in Journalism workshops.

Scenarios based on the National Journalism + AI Accelerator Scenario Stories.
