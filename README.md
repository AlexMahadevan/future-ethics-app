# The room's standard

The digital table kit for **"AI in visual storytelling: what are the best practices?"** — AI x Visual Journalism Forum, ASU California Center, Los Angeles, Wed Aug 26 2026, 2:30–3:45 p.m.

Replaces the printed persona cards, table sheet and case cards, and doubles as the shared doc: the sheet runs in working order (what we do → the label → what holds → who decides) and the answers regroup themselves into the four-section one-page guide the program promised.

Session plan lives in the vault at `Hacks-Hackers events/AI Forums 2026/Session -- Drawing the Line.md`. Copy comes from `Materials/Table decks.md` — keep the two in sync.

---

## The three surfaces

| URL | Who opens it | What it does |
|---|---|---|
| `/` | one device per table | Persona card → the sprint → the swap round |
| `/#/guide` | everyone, on the way out | The assembled one-page guide. Print or save as PDF. |
| `/#/facilitator` | you, on the laptop | Live console: who's in, every disclosure line, cards drawn, corrections |
| `/#/present` | the projector | One disclosure label at a time, full screen, arrow keys |

The facilitator URL isn't linked from anywhere. Type it.

## What it does that paper can't

- **The 15-word limit enforces itself.** Live counter under the disclosure field.
- **It catches the label that costs trust.** Type "AI was used in the creation of this image" and the app tells the table it says nothing. Same check flags those labels on your console so you know which ones to read aloud.
- **The swap round doesn't need shuffling.** The app pulls another table's finished standard — a different persona where it can — and deals three cards.
- **The synthesis is done when the room empties.** Shift+E on the facilitator screen downloads the whole thing as markdown, ready for the vault.

## Card deal

Fixed, not random. Table 1 draws cards 1, 5, 3 · Table 2 draws 4, 2, 7 · Table 3 draws 9, 6, 8, then it repeats. All nine cards are covered by table 3, and the three that split every room (1, 4, 9) land on the first three tables. The console flags any card nobody drew so you can hold it for the close.

## Personas

Five, assigned by table number in rotation:

| Table | Persona | What they are |
|---|---|---|
| 1, 6 | The Sentinel | Metro daily, unionized photo desk, a standards editor who takes the call at night |
| 2, 7 | The Ledger | Five-person nonprofit, no photographer, no art budget |
| 3, 8 | Northline | National digital video shop, 40 verticals a week |
| 4 | Harbor Lane Pictures | Independent doc unit, deep archive, festival cut in five months |
| 5 | Fieldnote | Solo visual journalist. No standards editor, no legal department, no masthead |

At eight tables the first three double up, which is deliberate — comparing two drafts of the same newsroom is its own finding. Fieldnote is the one whose standard conflicts hardest with The Sentinel's, because the disclosure label is the brand rather than a policy.

Change `SESSION.tableCount` in `content.js` once Burt confirms the room. The rotation and the card deal both adjust on their own.

---

## Setup

```bash
python3 setup.py pat_YOUR_TOKEN
```

Creates the Airtable table, writes `config.js`. Run it twice safely — it adds missing fields rather than duplicating.

The token needs `data.records:read`, `data.records:write`, `schema.bases:read`, `schema.bases:write`. If yours only has data scopes, pass an existing base id as a second argument and build the table by hand from the field list the script prints.

**Make it a workshop-only token on a workshop-only base, and delete it in Airtable after Aug 26.** `config.js` ships to GitHub Pages, which means the token is readable by anyone who views source. That is survivable for a one-day workshop scoped to a throwaway base. It is not survivable on a base with anything else in it.

### Running it

```bash
python3 -m http.server 8000   # then http://localhost:8000
```

Deploy is a `git push` — GitHub Pages serves from the default branch.

## Without Airtable

Everything still works for a single table: the persona, the sprint, the counter, the nudge, the cards, and its own draft, all in localStorage. What breaks is anything that needs to see other tables — the swap round falls back to "trade with the table next to you," and the facilitator console only sees itself. The printed materials in the vault are the paper backup.

## Files

```
index.html    all screens
styles.css    black rules, big Helvetica, light only — matches the print kit
app.js        router, sync, the four views
content.js    personas, sections, case cards, the generic-label patterns
config.js     Airtable credentials (written by setup.py)
setup.py      one-command Airtable setup
```
