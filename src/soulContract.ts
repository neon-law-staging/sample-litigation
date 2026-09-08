// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { FeedPost, StatusCell } from './types'

/**
 * The second claim in *Cruller v. Prine* — fixture data, and nothing else.
 *
 * The trespass claim in `matter.ts` is the matter's original pleading. This
 * module carries the count added on amendment: rescission of an alleged
 * contract for the conveyance of the plaintiff's soul, given in exchange for a
 * doughnut.
 *
 * Same rule as `matter.ts` — the data lives here, the components render it, and
 * the seam between the two is a file boundary. Every figure below is invented.
 */

export const SOUL_CLAIM = {
  count: 'Count II',
  title: 'Rescission of the Doughnut Instrument',
  claim: 'Rescission — fraudulent inducement',
  jurisdiction: 'Nevada',
  /** The two bites, and the gap the defense is built on. */
  firstBite: '2025-04-01',
  secondBite: '2026-04-14',
  filed: '2026-08-03',
} as const

/** How long Dermot sat on it. The defense's entire theory, in one number. */
export const GAP_DAYS = Math.round(
  (Date.parse(SOUL_CLAIM.secondBite) - Date.parse(SOUL_CLAIM.firstBite)) / 86_400_000,
)

export const SOUL_FACTS: StatusCell[] = [
  { label: 'Count', value: SOUL_CLAIM.count },
  { label: 'Relief sought', value: 'Rescission' },
  { label: 'Gap between bites', value: `${GAP_DAYS} days` },
  { label: 'Consideration received', value: 'One (1) doughnut' },
]

/* ------------------------------------------------------------------ graph */

/**
 * What a node is in the relationship graph.
 *
 * `party` and `witness` are people. `instrument` and `term` are things — the
 * doughnut and the clause allegedly hidden in it — and they are on the same
 * canvas as the people on purpose: the whole dispute is about which humans were
 * standing near which object, and a graph that draws only the humans hides the
 * question.
 */
export type NodeKind = 'party' | 'witness' | 'instrument' | 'term'

export interface GraphNode {
  id: string
  label: string
  /** Shown in the avatar disc, and by the graph when a node is too small for a name. */
  initials: string
  kind: NodeKind
  /** One line: who this is to the case. */
  role: string
  /** The paragraph the detail pane shows on selection. */
  detail: string
  /** Household grouping, used to seed the layout so families land together. */
  household: 'cruller' | 'prine' | 'res'
}

export type EdgeKind = 'family' | 'adverse' | 'evidence' | 'instrument'

export interface GraphEdge {
  source: string
  target: string
  kind: EdgeKind
  /** Rendered on the edge and in the detail pane. */
  label: string
}

export const GRAPH_NODES: GraphNode[] = [
  {
    id: 'dermot',
    label: 'Dermot A. Cruller',
    initials: 'DAC',
    kind: 'party',
    role: 'Plaintiff · alleged promisor',
    detail:
      'Ate the doughnut in two sittings a year apart. Says he was told the doughnut was "neat" and nothing else, and that he learned of the soul term only after the second bite.',
    household: 'cruller',
  },
  {
    id: 'wendell',
    label: 'Wendell Prine',
    initials: 'WP',
    kind: 'party',
    role: 'Defendant · alleged offeror',
    detail:
      'Plaintiff alleges Prine appeared in a horned aspect over the hedge, offered the doughnut, and concealed the operative clause inside the pastry. Prine denies the aspect and denies concealment.',
    household: 'prine',
  },
  {
    id: 'doughnut',
    label: 'The Doughnut',
    initials: '◎',
    kind: 'instrument',
    role: 'The instrument · the res',
    detail:
      'One glazed doughnut. Consumed in two sittings — a partial bite on 1 April 2025 and the remainder on 14 April 2026. The physical instrument no longer exists, which is itself a live evidentiary problem.',
    household: 'res',
  },
  {
    id: 'clause',
    label: 'The Hidden Term',
    initials: '§',
    kind: 'term',
    role: 'The concealed clause',
    detail:
      'The soul-conveyance term, allegedly baked into the doughnut rather than spoken. A term the offeree cannot read before performing is the heart of the fraudulent-concealment count.',
    household: 'res',
  },
  {
    id: 'beatrix',
    label: 'Beatrix Cruller',
    initials: 'BC',
    kind: 'witness',
    role: 'Spouse · percipient witness',
    detail:
      'Present at the hedge on 1 April 2025. Expected to testify to what Prine said and did not say, and to Dermot\'s state of knowledge in the intervening year.',
    household: 'cruller',
  },
  {
    id: 'odile',
    label: 'Odile Cruller',
    initials: 'OC',
    kind: 'witness',
    role: 'Daughter · contemporaneous notes',
    detail:
      'Kept a dated notebook. Her entries are the only contemporaneous record of the first bite and the best evidence on when Dermot actually discovered the term.',
    household: 'cruller',
  },
  {
    id: 'linus',
    label: 'Linus Cruller',
    initials: 'LC',
    kind: 'witness',
    role: 'Son · witness to the second bite',
    detail:
      'Says he watched Dermot finish the doughnut from the refrigerator on 14 April 2026, and that Dermot said nothing about a contract at the time.',
    household: 'cruller',
  },
  {
    id: 'posy',
    label: 'Posy Cruller',
    initials: 'PC',
    kind: 'witness',
    role: 'Daughter · present, non-testifying',
    detail: 'Present at both bites. Not offered as a witness.',
    household: 'cruller',
  },
  {
    id: 'verity',
    label: 'Verity Prine',
    initials: 'VP',
    kind: 'witness',
    role: 'Defendant\'s spouse · adverse witness',
    detail:
      'Expected to testify that the hedge conversation was ordinary neighborly conduct and that no horns were present.',
    household: 'prine',
  },
  {
    id: 'ambrose',
    label: 'Ambrose Prine',
    initials: 'AP',
    kind: 'witness',
    role: 'Defendant\'s son',
    detail: 'In the Prine yard on 1 April 2025. Deposition not yet noticed.',
    household: 'prine',
  },
  {
    id: 'errol',
    label: 'Errol Prine',
    initials: 'EP',
    kind: 'witness',
    role: 'Defendant\'s son',
    detail: 'In the Prine yard on 1 April 2025. Deposition not yet noticed.',
    household: 'prine',
  },
]

export const GRAPH_EDGES: GraphEdge[] = [
  { source: 'dermot', target: 'wendell', kind: 'adverse', label: 'Adverse parties' },
  { source: 'wendell', target: 'doughnut', kind: 'instrument', label: 'Offered' },
  { source: 'dermot', target: 'doughnut', kind: 'instrument', label: 'Consumed — twice' },
  { source: 'doughnut', target: 'clause', kind: 'instrument', label: 'Concealed within' },
  { source: 'wendell', target: 'clause', kind: 'adverse', label: 'Drafted · alleged' },
  { source: 'clause', target: 'dermot', kind: 'adverse', label: 'Purports to bind' },

  { source: 'dermot', target: 'beatrix', kind: 'family', label: 'Spouse' },
  { source: 'dermot', target: 'linus', kind: 'family', label: 'Father' },
  { source: 'dermot', target: 'odile', kind: 'family', label: 'Father' },
  { source: 'dermot', target: 'posy', kind: 'family', label: 'Father' },
  { source: 'beatrix', target: 'linus', kind: 'family', label: 'Mother' },
  { source: 'beatrix', target: 'odile', kind: 'family', label: 'Mother' },
  { source: 'beatrix', target: 'posy', kind: 'family', label: 'Mother' },

  { source: 'wendell', target: 'verity', kind: 'family', label: 'Spouse' },
  { source: 'wendell', target: 'ambrose', kind: 'family', label: 'Father' },
  { source: 'wendell', target: 'errol', kind: 'family', label: 'Father' },
  { source: 'verity', target: 'ambrose', kind: 'family', label: 'Mother' },
  { source: 'verity', target: 'errol', kind: 'family', label: 'Mother' },

  { source: 'beatrix', target: 'doughnut', kind: 'evidence', label: 'Witnessed the offer' },
  { source: 'odile', target: 'doughnut', kind: 'evidence', label: 'Dated notes' },
  { source: 'linus', target: 'doughnut', kind: 'evidence', label: 'Witnessed the second bite' },
  { source: 'verity', target: 'doughnut', kind: 'evidence', label: 'Denies the offer' },
  { source: 'beatrix', target: 'verity', kind: 'evidence', label: 'Neighbors — conflicting accounts' },
]

/** Human-readable names for the edge kinds, used by the legend and filter. */
export const EDGE_KINDS: { value: EdgeKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'adverse', label: 'Adverse' },
  { value: 'instrument', label: 'Instrument' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'family', label: 'Family' },
]

/* ------------------------------------------------------------- chronology */

export const CHRONOLOGY: FeedPost[] = [
  {
    id: 'offer',
    date: '2025-04-01',
    dateLabel: '1 April 2025',
    actor: 'Wendell Prine',
    role: 'Defendant · at the hedge',
    initials: 'WP',
    accent: 'danger',
    kind: 'Offer',
    title: 'The doughnut is offered over the hedge',
    body: 'Plaintiff alleges Prine presented the doughnut in a horned aspect and described it only as "neat." No soul term was spoken aloud. Beatrix Cruller was present.',
  },
  {
    id: 'first-bite',
    date: '2025-04-01',
    dateLabel: '1 April 2025',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff',
    initials: 'DAC',
    accent: 'brand',
    kind: 'Performance',
    title: 'The first bite — a small one',
    body: 'Dermot takes a partial bite and sets the remainder aside. Whether this bite alone accepted anything is the formation question the whole count turns on.',
  },
  {
    id: 'dormant',
    date: '2025-04-02',
    dateLabel: 'April 2025 – April 2026',
    actor: 'No party',
    role: 'The gap',
    initials: '—',
    accent: 'neutral',
    kind: 'Dormancy',
    title: `${GAP_DAYS} days pass with the doughnut in the refrigerator`,
    body: 'No demand, no performance, no mention of a soul by either side. Prine says this silence is acquiescence. Dermot says nothing happened because he did not yet know anything had.',
  },
  {
    id: 'second-bite',
    date: '2026-04-14',
    dateLabel: '14 April 2026',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · hungry',
    initials: 'DAC',
    accent: 'warning',
    kind: 'Performance',
    title: 'The remainder is eaten',
    body: 'Dermot finishes the doughnut. Linus Cruller witnesses it. This is the act Prine characterizes as ratification — and the single most dangerous fact in the count.',
  },
  {
    id: 'discovery',
    date: '2026-04-15',
    dateLabel: '15 April 2026',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff',
    initials: 'DAC',
    accent: 'link',
    kind: 'Discovery',
    title: 'Dermot learns of the soul term',
    body: 'The day after the doughnut is gone. If the trier accepts this date, the limitations clock and the ratification analysis both start here rather than at the first bite.',
  },
  {
    id: 'engaged',
    date: '2026-04-20',
    dateLabel: '20 April 2026',
    actor: 'Neon Law',
    role: 'Through Lawrence Lawyer',
    initials: 'NL',
    accent: 'brand',
    kind: 'Engagement',
    title: 'The engagement letter is signed',
    body: 'Five days after discovery, and the reason anything after this date can be done "through counsel." Its scope is the arbitration the street\'s recorded covenants require these neighbors to hold before either of them may try a claim of this kind.',
  },
  {
    id: 'notice',
    date: '2026-05-02',
    dateLabel: '2 May 2026',
    actor: 'Cruller',
    role: 'Through counsel',
    initials: 'DAC',
    accent: 'success',
    kind: 'Notice',
    title: 'Notice of rescission served',
    body: 'Seventeen days after discovery. Prompt notice on discovery is what defeats a laches defense, and it is the strongest procedural fact Dermot has.',
  },
  {
    id: 'amended',
    date: '2026-08-03',
    dateLabel: '3 August 2026',
    actor: 'Court',
    role: 'Eighth Judicial District',
    initials: 'CT',
    accent: 'neutral',
    kind: 'Filing',
    title: 'Count II added by amendment',
    body: 'Rescission pleaded in the alternative to the trespass count already before the court.',
  },
]

/* ------------------------------------------------------- the legal spine */

export interface Issue {
  id: string
  kicker: string
  title: string
  tone: 'ready' | 'wait' | 'risk' | 'default'
  question: string
  dermot: string
  wendell: string
  reading: string
}

/**
 * The five questions the count turns on.
 *
 * Ordered the way they have to be decided, not by strength: there is no
 * ratification question until something was formed, and no limitations question
 * until there is something to rescind.
 */
export const ISSUES: Issue[] = [
  {
    id: 'formation',
    kicker: 'Step one',
    title: 'Was anything formed at the first bite?',
    tone: 'wait',
    question:
      'An offer inviting acceptance by performance is not accepted until performance is complete — beginning it only makes the offer irrevocable while the offeree carries on. If eating the doughnut was the performance, a partial bite began it and did not close it.',
    dermot:
      'Nothing was formed on 1 April 2025. A bite is the start of a performance, not an acceptance of it, and Dermot was free to stop — which he did, for a year.',
    wendell: 'The bite was the acceptance. The doughnut was delivered and accepted; the rest is only consumption of what was already his.',
    reading:
      'Dermot has the better of this, and it matters more than it looks: if formation waited for the second bite, the year of silence is not delay at all.',
  },
  {
    id: 'concealment',
    kicker: 'Step two',
    title: 'Does a term baked inside the doughnut bind anyone?',
    tone: 'ready',
    question:
      'Assent runs to the terms a party had a reasonable opportunity to read. A material term the offeree physically cannot reach before performing is not one of them, and affirmatively describing the instrument as merely "neat" turns silence into misrepresentation.',
    dermot:
      'No meeting of the minds on the operative term, and an affirmative misdescription on top of it. Voidable at Dermot\'s election.',
    wendell: 'The term was in the instrument. Dermot chose not to inspect what he was eating.',
    reading:
      'The strongest ground in the count. Concealment of a material term plus an affirmative gloss is fraudulent inducement on any state\'s formulation.',
  },
  {
    id: 'ratification',
    kicker: 'Step three',
    title: 'Did eating the rest ratify the contract?',
    tone: 'risk',
    question:
      'A contract voidable for fraud can be affirmed by conduct — but ratification requires knowledge of the facts that made it voidable. Accepting a benefit in ignorance affirms nothing.',
    dermot:
      'On 14 April 2026 Dermot knew only that he was hungry. He learned of the soul term the next day and served notice within seventeen. Ignorant consumption is not affirmance.',
    wendell: 'He took the whole benefit of the bargain a year in. A party cannot eat the consideration and then disclaim the deal.',
    reading:
      'The count lives or dies here, and it is a fact question, not a legal one. Everything depends on what Dermot knew on 14 April — which is why Odile\'s dated notebook is the most valuable document in the matter.',
  },
  {
    id: 'limitations',
    kicker: 'Step four',
    title: 'Has the year run the clock out?',
    tone: 'ready',
    question:
      'A fraud claim in Nevada runs three years, and the discovery rule starts it when the aggrieved party discovers the facts constituting the fraud — not when the transaction occurred.',
    dermot:
      'Even measured from the first bite, the claim is filed inside three years. Measured from discovery it is barely four months old.',
    wendell: 'Delay alone; no independent limitations bar available.',
    reading:
      'Not a real obstacle on these dates. The gap is a ratification and laches problem dressed up as a limitations problem — and prompt notice answers the laches half.',
  },
  {
    id: 'policy',
    kicker: 'Step five',
    title: 'Is a soul a thing a court will convey?',
    tone: 'ready',
    question:
      'Rescission unwinds a bargain and restores the parties. A promise with no cognizable subject matter, or one so one-sided that no honest party would propose it, fails before rescission is even reached.',
    dermot:
      'A soul is not property a court can transfer, value, or order delivered. And one doughnut against a soul is unconscionable on its face.',
    wendell: 'The parties set their own price; courts do not weigh adequacy of consideration.',
    reading:
      'Courts do not weigh adequacy — but they do notice a disparity this extreme as evidence of the overreaching alleged in step two. Plead it as the fallback, argue it as corroboration.',
  },
]

/** Where the analysis actually lands. */
export const BOTTOM_LINE = {
  answer: 'Yes — the year is not what defeats him.',
  because:
    'The clock on rescission runs from discovery of the concealed term, not from the first bite, and the claim is comfortably inside it. The gap only hurts Dermot if the second bite was a knowing acceptance of a bargain he understood — and on the pleaded facts he learned of the soul term the day after the doughnut was gone.',
  risk: 'Everything rests on Dermot\'s state of knowledge on 14 April 2026. If discovery is placed any earlier than the second bite, the second bite becomes ratification and the count fails.',
}
