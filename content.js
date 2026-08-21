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
      ['Staff', 'Unionized photo desk — five shooters and a visuals director. One graphics person. A standards editor who answers to the EIC.'],
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

// The four sections the program promised. Order matters — it is the guide's order.
const SECTIONS = [
  {
    id: 'primary',
    num: '1',
    title: 'Primary sources',
    blurb: 'What must be real, and what you do when it doesn\'t exist.',
    fields: [
      { key: 'primaryReal', label: 'What has to be real, no exceptions', placeholder: 'The faces. The location. The…' },
      { key: 'primaryMissing', label: 'When the real thing doesn\'t exist, we…', placeholder: 'Run nothing? Run a graphic? Run it with…' },
    ],
  },
  {
    id: 'transparency',
    num: '2',
    title: 'Transparency',
    blurb: 'Allowed with disclosure — and the exact words the reader sees.',
    fields: [
      { key: 'transparencyAllowed', label: 'Allowed with disclosure', placeholder: 'What you will run, so long as you say so.' },
      {
        key: 'disclosureLine',
        label: 'The exact words that appear on the image',
        sublabel: '15 words or fewer, exactly as they would sit on the image.',
        placeholder: 'Write the label itself.',
        counted: true,
      },
    ],
  },
  {
    id: 'legal',
    num: '3',
    title: 'Legal exposure',
    blurb: 'Rights, releases, likeness — the thing you\'d have to defend.',
    fields: [
      { key: 'legalDefend', label: 'Rights, releases, likeness — what we\'d have to defend', placeholder: 'The uses you could defend if a lawyer called.' },
      { key: 'legalWontTouch', label: 'What we won\'t touch because of it', placeholder: 'The uses you couldn\'t.' },
    ],
  },
  {
    id: 'people',
    num: '4',
    title: 'Simulating real people',
    blurb: 'The hardest one — and where the doc rules and the news rules split.',
    fields: [
      { key: 'peopleNever', label: 'Never', placeholder: 'What stays banned even on deadline.' },
      { key: 'peopleOnlyIf', label: 'Only if', placeholder: 'Every condition it would take.' },
      { key: 'peopleSignoff', label: 'Who signs off', placeholder: 'One job title.' },
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
