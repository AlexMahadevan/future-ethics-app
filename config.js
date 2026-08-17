// Airtable credentials for the LA workshop app (Aug 26, 2026).
//
// Same base as the Baltimore workshop, new table. This file ships to
// GitHub Pages, so the token is readable by anyone who views source —
// the existing trade-off for a static workshop app with no backend.
//
// ROTATE THIS TOKEN AFTER AUG 26. It has been public since May.

const AIRTABLE_CONFIG = {
  apiKey: 'pat3LVXBKTf6tuPMi.0d4d52a227749ec5581ce54068d0abab2f53c4cfbef825ff80995c93d4fea0f5',
  baseId: 'appMg5TGC8PHo6vhp',
  tableName: 'Table Standards',

  get apiUrl() {
    return 'https://api.airtable.com/v0/' + this.baseId + '/' + encodeURIComponent(this.tableName);
  },
};
