// Airtable credentials for the LA workshop app (Aug 26, 2026).
//
// This file ships to GitHub Pages, so the token is readable by anyone who
// views source — the trade-off for a static workshop app with no backend.
//
// DELETE THIS TOKEN IN AIRTABLE AFTER AUG 26.

const AIRTABLE_CONFIG = {
  apiKey: 'patJRlRnyVwztfNAx.7dcaecf46a35b3ad37c995b122487a418623a17de23a31d1dd8da7e7c451ed5b',
  baseId: 'appMg5TGC8PHo6vhp',
  tableName: 'Table Standards',

  get apiUrl() {
    return 'https://api.airtable.com/v0/' + this.baseId + '/' + encodeURIComponent(this.tableName);
  },
};
