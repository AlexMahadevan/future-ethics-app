// Copy to config.js and fill in. `setup.py` writes this file for you.
//
// The app works without this — every table's draft lives in localStorage
// either way. Airtable is only what lets tables see each other, which the
// swap round and the facilitator console need.

const AIRTABLE_CONFIG = {
  apiKey: '',   // pat… — a workshop-only token, see README
  baseId: '',   // app…
  tableName: 'Table Standards',

  get apiUrl() {
    return 'https://api.airtable.com/v0/' + this.baseId + '/' + encodeURIComponent(this.tableName);
  },
};
