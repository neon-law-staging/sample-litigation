// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { INTERROGATORIES } from './discovery'
import { AUTHORITIES, type Authority } from './research'
import { INBOUND } from './responses'
import { SOUL_CLAIM } from './soulContract'
import type { StatusCell } from './types'

/**
 * The motion for partial summary judgment, and the argument it makes.
 *
 * This is the fourth document in the matter and the first one that is a court
 * filing. The three under `documents.ts` are rendered from notation templates;
 * this one is Typst, in `pleadings/`, because it is on **pleading paper** — 28
 * numbered lines, three vertical rules, and a caption box whose height has to be
 * a whole number of those lines. `scripts/render-pleadings.sh` explains why that
 * puts it outside the notation pipeline rather than inside it.
 *
 * Why the page exists
 * -------------------
 * A client can read a filed motion and still not know the two things that
 * actually matter about it: what it would win, and what it deliberately does not
 * ask for. The second is the harder one, and it is the reason this is a view
 * rather than a fourth card on the documents tab.
 *
 * The motion is aimed at the limitations defense and at nothing else. Count II
 * turns on when Dermot learned of the soul term, and that fact is genuinely
 * disputed — so the ratification defense cannot be resolved on paper, and a
 * motion that reached for it would trade a certain partial win for a likely
 * total loss. `RESERVED` is that decision, written down, and the page renders it
 * beside the relief sought rather than in a footnote.
 *
 * Why the argument is arithmetic
 * -----------------------------
 * The whole motion is a subtraction. NRS 11.190(3)(d) gives three years; Count II
 * was filed sixteen months after the earliest date any theory can start the
 * clock; so the defense fails on every accrual date the record supports and the
 * court never has to choose between them.
 *
 * That means the argument can be **computed rather than asserted**, and it is.
 * `ACCRUAL_CANDIDATES` derives each expiry and each margin from the dates, and
 * the guard at the foot of this module throws at import if any candidate's
 * three years had already run when Count II was filed. A motion whose own
 * premise is false is a page that renders perfectly while being wrong, which is
 * the failure mode this repository puts a guard in front of.
 *
 * **Fixture, with the usual exception.** The parties, both firms, both bar
 * numbers, the docket number, the department, and every date are invented. The
 * authorities are not: `SUBSTANTIVE_AUTHORITIES` selects from the verified
 * entries in `research.ts` by id rather than restating them, and the two
 * procedural authorities held here carry the same `verified` promise — the NRCP
 * 56 quotes are the rule's own words and the *Wood* quotes were checked against
 * the opinion before they were written down.
 */

/* ---------------------------------------------------------------- the clock */

const DAY_MS = 86_400_000

/**
 * `INBOUND.asOf` is the fixture's present moment, for the reason
 * `responses.ts` gives: a live `new Date()` would make "33 days" true for one
 * day and would make every test that reads it depend on when it ran. Every page
 * that counts days counts from the same one.
 */
function daysFromAsOf(iso: string): number {
  return Math.round(
    (Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${INBOUND.asOf.iso}T00:00:00Z`)) / DAY_MS,
  )
}

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS,
  )
}

/** The same date, `years` later. UTC throughout, so no reader's time zone moves it. */
function yearsLater(iso: string, years: number): string {
  const date = new Date(`${iso}T00:00:00Z`)
  date.setUTCFullYear(date.getUTCFullYear() + years)
  return date.toISOString().slice(0, 10)
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function label(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

/* --------------------------------------------------------------- the filing */

/**
 * The docket, which this is the first document in the fixture to need.
 *
 * Nothing before this had a case number, because a notation template renders a
 * letter or an affidavit and neither carries one. A caption does. The number and
 * the department are invented like the rest of the matter — a real Clark County
 * docket number belongs to a real case, and stamping one on a simulated
 * soul-conveyance dispute is the same mistake as casting a real firm as the
 * adversary.
 */
export const COURT = {
  name: 'Eighth Judicial District Court',
  shortName: 'District Court',
  county: 'Clark County, Nevada',
  caseNumber: 'A-26-874219-C',
  department: 'XVII',
} as const

export const MOTION = {
  title: 'Plaintiff’s Motion for Partial Summary Judgment',
  /** What the caption actually says, for the page that renders the PDF beside it. */
  longTitle:
    'Plaintiff’s Motion for Partial Summary Judgment on Defendant’s Third Affirmative Defense (Statute of Limitations)',
  movant: 'Dermot A. Cruller',
  movantRole: 'Plaintiff',
  opponent: 'Wendell Prine',
  rule: 'NRCP 56(a)',
  /** The defense the motion is aimed at. */
  target: 'Third Affirmative Defense — statute of limitations',
  /** When Count II, and with it the defense, came into the case. */
  countFiled: { iso: SOUL_CLAIM.filed, label: label(SOUL_CLAIM.filed) },
  answered: { iso: '2026-08-10', label: label('2026-08-10') },
  filed: { iso: '2026-08-18', label: label('2026-08-18') },
  hearing: { iso: '2026-09-22', label: label('2026-09-22') },
  asOf: INBOUND.asOf,
} as const

/** Days until the motion is heard, as of `MOTION.asOf`. */
export const DAYS_TO_HEARING: number = daysFromAsOf(MOTION.hearing.iso)

/** The rendered pleading, and the Typst source behind it. */
export const MOTION_DOCUMENT = {
  id: 'motion-msj',
  title: 'Motion for Partial Summary Judgment',
  kind: 'Motion',
  /** Path under the mount, without a leading slash — joined through `portalPath`. */
  path: 'documents/motion-for-summary-judgment.pdf',
  /** The Typst source, and the pleading-paper module it imports. */
  source: 'pleadings/motion-summary-judgment.typ',
  furniture: 'pleadings/pleading-paper.typ',
  script: 'pnpm render:pleadings',
  pages: 7,
  /** Numbered lines per page — the thing that makes it pleading paper. */
  ruledLines: 28,
  status: 'filed',
} as const

/* ------------------------------------------------------- the limitations math */

/** NRS 11.190(3)(d). Three years, and the page derives every date from it. */
export const LIMITATIONS_YEARS = 3

export interface AccrualCandidate {
  id: string
  /** The date itself. */
  iso: string
  label: string
  /** What happened on it. */
  event: string
  /** Whose theory puts the clock here. */
  whose: 'statute' | 'defendant'
  /** Why it is or is not the date the statute actually names. */
  note: string
  /** Derived: when three years from this date runs out. */
  expiryIso: string
  expiryLabel: string
  /** Derived: days between this date and the day Count II was filed. */
  elapsedDays: number
  /** Derived: days between the filing and the expiry — the margin the claim had. */
  marginDays: number
}

/**
 * The two dates anyone has proposed for accrual, with the arithmetic done.
 *
 * Both are in the list because the motion's whole point is that it does not
 * matter which one the court picks. Deriving the expiry rather than writing it
 * down is what makes that claim checkable: move `SOUL_CLAIM.firstBite` and both
 * the page and the guard below follow it.
 */
function candidate(
  seed: Pick<AccrualCandidate, 'id' | 'iso' | 'event' | 'whose' | 'note'>,
): AccrualCandidate {
  const expiryIso = yearsLater(seed.iso, LIMITATIONS_YEARS)
  return {
    ...seed,
    label: label(seed.iso),
    expiryIso,
    expiryLabel: label(expiryIso),
    elapsedDays: daysBetween(seed.iso, MOTION.countFiled.iso),
    marginDays: daysBetween(MOTION.countFiled.iso, expiryIso),
  }
}

export const ACCRUAL_CANDIDATES: AccrualCandidate[] = [
  candidate({
    id: 'discovery',
    iso: SOUL_CLAIM.secondBite,
    event: 'Dermot finished the doughnut and learned of the soul term.',
    whose: 'statute',
    note: 'The date the statute actually names. NRS 11.190(3)(d) accrues a fraud claim on the aggrieved party’s discovery of the facts constituting the fraud, and this is that day.',
  }),
  candidate({
    id: 'offer',
    iso: SOUL_CLAIM.firstBite,
    event: 'Prine offered the doughnut over the hedge.',
    whose: 'defendant',
    note: 'The earliest date any theory can reach, and not the statutory trigger — on this day Dermot had discovered nothing. It is in the list because the motion is granted even if the court adopts it.',
  }),
]

/** The longest run the defense can claim on this record, in days. */
export const LONGEST_INTERVAL: number = Math.max(
  ...ACCRUAL_CANDIDATES.map((entry) => entry.elapsedDays),
)

/** The margin on the least favorable accrual date — the motion's worst case. */
export const NARROWEST_MARGIN: number = Math.min(
  ...ACCRUAL_CANDIDATES.map((entry) => entry.marginDays),
)

/* ------------------------------------------------------------ the authorities */

/**
 * The substantive law, selected from `research.ts` rather than restated.
 *
 * Same reason `responses.ts` selects its rule quotes from `discovery.ts` by id:
 * a second transcription of a verified quote is a second chance to break the
 * promise that `verified` makes. If a citation needs correcting it gets
 * corrected in one file.
 */
const SUBSTANTIVE_IDS = ['nrs-11-190', 'friendly-irishman'] as const

function authority(id: string): Authority {
  const found = AUTHORITIES.find((entry) => entry.id === id)
  if (!found) throw new Error(`motion.ts: no authority "${id}" in research.ts`)
  return found
}

export const SUBSTANTIVE_AUTHORITIES: Authority[] = SUBSTANTIVE_IDS.map(authority)

/**
 * The procedural authorities, which `research.ts` does not carry.
 *
 * That file is scoped to the three substantive issues in Count II — formation,
 * ratification, limitations — and the summary judgment standard is none of them.
 * Widening its `issue` union to admit a rule of procedure would make the
 * research tab claim to answer a question it does not ask, so these live here,
 * under the same `verified` discipline: the NRCP 56 quotes are the rule's own
 * words, and the *Wood* sentences were checked against the opinion text.
 */
export interface ProceduralAuthority {
  id: string
  cite: string
  /** What it establishes, in the motion's terms. */
  proposition: string
  /** Verbatim. */
  quote: string
  /** What the motion does with it. */
  use: string
  verified: true
}

export const PROCEDURAL_AUTHORITIES: ProceduralAuthority[] = [
  {
    id: 'nrcp-56a',
    cite: 'NRCP 56(a)',
    proposition:
      'A party may move for summary judgment on part of a claim or defense, and the court must grant it where there is no genuine dispute of material fact and the movant is entitled to judgment as a matter of law.',
    quote:
      'A party may move for summary judgment, identifying each claim or defense—or the part of each claim or defense—on which summary judgment is sought. The court shall grant summary judgment if the movant shows that there is no genuine dispute as to any material fact and the movant is entitled to judgment as a matter of law.',
    use: 'The authority for a motion this narrow. "The part of each claim or defense" is what lets us take the limitations defense off the board without touching ratification.',
    verified: true,
  },
  {
    id: 'nrcp-56c',
    cite: 'NRCP 56(c)(1)(A)',
    proposition:
      'A party asserting that a fact cannot be genuinely disputed must support the assertion by citing particular parts of the record, interrogatory answers included.',
    quote:
      'citing to particular parts of materials in the record, including depositions, documents, electronically stored information, affidavits or declarations, stipulations (including those made for purposes of the motion only), admissions, interrogatory answers, or other materials',
    use: 'Why Prine’s sworn answer to Interrogatory 4 is evidence on this motion and not just a debating point — and the same rule he will have to satisfy if he wants to propose a third accrual date.',
    verified: true,
  },
  {
    id: 'wood-standard',
    cite: 'Wood v. Safeway, Inc., 121 Nev. 724, 121 P.3d 1026 (2005)',
    proposition:
      'Summary judgment is appropriate where the record shows no genuine issue of material fact; the substantive law decides which disputes are material, and a dispute is genuine only where a rational trier of fact could find for the nonmovant.',
    quote:
      'The substantive law controls which factual disputes are material and will preclude summary judgment; other factual disputes are irrelevant.',
    use: 'The sentence the whole motion rests on. The parties genuinely disagree about what Dermot knew, and that disagreement is immaterial to a three-year period no version of it exceeds.',
    verified: true,
  },
  {
    id: 'wood-genuine',
    cite: 'Wood v. Safeway, Inc., 121 Nev. 724, 121 P.3d 1026 (2005)',
    proposition:
      'A factual dispute defeats summary judgment only where the evidence would let a rational trier of fact find for the party opposing the motion.',
    quote:
      'A factual dispute is genuine when the evidence is such that a rational trier of fact could return a verdict for the nonmoving party.',
    use: 'The other half, and the reason we are not moving on ratification: on that issue the evidence would let a rational juror find for Prine, which is exactly when Rule 56 is the wrong tool.',
    verified: true,
  },
]

/* --------------------------------------------------------- the undisputed facts */

export interface UndisputedFact {
  /** Its number in the motion, so the page and the PDF can be read side by side. */
  number: number
  fact: string
  /** The record citation as the motion states it. */
  cite: string
  /**
   * The interrogatory this fact rests on, where it rests on one. Checked at
   * import against `discovery.ts`, so a fact cannot cite a question that does
   * not exist.
   */
  anchor?: string
  /** Whether Prine has any reason to fight it. */
  contested: boolean
}

export const UNDISPUTED_FACTS: UndisputedFact[] = [
  {
    number: 1,
    fact: 'Prine offered the doughnut over the hedge, described it as "neat", and has sworn he cannot recall every other word of the exchange.',
    cite: 'Def.’s Resp. to Pl.’s First Set of Interrogs., No. 1',
    anchor: 'rog-1',
    contested: false,
  },
  {
    number: 2,
    fact: 'Dermot ate part of the doughnut on 1 April 2025 and the remainder on 14 April 2026.',
    cite: 'First Am. Compl. ¶¶ 6, 11',
    contested: false,
  },
  {
    number: 3,
    fact: 'Dermot first learned of the term purporting to convey his soul on 14 April 2026.',
    cite: 'First Am. Compl. ¶ 13; Aff. of Odile Cruller ¶¶ 4–7',
    contested: true,
  },
  {
    number: 4,
    fact: 'Prine has sworn that the date he first contended the soul had been conveyed to him was 14 April 2026.',
    cite: 'Def.’s Resp. to Pl.’s First Set of Interrogs., No. 4',
    anchor: 'rog-4',
    contested: true,
  },
  {
    number: 5,
    fact: 'Notice of rescission was served seventeen days after 14 April 2026.',
    cite: 'Notice of Rescission, served 2 May 2026',
    contested: false,
  },
  {
    number: 6,
    fact: 'Count II was added to the action by amendment on 3 August 2026.',
    cite: 'First Am. Compl., filed 3 Aug. 2026',
    contested: false,
  },
  {
    number: 7,
    fact: 'Prine’s answer pleads the statute of limitations as his Third Affirmative Defense.',
    cite: 'Answer to First Am. Compl., filed 10 Aug. 2026',
    contested: false,
  },
]

/** The two facts Prine has an interest in fighting — and which the motion survives anyway. */
export const CONTESTED_FACTS: UndisputedFact[] = UNDISPUTED_FACTS.filter((item) => item.contested)

/* ----------------------------------------------------------- what we did not ask */

export interface ReservedIssue {
  id: string
  defense: string
  question: string
  /** Why it cannot be decided on paper. */
  why: string
  /** Where it goes instead. */
  destination: string
}

/**
 * The part of the fight this motion deliberately leaves alone.
 *
 * Rendered on the page rather than left in a comment, because it is the thing a
 * client is most likely to misread about a granted motion: winning the
 * limitations defense is not winning the case, and the motion says so on its
 * face in Part IV.C rather than letting the client discover it later.
 */
export const RESERVED: ReservedIssue[] = [
  {
    id: 'ratification',
    defense: 'Fourth Affirmative Defense — waiver and ratification',
    question: 'Did Dermot affirm the instrument by finishing the doughnut?',
    why: 'It turns on when he learned of the soul term, which is the one fact in the matter that is genuinely disputed and is supported on both sides by more than speculation. Under Wood that is precisely the dispute a trier of fact has to resolve.',
    destination: 'The jury, at trial — and the deposition on 6 October 2026 is where his account of it is first taken under oath.',
  },
]

/* -------------------------------------------------------------- the page strip */

export const MOTION_FACTS: StatusCell[] = [
  { label: 'Filed', value: MOTION.filed.label },
  { label: 'Heard', value: `${MOTION.hearing.label} — ${DAYS_TO_HEARING} days` },
  { label: 'Aimed at', value: '1 of 2 defenses' },
  { label: 'Margin', value: `${NARROWEST_MARGIN} days to spare` },
]

/* -------------------------------------------------------------------- guards */

/**
 * The module checks its own argument at import.
 *
 * Each of these has a way of going wrong that renders perfectly well. A fact
 * citing an interrogatory that no longer exists still prints. An accrual date
 * whose three years had already run when Count II was filed still prints — and
 * the page would go on asserting that the defense fails on every candidate date
 * while carrying a counter-example. The motion's argument is arithmetic, so the
 * arithmetic is where the guard belongs.
 */
for (const fact of UNDISPUTED_FACTS) {
  if (fact.anchor && !INTERROGATORIES.some((rog) => rog.id === fact.anchor)) {
    throw new Error(`motion.ts: fact ${fact.number} cites "${fact.anchor}", which is not in discovery.ts`)
  }
}

UNDISPUTED_FACTS.forEach((fact, index) => {
  if (fact.number !== index + 1) {
    throw new Error(`motion.ts: fact ${fact.number} is at position ${index + 1}`)
  }
})

for (const entry of ACCRUAL_CANDIDATES) {
  if (entry.marginDays <= 0) {
    throw new Error(
      `motion.ts: three years from ${entry.label} expired on ${entry.expiryLabel}, before Count II was filed on ${MOTION.countFiled.label} — the motion's argument does not hold`,
    )
  }
  if (entry.iso > MOTION.countFiled.iso) {
    throw new Error(`motion.ts: accrual candidate ${entry.id} postdates the filing of Count II`)
  }
}

if (MOTION.filed.iso <= MOTION.answered.iso) {
  throw new Error('motion.ts: the motion is filed no later than the answer that raised the defense')
}

if (DAYS_TO_HEARING <= 0) {
  throw new Error('motion.ts: the hearing is not in the future of MOTION.asOf')
}
