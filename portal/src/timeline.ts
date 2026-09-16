// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DOCUMENTS, type MatterDocument } from './documents'
import { MOTION } from './motion'
import { INBOUND } from './responses'
import { PROCEEDING } from './discovery'
import { CHRONOLOGY } from './soulContract'
import { PREP } from './trialPrep'
import type { FeedAccent } from './types'

/**
 * The docket, as one scroll — what has happened in *Cruller v. Prine* since the
 * complaint was filed, and what is still on the calendar.
 *
 * This is not a second copy of the chronology on the Count II page. That one is
 * the **factual** story the count turns on: a hedge, a doughnut, two bites a
 * year apart. This one is the **procedural** story of the case file: a
 * complaint, a summons, service, discovery in both directions, an amendment, a
 * counterclaim, a motion, and three dates still ahead. A client reading the
 * factual chronology learns what the fight is about; a client reading this one
 * learns where the case is. They overlap at exactly two events — the second
 * bite and the day Dermot learned of the soul term — and those two are pulled
 * from `soulContract.ts` rather than restated here.
 *
 * **Every date below is derived, never typed.** Each entry's date comes from
 * the module that already owns it: `documents.ts` for anything with a rendered
 * PDF, `discovery.ts` and `responses.ts` for the two interrogatory exchanges,
 * `motion.ts` for the filing and the hearing, `trialPrep.ts` for the deposition
 * and the trial setting. A timeline that keeps its own copy of a date is a
 * timeline that disagrees with the page the reader clicks through to, and it
 * disagrees silently — both pages render perfectly while one of them is wrong.
 * The guards at the foot of this module enforce the rule the derivation is for:
 * the entries are in order, and nothing on the calendar is in the past.
 *
 * Fixture, like everything else in this repository. The court, the case number,
 * the parties, both firms, and every date are invented.
 */

/* ----------------------------------------------------------------- sources */

/** A date in both the form the code compares and the form a page prints. */
interface Dated {
  iso: string
  label: string
}

/**
 * A document by id, as a dated event.
 *
 * It throws rather than returning `undefined` because the failure it catches is
 * a rename in `documents.ts`: the entry would quietly vanish from the timeline
 * and the page would still render, one event short, with nothing to notice.
 */
function onFile(id: string): MatterDocument {
  const document = DOCUMENTS.find((entry) => entry.id === id)
  if (!document) {
    throw new Error(`timeline.ts: no document "${id}" in documents.ts`)
  }
  return document
}

/** An event from the Count II chronology, by id, for the two dates both pages share. */
function fromChronology(id: string): Dated {
  const post = CHRONOLOGY.find((entry) => entry.id === id)
  if (!post) {
    throw new Error(`timeline.ts: no chronology entry "${id}" in soulContract.ts`)
  }
  return { iso: post.date, label: post.dateLabel }
}

const SUMMONS = onFile('summons')
const ENGAGEMENT = onFile('engagement')
const NOTICE = onFile('notice')
const AFFIDAVIT = onFile('affidavit')
const ANSWER = onFile('answer')

/* ------------------------------------------------------------- the entries */

/**
 * Whose move it was.
 *
 * The timeline alternates sides on a wide screen, and a reader who cannot tell
 * at a glance which side of the caption an event came from is reading a list of
 * dates rather than a case history. So the side is a fact about the event, not
 * a position in the array: `us` and `them` are the two parties, `court` is the
 * court's own docket, and `both` is a thing the parties did together.
 */
export type Mover = 'us' | 'them' | 'court' | 'both'

/**
 * Where an entry sits relative to the day the file was last brought up to date.
 *
 * Stated rather than computed from `INBOUND.asOf`. The answer to the
 * counterclaim is dated after that moment and `documents.ts` already records it
 * as served, so a derived flag would put a served document on the wrong side of
 * the line — the record of what has been filed is the document's own status,
 * and the fixture's "today" is only a place to draw the marker.
 */
export type Standing = 'filed' | 'ahead'

export interface TimelineEntry {
  id: string
  /** ISO date (YYYY-MM-DD). Drives the `<time>` element and the ordering guard. */
  date: string
  /** Human-readable date, as the module that owns the date prints it. */
  dateLabel: string
  mover: Mover
  /** Who did it, in the name a client will recognize. */
  actor: string
  /** The second line under the actor — side, firm, capacity. */
  role: string
  /** One to three characters for the disc on the spine. */
  initials: string
  accent: FeedAccent
  /** The docket category, rendered as a badge. */
  kind: string
  title: string
  /** What happened, and why a client should care that it did. */
  body: string
  standing: Standing
  /** A rendered PDF in `documents.ts`, by id, where this event produced one. */
  document?: string
  /** Somewhere else in this portal that explains the event in full. */
  link?: { label: string; hash: string }
}

export const TIMELINE: TimelineEntry[] = [
  {
    id: 'complaint',
    date: SUMMONS.date,
    dateLabel: SUMMONS.dateLabel,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · through counsel',
    initials: 'DAC',
    accent: 'brand',
    kind: 'Complaint',
    title: 'The case is opened — trespass to land',
    body:
      'The complaint is filed in the Eighth Judicial District Court in Clark County and the case gets its number. One count only: Prine came across the hedge onto the Cruller lot. There is nothing about a doughnut in it yet, and nothing about a soul — that count arrives by amendment eighteen months later.',
    standing: 'filed',
  },
  {
    id: 'summons',
    date: SUMMONS.date,
    dateLabel: SUMMONS.dateLabel,
    mover: 'court',
    actor: 'Clerk of the Court',
    role: 'Served on Wendell Prine',
    initials: 'CT',
    accent: 'neutral',
    kind: 'Summons',
    title: 'The summons issues and is served on Prine',
    body:
      'A summons is the document that makes a lawsuit real for the person on the other end: it tells Prine a case has been filed against him, where it was filed, and that he has 21 days from service to answer it under NRCP 12(a)(1)(A). Everything after this date happens on a clock the court is keeping.',
    standing: 'filed',
    document: 'summons',
  },
  {
    id: 'second-bite',
    date: fromChronology('second-bite').iso,
    dateLabel: fromChronology('second-bite').label,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · at the refrigerator',
    initials: 'DAC',
    accent: 'warning',
    kind: 'Fact',
    title: 'The rest of the doughnut is eaten',
    body:
      'Fourteen months into a trespass case, and the fact that will start a second one. Prine calls finishing the doughnut an acceptance of the bargain he says it carried. It is the single most dangerous fact in the matter, and the Count II page is the argument about it.',
    standing: 'filed',
    link: { label: 'Read Count II', hash: '#introduction' },
  },
  {
    id: 'discovery-of-term',
    date: fromChronology('discovery').iso,
    dateLabel: fromChronology('discovery').label,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff',
    initials: 'DAC',
    accent: 'link',
    kind: 'Fact',
    title: 'Dermot learns of the soul term',
    body:
      'The day after the doughnut is gone. Two clocks start here rather than at the first bite — the three years the statute gives a fraud claim, and the knowledge that turns eating something into agreeing to it. Every argument in the case is downstream of this date.',
    standing: 'filed',
    link: { label: 'Why the date matters', hash: '#introduction' },
  },
  {
    id: 'engagement',
    date: ENGAGEMENT.date,
    dateLabel: ENGAGEMENT.dateLabel,
    mover: 'us',
    actor: 'Neon Law',
    role: 'Through Lawrence Lawyer',
    initials: 'NL',
    accent: 'brand',
    kind: 'Engagement',
    title: 'The engagement letter is signed',
    body:
      'Five days after Dermot learned of the term, and the reason anything after this date can be done "through counsel." The trespass count was already on file; the letter takes on the rescission claim and commits it to the arbitration the street\'s recorded covenants require these neighbors to hold.',
    standing: 'filed',
    document: 'engagement',
  },
  {
    id: 'notice',
    date: NOTICE.date,
    dateLabel: NOTICE.dateLabel,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · through counsel',
    initials: 'DAC',
    accent: 'success',
    kind: 'Notice',
    title: 'Notice of rescission is served',
    body:
      'Seventeen days after discovery of the term. A party who learns he was tricked and then sits on it can lose the right to unwind the deal at all, so the date on this document is doing real work: it is the proof that nobody sat on anything.',
    standing: 'filed',
    document: 'notice',
  },
  {
    id: 'affidavit',
    date: AFFIDAVIT.date,
    dateLabel: AFFIDAVIT.dateLabel,
    mover: 'us',
    actor: 'Odile Cruller',
    role: 'Daughter · percipient witness',
    initials: 'OC',
    accent: 'brand',
    kind: 'Affidavit',
    title: 'Odile’s notebook is sworn to',
    body:
      'A dated notebook is the only contemporaneous record of what Dermot knew and when, which makes it the most valuable piece of paper in the matter. The affidavit is still in draft — it is signed once the wording is settled, not before.',
    standing: 'filed',
    document: 'affidavit',
  },
  {
    id: 'rogs-served',
    date: PROCEEDING.served.iso,
    dateLabel: PROCEEDING.served.label,
    mover: 'us',
    actor: 'Neon Law',
    role: `Served on ${PROCEEDING.directedTo}`,
    initials: 'NL',
    accent: 'brand',
    kind: 'Discovery',
    title: `${PROCEEDING.set} goes out`,
    body:
      'Written questions Prine has to answer under oath. Discovery is where a case stops being two accounts of a hedge and starts being a record, and these are aimed at the two things only he can answer: what he said at the hedge, and what he says was inside the doughnut.',
    standing: 'filed',
    link: { label: 'Read the questions', hash: '#discovery' },
  },
  {
    id: 'responses-in',
    date: PROCEEDING.responded.iso,
    dateLabel: PROCEEDING.responded.label,
    mover: 'them',
    actor: 'Wendell Prine',
    role: 'Defendant · through Marrow & Stipe LLP',
    initials: 'WP',
    accent: 'danger',
    kind: 'Discovery',
    title: 'Prine answers — in part, and objects to the rest',
    body:
      'What came back is two documents stapled together: Prine answering under oath in his own voice, and his lawyer objecting in a lawyer’s voice. The discovery page splits every response into those two halves, because reading them as one is how a client concludes the other side admitted something it did not.',
    standing: 'filed',
    link: { label: 'Read the responses', hash: '#discovery' },
  },
  {
    id: 'amended',
    date: MOTION.countFiled.iso,
    dateLabel: MOTION.countFiled.label,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · by amendment',
    initials: 'DAC',
    accent: 'brand',
    kind: 'Amendment',
    title: 'Count II is added — rescission of the doughnut instrument',
    body:
      'The soul claim joins the trespass count already before the court, pleaded in the alternative: the court is asked to unwind the alleged bargain rather than to enforce anything. This is the count the rest of the portal is about.',
    standing: 'filed',
    link: { label: 'Read Count II', hash: '#introduction' },
  },
  {
    id: 'answer',
    date: MOTION.answered.iso,
    dateLabel: MOTION.answered.label,
    mover: 'them',
    actor: 'Wendell Prine',
    role: 'Defendant · through Marrow & Stipe LLP',
    initials: 'WP',
    accent: 'danger',
    kind: 'Answer',
    title: 'Prine answers Count II and counterclaims',
    body:
      'His answer denies the concealment and raises affirmative defenses, the third of which is that the claim was brought too late. He also counterclaims: the doughnut was a binding conveyance, he says, and Dermot is the one in breach of it.',
    standing: 'filed',
  },
  {
    id: 'conferred',
    date: PROCEEDING.conferred.iso,
    dateLabel: PROCEEDING.conferred.label,
    mover: 'both',
    actor: 'Both counsel',
    role: 'Meet and confer',
    initials: '↔',
    accent: 'neutral',
    kind: 'Conference',
    title: 'The two firms confer about the deficient responses',
    body:
      'Before a court is asked to make anybody answer a question, the lawyers have to try to settle it between themselves. That conversation happened on this date, and it is what a motion to compel would have to certify if the answers do not improve.',
    standing: 'filed',
    link: { label: 'What is still outstanding', hash: '#discovery' },
  },
  {
    id: 'inbound-rogs',
    date: INBOUND.served.iso,
    dateLabel: INBOUND.served.label,
    mover: 'them',
    actor: INBOUND.servedBy,
    role: `Served on ${INBOUND.directedTo}`,
    initials: 'MS',
    accent: 'danger',
    kind: 'Discovery',
    title: 'The same questions come back the other way',
    body:
      'Discovery runs in both directions, and this is the set aimed at you. The answers go back under your oath rather than ours, and they are answers you can be cross-examined on for the rest of the case — which is why the drafts are in this portal rather than in a file at the office.',
    standing: 'filed',
    link: { label: 'Review your drafts', hash: '#interrogatories' },
  },
  {
    id: 'msj',
    date: MOTION.filed.iso,
    dateLabel: MOTION.filed.label,
    mover: 'us',
    actor: 'Neon Law',
    role: `Filed on behalf of ${MOTION.movant}`,
    initials: 'NL',
    accent: 'brand',
    kind: 'Motion',
    title: 'Motion for partial summary judgment is filed',
    body:
      'One narrow request: throw out the too-late defense, because on every date the record supports the three years had not run. It deliberately does not ask the court to decide the part of the case that is genuinely disputed, and the motion page says why that restraint is the point.',
    standing: 'filed',
    link: { label: 'Read the motion', hash: '#motion' },
  },
  {
    id: 'answer-counterclaim',
    date: ANSWER.date,
    dateLabel: ANSWER.dateLabel,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · answering the counterclaim',
    initials: 'DAC',
    accent: 'success',
    kind: 'Answer',
    title: 'The counterclaim is answered',
    body:
      'Prine’s counterclaim gets the response every claim is entitled to, and the defenses on its face are the ones the notice of rescission already pleaded — this time aimed at defeating a claim rather than unwinding one.',
    standing: 'filed',
    document: 'answer',
  },
  {
    id: 'responses-due',
    date: INBOUND.due.iso,
    dateLabel: INBOUND.due.label,
    mover: 'us',
    actor: 'Dermot A. Cruller',
    role: 'Plaintiff · signing under oath',
    initials: 'DAC',
    accent: 'warning',
    kind: 'Deadline',
    title: 'Your interrogatory answers are due',
    body:
      'Thirty days from service, which is the rule rather than a date anybody chose. Some of the drafts are waiting on something only you can tell us, and a client who first reads his own sworn answers on the day they are due is a client signing whatever is in front of him.',
    standing: 'ahead',
    link: { label: 'Finish the drafts', hash: '#interrogatories' },
  },
  {
    id: 'hearing',
    date: MOTION.hearing.iso,
    dateLabel: MOTION.hearing.label,
    mover: 'court',
    actor: 'Eighth Judicial District Court',
    role: 'Department XVII',
    initials: 'CT',
    accent: 'link',
    kind: 'Hearing',
    title: 'The motion is heard',
    body:
      'Both sides argue the limitations defense and the court rules on that defense alone. A win here removes one of the two defenses in the case; it does not end the case, and the motion page is explicit about what it leaves standing.',
    standing: 'ahead',
    link: { label: 'What is at stake', hash: '#motion' },
  },
  {
    id: 'deposition',
    date: PREP.deposition.iso,
    dateLabel: PREP.deposition.label,
    mover: 'them',
    actor: PREP.examiner,
    role: 'Deposing Dermot A. Cruller',
    initials: 'HS',
    accent: 'danger',
    kind: 'Deposition',
    title: 'Dermot testifies for the first time',
    body:
      'Questions under oath, on the record, with no judge in the room. There is no practice version of it: the transcript can be read aloud to the jury at trial, so the answers given in a conference room in October are the answers given at trial in March. The flashcard deck is for this day.',
    standing: 'ahead',
    link: { label: 'Work through the deck', hash: '#trial-prep' },
  },
  {
    id: 'trial',
    date: PREP.trial.iso,
    dateLabel: PREP.trial.label,
    mover: 'court',
    actor: 'Eighth Judicial District Court',
    role: 'Trial setting',
    initials: 'CT',
    accent: 'neutral',
    kind: 'Trial',
    title: 'The case is set for trial',
    body:
      'The date the whole file is pointed at. Most cases resolve before one of these arrives, and the work between now and then is what decides whether this one does and on whose terms.',
    standing: 'ahead',
  },
]

/* -------------------------------------------------------------- the shape */

/** Everything already on file, in the order it happened. */
export const FILED: TimelineEntry[] = TIMELINE.filter((entry) => entry.standing === 'filed')

/** Everything still on the calendar. */
export const AHEAD: TimelineEntry[] = TIMELINE.filter((entry) => entry.standing === 'ahead')

/**
 * The next thing that happens, and the one a client should be reading about.
 *
 * `required` rather than a non-null assertion: an empty half of the timeline is
 * a real possibility — every date ahead eventually becomes a date behind — and
 * the page that reads this needs to fail at import rather than render "undefined
 * days".
 */
function required(entry: TimelineEntry | undefined, what: string): TimelineEntry {
  if (!entry) {
    throw new Error(`timeline.ts: the timeline has no ${what}`)
  }
  return entry
}

export const NEXT_EVENT: TimelineEntry = required(AHEAD[0], 'event still ahead')

/** Where the "today" marker goes — the fixture's present moment, as every other page counts it. */
export const AS_OF = INBOUND.asOf

/** Days from the fixture's present moment to the next event on the calendar. */
export const DAYS_TO_NEXT: number = Math.round(
  (Date.parse(`${NEXT_EVENT.date}T00:00:00Z`) - Date.parse(`${AS_OF.iso}T00:00:00Z`)) / 86_400_000,
)

/** The day the file opened, which is where this page starts. */
export const OPENED: TimelineEntry = required(TIMELINE[0], 'first event')

/** The strip under the page heading. */
export const TIMELINE_FACTS = [
  { label: 'Case opened', value: OPENED.dateLabel },
  { label: 'On file', value: `${FILED.length} events` },
  { label: 'Still ahead', value: `${AHEAD.length} dates` },
  { label: 'Next', value: `${NEXT_EVENT.dateLabel} — ${DAYS_TO_NEXT} days` },
]

/* -------------------------------------------------------------------- guards */

/**
 * The module checks itself at import.
 *
 * Both of these fail in the way this page is most likely to go wrong: quietly.
 * An entry that lands out of order still renders, in the wrong place, telling a
 * client the case happened in a sequence it did not. A calendar date that has
 * slipped into the past still renders, under a heading that calls it upcoming.
 * Neither is visible in a screenshot, so neither is caught by looking.
 */
TIMELINE.forEach((entry, index) => {
  const previous = TIMELINE[index - 1]
  if (previous && previous.date > entry.date) {
    throw new Error(
      `timeline.ts: ${entry.id} (${entry.date}) is listed after ${previous.id} (${previous.date})`,
    )
  }
  if (entry.standing === 'ahead' && entry.date <= AS_OF.iso) {
    throw new Error(`timeline.ts: ${entry.id} is marked ahead but falls on or before ${AS_OF.iso}`)
  }
  if (entry.document && !DOCUMENTS.some((document) => document.id === entry.document)) {
    throw new Error(`timeline.ts: ${entry.id} cites document "${entry.document}", which is not in documents.ts`)
  }
})

/**
 * Everything on file comes before everything ahead of it, so the "today" marker
 * is one line on the spine rather than a flag repeated down the page.
 */
if (TIMELINE.findIndex((entry) => entry.standing === 'ahead') < TIMELINE.length - AHEAD.length) {
  throw new Error('timeline.ts: a filed entry is listed after one that is still ahead')
}
