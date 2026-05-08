// Airtable Configuration
// IMPORTANT: Replace these values with your actual Airtable credentials

const AIRTABLE_CONFIG = {
    // Get your Personal Access Token from: https://airtable.com/create/tokens
    apiKey: 'pat3LVXBKTf6tuPMi.0d4d52a227749ec5581ce54068d0abab2f53c4cfbef825ff80995c93d4fea0f5',

    // Your Base ID (found in the URL: https://airtable.com/YOUR_BASE_ID/...)
    baseId: 'appMg5TGC8PHo6vhp',

    // The name or ID of your table
    // From your URL, the ID is tblU6Fuve5zwMLd9a
    tableName: 'tblU6Fuve5zwMLd9a',

    // API endpoint
    get apiUrl() {
        return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}`;
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRTABLE_CONFIG;
}
