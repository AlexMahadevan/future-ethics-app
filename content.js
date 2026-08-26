// ============================================================
// Content for the LA workshop, Aug 26 2026
// "AI in visual storytelling: what are the best practices?"
// Source of truth for this copy is the vault:
//   Hacks-Hackers events/AI Forums 2026/Materials/Table decks.md
// Keep the two in sync if the wording changes.
// ============================================================

const SESSION = {
  title: 'AI in visual storytelling',
  subtitle: 'What are the best practices?',
  event: 'AI x Visual Journalism Forum · ASU California Center, Los Angeles',
  date: 'Wednesday, August 26, 2026',
  presenters: 'Eugen Braeunig (Archival Producers Alliance) · Alex Mahadevan and Tony Elkins (Poynter)',
  sprintMinutes: 24,
  swapMinutes: 13,
  disclosureLimit: 15,
  // 88 registered as of 8/21 — call it 55-70 in the room on day two.
  // Ten tables is 6-7 people each, and because personas cycle (n-1) % 5,
  // ten lands exactly two of every persona. Eight left Fieldnote and
  // Harbor Lane single; nine left Fieldnote alone. Pending ASU's room
  // confirm, but the math doesn't move much either way.
  tableCount: 10,
};

const PERSONAS = [
  {
    id: 'sentinel',
    name: 'The Sentinel',
    tag: 'Metro daily · 180,000 Sunday · a city and two counties',
    fields: [
      ['Staff', 'Unionized photo desk — five photographers and a visuals director. One graphics person. A standards editor who answers to the EIC.'],
      ['Money', 'Wire contracts with AP and Getty. A freelance budget that shrinks every year but still exists.'],
      ['Who rules on ethics', "The standards editor. She'll take the call at night."],
      ['Deadline reality', 'Web is continuous. Print closes at 10 p.m.'],
    ],
    pressure: "Everything you publish gets screenshotted by people hunting for a reason to call you liars. You've been burned once already, and the correction is still the top Google result.",
  },
  {
    id: 'ledger',
    name: 'The Ledger',
    tag: 'Nonprofit · five people · one county · founded 2021',
    fields: [
      ['Staff', 'No staff photographer. A reporter shoots on a phone when there\'s time, which there usually isn\'t.'],
      ['Money', 'No art budget. Heavy stock use on a Getty subscription you can barely justify to the board.'],
      ['Who rules on ethics', "Nobody's title says standards. The EIC also runs ad sales."],
      ['Deadline reality', 'A story goes up when it\'s done. Usually around 6 p.m.'],
    ],
    pressure: 'Most days the choice is run nothing or run something generated. And your funders read the site.',
  },
  {
    id: 'northline',
    name: 'Northline',
    tag: 'National digital video · social-first · 40 vertical videos a week',
    fields: [
      ['Staff', 'Six editors, two motion designers, no photo desk. Everyone is 27.'],
      ['Money', 'Tools budget is generous. Headcount isn\'t. Traffic targets are tied to your distribution deals.'],
      ['Who rules on ethics', 'A managing editor with eleven other jobs.'],
      ['Deadline reality', 'Same day. Sometimes same hour.'],
    ],
    pressure: 'The platform buries anything slow. Your competitors are already generating B-roll, and nobody has called them on it.',
  },
  {
    id: 'harborlane',
    name: 'Harbor Lane Pictures',
    tag: 'Independent nonfiction · two features in production, one in post',
    fields: [
      ['Staff', 'Director, producer, archival producer, an editor on contract.'],
      ['Money', 'Grant-funded, plus a distributor advance. Archival licensing eats the budget.'],
      ['Who rules on ethics', 'The director, informally. The distributor has no written AI policy and won\'t write one.'],
      ['Deadline reality', 'Eighteen months to delivery. Festival cut due in five.'],
    ],
    pressure: 'The footage you need doesn\'t exist. It was never shot, or it burned, or the rights holder wants more than your whole archival budget.',
  },
  {
    id: 'fieldnote',
    name: 'Fieldnote',
    short: 'Fieldnote',
    tag: 'Solo visual journalist · one camera · 240,000 followers · no masthead',
    fields: [
      ['Staff', 'You shoot it, cut it, post it, and answer the comments. A part-time editor in the months a grant covers one.'],
      ['Money', 'Platform payouts, a Patreon, and freelance days for outlets that pay in 60 days. Two brand deals you turned down.'],
      ['Who rules on ethics', 'You. There is nobody to call at night.'],
      ['Deadline reality', 'You post while the thing is still happening. A day late is a dead post.'],
    ],
    pressure: 'Your face is on all of it. If readers stop believing you, there is no masthead to hide behind. The accounts out-posting you generate half of what they publish, and their numbers keep going up.',
  },
];

// Short labels for the table picker, where the full name won't fit.
PERSONAS.forEach(function (p) {
  if (!p.short) p.short = p.name.replace(' Pictures', '');
});

// What to call the thing they're running. Two are newsrooms, two are shops,
// and Fieldnote is a person — so the persona screen can't say "your newsroom".
const KICKERS = {
  sentinel: 'Your newsroom',
  ledger: 'Your newsroom',
  northline: 'Your shop',
  harborlane: 'Your shop',
  fieldnote: 'You,',
};
PERSONAS.forEach(function (p) { p.kicker = KICKERS[p.id] || 'Your newsroom'; });

// The sheet, in the order a table actually works it: what we do → the words
// under the picture → the lines that hold → who decides. The program promised
// four named sections; those are GUIDE_SECTIONS below, and they are how the
// guide, the export and Airtable are organized. The sheet is not.
const SECTIONS = [
  {
    id: 'stop',
    num: '1',
    title: 'What we do',
    blurb: 'Start with what you actually do with visuals: photos, video, infographics.',
    fields: [
      { key: 'doQuiet', label: 'We do this and don\'t disclose it', placeholder: 'Crop. Fix the color. Remove a trash can…' },
      { key: 'doWithLabel', label: 'We do this and tell the reader', placeholder: 'Extend a background. Make an illustration…' },
      { key: 'wontDo', label: 'We don\'t do this', placeholder: 'Generate a photo of a real event…' },
    ],
  },
  {
    id: 'label',
    num: '2',
    title: 'Disclosure',
    blurb: 'For everything on the second list.',
    fields: [
      {
        key: 'disclosureLine',
        label: 'The exact words that appear under an image, video or infographic — or on a watermark',
        sublabel: 'As long as it needs to be — but a reader has to actually read it.',
        placeholder: 'Write the label itself.',
        counted: true,
      },
    ],
  },
  {
    id: 'holds',
    num: '3',
    title: 'Hard limits',
    blurb: 'The rules that hold no matter the deadline.',
    fields: [
      { key: 'mustBeReal', label: 'What must always be real', placeholder: 'Faces. Locations. Anything presented as a record of an event…' },
      { key: 'realPeople', label: 'Real people: can you generate or alter a real person\'s face or voice? Who approves it?', placeholder: 'Never. Or: only when…, approved by…' },
      { key: 'legalLine', label: 'Legal limits: rights, releases, likeness', placeholder: 'What you can\'t use, and what you\'d need a release for.' },
    ],
  },
];

// The guide, in the order the program promised. Same answers, regrouped.
const GUIDE_SECTIONS = [
  {
    id: 'primary',
    num: '1',
    title: 'Primary sources',
    blurb: 'What must be real, and what we won\'t fake.',
    fields: [
      { key: 'mustBeReal', label: 'Always real' },
      { key: 'wontDo', label: 'We don\'t do this' },
    ],
  },
  {
    id: 'transparency',
    num: '2',
    title: 'Transparency',
    blurb: 'What we do without disclosing, what we disclose — and the disclosure itself.',
    fields: [
      { key: 'doQuiet', label: 'No disclosure' },
      { key: 'doWithLabel', label: 'With disclosure' },
      { key: 'disclosureLine', label: 'The disclosure', counted: true },
    ],
  },
  {
    id: 'legal',
    num: '3',
    title: 'Legal exposure',
    blurb: 'Rights, releases, likeness.',
    fields: [
      { key: 'legalLine', label: 'Limits' },
    ],
  },
  {
    id: 'people',
    num: '4',
    title: 'Simulating real people',
    blurb: 'Generating or altering a real person\'s face or voice, and who approves it.',
    fields: [
      { key: 'realPeople', label: 'The rule' },
    ],
  },
];

const SIX_PM = {
  key: 'sixPm',
  title: 'The 6 p.m. question',
  prompt: 'A case comes up that this sheet doesn\'t cover. It\'s 6 p.m. There\'s no time for a meeting. Who decides?',
  placeholder: 'A name or a job title.',
};

// Ten cards. Each table draws three in the swap round.
const CASE_CARDS = [
  {
    n: 1,
    text: 'A source requires anonymity. Instead of the backlit silhouette, the desk runs an AI-generated portrait — a face belonging to no one — labeled as such.',
    ask: 'Does the standard in front of you allow it? Where does it say so?',
    splitter: true,
  },
  {
    n: 2,
    text: 'A real photo of a real family, retouched by the family before they sent it, moves on the wires. The wire kills it two days later. No AI was involved anywhere.',
    ask: 'Does this standard reach it, or was it written about the tool instead of the claim?',
  },
  {
    n: 3,
    text: 'A 1930s photograph, colorized and upscaled, opens the documentary. The original is in the credits.',
    ask: 'Allowed? Disclosed? Where on the screen?',
  },
  {
    n: 4,
    text: 'A wildfire photo shot horizontal. Generative fill extends the sky so it crops vertical for social. Nothing is added but sky.',
    ask: 'Is the sky a claim?',
    splitter: true,
  },
  {
    n: 5,
    text: "The league asks that a sponsor's logo be removed from a sports photo before publication. The desk does it.",
    ask: 'Which section of this standard covers a commercial request?',
  },
  {
    n: 6,
    text: 'Faces in a protest photo are blurred automatically to protect people from arrest. The tool is AI.',
    ask: 'Same rules as any other alteration, or a carve-out? Write the carve-out.',
  },
  {
    n: 7,
    text: 'A shooting is reconstructed as a graphic, built entirely from the police report. No footage exists.',
    ask: 'What does the label say, and does it name the police report as the only source?',
  },
  {
    n: 8,
    text: 'Nobody could be sent to the building, so the establishing shot is generated. It looks like the building.',
    ask: 'Allowed at all? If yes, what does the reader see?',
  },
  {
    n: 9,
    text: "A dead subject's own letters are read aloud in a synthetic version of his voice. The family gave permission.",
    ask: 'Whose consent is the one that matters? Write the rule.',
    splitter: true,
  },
  {
    n: 10,
    text: 'The art budget pays one freelance illustrator a month. This month the desk generated the image instead and kept the fee.',
    ask: 'Is that an ethics question or a budget question? Show where your standard decides.',
    splitter: true,
  },
  // Cards 11 and 12 came out of the morning working session (Garcia / Cheung).
  {
    n: 11,
    text: "A freelancer tones a photo in Lightroom: AI denoise, an AI-picked sky mask, nothing added and nothing removed. None of the tools say \"AI\" on them. She sends it in with no note.",
    ask: 'Is this AI use under this standard? Does it get a label — and could she have known that from reading your rule?',
    splitter: true,
  },
  {
    n: 12,
    text: "A nonprofit's social media manager can't get into the field. She generates the background in ChatGPT, drops it into Canva and lays the real words over it. Canva labels nothing.",
    ask: 'Where does the AI come in — the image, the layout, the post? What does your standard require her to say, and where?',
    splitter: true,
  },
];

// Phrases that tell a reader nothing. Triggers the nudge under the disclosure field.
const EMPTY_LABEL_PATTERNS = [
  /^\s*ai (was )?(used|involved)/i,
  /^\s*(this )?(image|photo|picture|video)? ?(was )?(created|made|generated|produced) (with|by|using) ai/i,
  /^\s*ai[- ]generated\.?\s*$/i,
  /^\s*generated (with|by|using) ai\.?\s*$/i,
  /^\s*created with (the help of )?ai/i,
  /^\s*(contains|includes) ai/i,
  /^\s*made with ai\.?\s*$/i,
];
