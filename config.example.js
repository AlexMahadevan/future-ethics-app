// Airtable Configuration
// Copy this file to config.js and replace with your actual credentials

const AIRTABLE_CONFIG = {
    apiKey: 'YOUR_AIRTABLE_API_KEY_HERE',
    baseId: 'YOUR_BASE_ID_HERE',
    tableName: 'YOUR_TABLE_NAME_HERE',

    get apiUrl() {
        return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(this.tableName)}`;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIRTABLE_CONFIG;
}
