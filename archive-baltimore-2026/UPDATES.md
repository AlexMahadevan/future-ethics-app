# Feature Updates - Future Ethics App

## What's New

### 1. Scenario Choices Display ✅
**Where:** Ethics Screen (Phase 1)
**What:** The 3 potential paths forward from each scenario are now displayed as interactive cards to help spark team discussions and frame ethical tensions.

### 2. Reflection Phase ✅
**Where:** New screen between Safeguards and Summary (Phase 3)
**What:** Teams now answer reflection questions:
- "What was the hardest part of this scenario to decide?"
- "Where did your team disagree most?"
- "How confident are you in these safeguards?" (1-5 scale)

**Why:** This qualitative data will help you understand team decision-making processes and identify areas of uncertainty.

### 3. Individual Safeguard Entry with Tags ✅
**Where:** Safeguards Screen (Phase 2)
**What:** Safeguards now work like issues - teams add them one at a time with tags for each:
- Add safeguard text (textarea)
- Tag each safeguard individually: Technical, Editorial Policy, Training, Transparency, Organizational
- Each safeguard displays with its specific tags
- Teams can delete individual safeguards

**Why:** Provides granular data about which specific safeguards fall into which categories, making it easy to aggregate and analyze patterns across teams and scenarios.

### 4. Quick Wins ✅
- **Progress Counter:** Shows "X issues identified" to encourage more thorough brainstorming
- **Auto-save Indicator:** Small "✓ Saved" toast appears when progress is saved locally
- **Scenario count:** Already correct (10 scenarios)

## Required Airtable Updates

You'll need to add these new fields to your Airtable table:

### New Fields to Add:
1. **Reflection Hardest** (Long text) - What was hardest to decide
2. **Reflection Disagreement** (Long text) - Where team disagreed most
3. **Reflection Confidence** (Number, Integer 1-5) - Confidence rating

### Existing Fields (keep these):
- Team Name
- Scenario
- Ethical Issues
- **Safeguards** (Long text) - Now formatted as: "Safeguard text [Tag1, Tag2]\n\nAnother safeguard [Tag3]"
- Timestamp

**Note:** The Safeguards field now includes tags inline. Each safeguard is separated by double line breaks, with tags in square brackets after each one.

## Data Export Format

The JSON export now includes:
```json
{
  "teamName": "Team Phoenix",
  "timestamp": "2026-02-05T...",
  "scenario": "The AI Newsroom",
  "ethicalIssues": ["issue 1", "issue 2"],
  "safeguards": [
    {
      "text": "Require human review for all AI content",
      "tags": ["Technical", "Editorial Policy"]
    },
    {
      "text": "Mandatory AI literacy training for all staff",
      "tags": ["Training", "Organizational"]
    }
  ],
  "reflection": {
    "hardest": "text...",
    "disagreement": "text...",
    "confidence": 4
  }
}
```

## Testing Checklist

Before your next workshop:
- [ ] Update Airtable table with new fields
- [ ] Test full flow: Welcome → Select Scenario → Add Issues → Write Safeguards → Tag → Reflect → Summary
- [ ] Verify data saves to Airtable correctly
- [ ] Test export functionality
- [ ] Check mobile responsiveness
- [ ] Verify auto-save indicator appears

## Notes for Facilitators

**New Time Estimate:** Add ~5-7 minutes per scenario for individual safeguard entry and reflection phase.

**Facilitator Tips:**
- Encourage teams to be specific with safeguards - the individual entry format works best with concrete, actionable policies
- Remind teams that tags aren't mutually exclusive - a safeguard can be both "Technical" and "Organizational"
- The reflection questions work best when teams discuss them together before typing

**Data Analysis:** The new structure gives you incredibly rich data:
1. **Safeguard-level granularity:** See exactly which safeguards get which tags
2. **Cross-team patterns:** Aggregate similar safeguards across teams by matching text or tags
3. **Tag distribution:** Which types of safeguards are most/least common overall?
4. **Scenario-specific insights:** Do certain scenarios lead to more technical vs. organizational solutions?
5. **Confidence correlation:** Do teams with more training-focused safeguards feel more confident?
