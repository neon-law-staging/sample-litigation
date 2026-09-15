// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PROCEEDING, RULES, type Rule, type Topic } from './discovery'
import type { StatusCell } from './types'

/**
 * The other direction: interrogatories served *on us*, and the responses being
 * drafted for them.
 *
 * `discovery.ts` is the set we served on Wendell Prine and what came back.
 * This module is the mirror of it — Defendant's first set to Dermot Cruller —
 * and it exists as a separate module because it is a different kind of
 * document at a different point in its life. Theirs is finished: it arrived,
 * it is signed, and the only open question is whether it is sufficient. Ours
 * is not finished. Nothing here has been served, nothing here is sworn, and
 * the page that renders it is a work queue rather than a record.
 *
 * That is the whole reason the client sees it. A response is due on a date
 * fixed by rule, one of the two signatures on it has to be the client's own,
 * and the answers he swears to are the answers he can be cross-examined on for
 * the rest of the case. A client who first reads his own interrogatory answers
 * on the day they are due is a client who signs whatever is in front of him.
 *
 * Two rules of the road carried over from `discovery.ts`, both load-bearing:
 *
 * 1. **The exchange is fixture and the rules are real.** Every interrogatory,
 *    draft answer, and objection below is invented, as is opposing counsel.
 *    `RESPONSE_RULES` is not: it is a selection from the verbatim quotes in
 *    `discovery.ts`, reused rather than restated, because a second copy of a
 *    quote is a second chance to get a rule wrong.
 * 2. **We do not draft objections we have argued are invalid.** We are
 *    pressing Interrogatory 3 of our own set against them on NRCP 33(a)(2) —
 *    that "calls for a legal conclusion" is not a ground. So the contention
 *    interrogatories below get answered, and where a draft response takes a
 *    position that has to square with one we have already taken, it says so in
 *    `consistency`. That field is the thing a dashboard is actually for: not a
 *    count of what is done, but a place where the two halves of one discovery
 *    fight can be read against each other before either becomes a filing.
 */

/* --------------------------------------------------------------- the clock */

/** A date in both the form the code compares and the form a page prints. */
export interface DatedEvent {
  iso: string
  label: string
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

/**
 * UTC midnight for an ISO date, so no arithmetic here depends on a time zone.
 *
 * A local-midnight `new Date('2026-08-14')` is a different instant west of
 * Greenwich than east of it, and a deadline that moves by a day depending on
 * where the reader is sitting is the kind of bug that is invisible in one
 * office and obvious in another. Everything below stays in UTC for that reason.
 */
function utcDay(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) throw new Error(`responses.ts: "${iso}" is not an ISO date`)
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function isoOf(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** "14 September 2026" — the form every date on the page is printed in. */
function longDate(date: Date): string {
  const month = MONTHS[date.getUTCMonth()]
  if (!month) throw new Error(`responses.ts: no month name for ${isoOf(date)}`)
  return `${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`
}

function dated(date: Date): DatedEvent {
  return { iso: isoOf(date), label: longDate(date) }
}

const DAY_MS = 86_400_000

/** Days between two ISO dates, both at UTC midnight, so never off by an hour. */
function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((utcDay(toIso).getTime() - utcDay(fromIso).getTime()) / DAY_MS)
}

/**
 * The response deadline, derived rather than written down.
 *
 * NRCP 33(b)(2) gives thirty days from service. Thirty days from Friday
 * 14 August 2026 is a Sunday, and a deadline that lands on a weekend runs to
 * the next day that is not one — so the date this page prints is a Monday that
 * nothing in the fixture states. Deriving it is the point: a due date typed
 * into a data file is a due date that stays put when somebody changes the date
 * of service, which is the one edit that must never leave it behind.
 *
 * The roll-forward here handles weekends only. A court holiday would also move
 * it, and a bundle that needed to be right about that would need a holiday
 * calendar rather than a smarter function.
 */
function responseDeadline(servedIso: string, days: number): DatedEvent {
  const date = new Date(utcDay(servedIso).getTime() + days * DAY_MS)
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return dated(date)
}

const SERVED_ON_US: DatedEvent = { iso: '2026-08-14', label: '14 August 2026' }

/**
 * Today, as far as this page is concerned.
 *
 * A live `new Date()` would make "25 days left" true for one day and a lie
 * afterwards, and would make every test that reads the number depend on when it
 * ran. The fixture has a present moment like it has every other date, and the
 * page says which one it is rather than implying it is now.
 */
const AS_OF: DatedEvent = { iso: '2026-08-20', label: '20 August 2026' }

/** The proceeding: their set, our clock. */
export const INBOUND = {
  set: 'Defendant’s First Set of Interrogatories',
  directedTo: 'Plaintiff Dermot A. Cruller',
  servedBy: 'Marrow & Stipe LLP',
  served: SERVED_ON_US,
  /** NRCP 33(b)(2). Thirty days, and the fixture's own weekend roll-forward. */
  responseWindowDays: 30,
  due: responseDeadline(SERVED_ON_US.iso, 30),
  asOf: AS_OF,
  /** The NRCP 33(a)(1) cap, the same one our own set was drafted against. */
  cap: PROCEEDING.cap,
} as const

/** Days left to serve the responses, as of `INBOUND.asOf`. */
export const DAYS_REMAINING: number = daysBetween(INBOUND.asOf.iso, INBOUND.due.iso)

/* -------------------------------------------------- who signs what, our side */

/**
 * The two signatures our response will carry, plus the one already on theirs.
 *
 * Named for what is certified rather than for who certifies it, which is the
 * distinction the client needs: one of these is an oath and the others are not.
 * `discovery.ts` models the same three roles from the other side of the
 * exchange — there they describe a document that exists, here they describe one
 * that does not yet.
 */
export interface Certification {
  id: 'answers' | 'objections' | 'requests'
  name: string
  affiliation: string
  side: 'Plaintiff' | 'Defendant'
  /** What this signature will certify, and what it will not. */
  certifies: string
}

export const CERTIFICATIONS: Certification[] = [
  {
    id: 'answers',
    name: 'Dermot A. Cruller',
    affiliation: 'In his own person',
    side: 'Plaintiff',
    certifies:
      'Will sign the answers, under oath, and nothing else. NRCP 33(b)(5) puts that signature on the client rather than on the firm, which is why no draft below is finished until he has read it in his own words and said it is true — every answer he swears to is an answer he can be cross-examined on at a deposition and at trial.',
  },
  {
    id: 'objections',
    name: 'Lawrence Lawyer',
    affiliation: 'Neon Law',
    side: 'Plaintiff',
    certifies:
      'Will sign the objections, and swears to nothing by doing it. An objection is a legal position taken on the client’s behalf; the client does not adopt it and cannot be impeached with it.',
  },
  {
    id: 'requests',
    name: 'Hollis Stipe',
    affiliation: 'Marrow & Stipe LLP',
    side: 'Defendant',
    certifies:
      'Signed and served the set. Under NRCP 26(g) that signature certifies the requests were formed after a reasonable inquiry, which is the same certification our own set carries and the reason neither side gets to serve a fishing expedition.',
  },
]

function certification(id: Certification['id']): Certification {
  const found = CERTIFICATIONS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`responses.ts: no certification for "${id}"`)
  return found
}

export const CERTIFIER: Record<Certification['id'], Certification> = {
  answers: certification('answers'),
  objections: certification('objections'),
  requests: certification('requests'),
}

/* --------------------------------------------------------------- the rules */

/**
 * The rules a *response* is measured against, reused from `discovery.ts`.
 *
 * Selected by id rather than re-quoted. `Rule.verified` means the quote came
 * from the rule's text and not from memory, and that promise cannot be kept by
 * a second transcription of the same sentence in a second file. The order is
 * the order the work happens in: the clock, the duty to answer, what an
 * objection has to do to count, who signs, when a contention may wait, and the
 * one option we are declining to use.
 */
const RESPONSE_RULE_IDS = [
  'time',
  'fully',
  'specificity',
  'signature',
  'contention',
  'records',
] as const

function rule(id: string): Rule {
  const found = RULES.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`responses.ts: cites rule "${id}", which is not in discovery.ts`)
  return found
}

export const RESPONSE_RULES: Rule[] = RESPONSE_RULE_IDS.map(rule)

/* ------------------------------------------------------- the response state */

/** What our response will do with the interrogatory, structurally. */
export type Stance = 'answer' | 'answer-over-objection' | 'answer-in-part' | 'objection-only'

/** How far along the draft is, and who it is waiting on. */
export type Readiness = 'ready' | 'needs-client' | 'needs-firm'

/** Who owes the next piece of work on a draft that is not ready. */
export type Owner = 'client' | 'firm'

/** One objection we intend to serve, with the rule it stands on. */
export interface DraftObjection {
  ground: string
  /** How it will read in the served response. */
  stated: string
  /** The rule in `RESPONSE_RULES` it stands or falls on, where one does. */
  rule?: string
}

export interface DraftResponse {
  id: string
  /** Its number in their set. Sequential, and checked at import. */
  number: number
  topic: Topic
  /** The interrogatory as they served it. */
  asked: string
  /** Objections counsel will sign. Empty where we are raising none. */
  objections: DraftObjection[]
  /** The draft answer for the client's oath. `null` where we answer by objection alone. */
  answer: string | null
  stance: Stance
  readiness: Readiness
  /** Why the draft is written the way it is. Firm's voice, not part of the response. */
  note: string
  /** What is still needed, and from whom. Required where `readiness` is not `ready`. */
  outstanding?: { owner: Owner; task: string }
  /** Where this draft has to square with a position we have already taken. */
  consistency?: string
}

/**
 * Their set, in the order served, with our drafts under each.
 *
 * Read top to bottom it is the defense of Count II put as questions: you ate
 * it, so you affirmed it; you cannot say when you learned anything; you have no
 * damages; you have no instrument; and the one document you do have is a
 * teenager's notebook. Four of the eight are aimed at the 378 days, which is
 * where this count is genuinely weakest.
 */
export const RECEIVED: DraftResponse[] = [
  {
    id: 'in-1',
    number: 1,
    topic: 'ratification',
    asked:
      'State each fact upon which You contend that consuming the remainder of the doughnut on 14 April 2026 did not affirm the agreement alleged in the Amended Complaint.',
    objections: [],
    answer:
      'I ate the rest of it because I was hungry and it was in the refrigerator. Nobody had told me anything about a soul, and I did not know there was a term in it. If I had known, I would not have touched it. My son Linus was in the kitchen and I said nothing about any agreement, because there was nothing to say.',
    stance: 'answer',
    readiness: 'ready',
    note:
      'The most dangerous question in the set answered without an objection, deliberately. It is a contention interrogatory, and we have just finished telling them that under NRCP 33(a)(2) an interrogatory is not objectionable merely for asking one — so we answer it, in his own register, and let the answer do the work. The value of an unhedged answer here is that it puts his state of mind on the record before he is deposed on it.',
    consistency:
      'We are moving to compel on Interrogatory 3 of our own set precisely because counsel answered a contention question with an objection and nothing else. An objection here would hand that motion back to them.',
  },
  {
    id: 'in-2',
    number: 2,
    topic: 'knowledge',
    asked:
      'State the date, time, and manner in which You first learned of the term alleged in Paragraph 8 of the Amended Complaint, and identify each person who communicated it to You.',
    objections: [],
    answer: null,
    stance: 'answer',
    readiness: 'needs-client',
    note:
      'The pivot of the whole count, and the one answer that cannot be drafted from the file. Everything downstream of 15 April 2026 depends on it: the notice of rescission served on 2 May is prompt because of that date, and the ratification defense fails on that date. It has to be his account, in his words, and it has to be exact — Odile’s notebook is going to be read against it line by line, and a sworn answer that misses the day by one is the best cross-examination the defense will get.',
    outstanding: {
      owner: 'client',
      task:
        'Tell us exactly how you learned about the term on 15 April 2026 — where you were, what time of day, who said it or what you read, and who else was in the room. If you are not certain of the time, say so; a sworn "I do not recall the hour" costs nothing and a guess that turns out wrong costs a great deal.',
    },
  },
  {
    id: 'in-3',
    number: 3,
    topic: 'damages',
    asked:
      'Itemize each element of damage You claim in this action, stating the amount claimed and the method by which each amount was computed.',
    objections: [
      {
        ground: 'Assumes a claim not pleaded',
        stated:
          'Plaintiff objects to the extent the interrogatory assumes Count II seeks money damages. Count II seeks rescission and cancellation of the alleged instrument, which is equitable relief and is not computed.',
        rule: 'specificity',
      },
    ],
    answer:
      'I am not asking for money on the soul count. What I want is the thing undone. On the trespass count my out-of-pocket losses are the hedge repairs, and I will provide the receipts.',
    stance: 'answer-over-objection',
    readiness: 'needs-firm',
    note:
      'The objection is narrow on purpose, and it is stated with the specificity NRCP 33(b)(4) requires: not "overbroad" but a sentence saying which assumption is wrong and why. Then the question gets answered anyway, because the part of it that is fair — what do you actually want — is a question we want on the record.',
    outstanding: {
      owner: 'firm',
      task:
        'Confirm whether any incidental out-of-pocket loss is claimed on Count II, and reconcile the trespass figures against the hedge-repair receipts before this answer goes out. An itemization served without a number in it is one we cannot add a number to later without explaining ourselves.',
    },
  },
  {
    id: 'in-4',
    number: 4,
    topic: 'records',
    asked:
      'Identify each document in Your possession, custody, or control concerning the doughnut or the alleged agreement, including any notebook, diary, or journal.',
    objections: [],
    answer: null,
    stance: 'answer',
    readiness: 'needs-client',
    note:
      'We identify the documents rather than invite them to come and look, which is the same distinction we are pressing against them on their Interrogatory 7. NRCP 33(d) exists and we are not using it: it is for business records where the burden of deriving the answer is substantially the same for either party, and a family notebook is neither. So this answer needs to list the notebook by author and date range, the affidavit already on file, and the engagement letter — by category and date, not as a box.',
    outstanding: {
      owner: 'client',
      task:
        'Bring Odile’s notebook in so we can identify it properly — we need the first and last dates it covers and how many pages carry entries. Do not tidy it, do not copy the relevant pages out, and do not remove anything: a document altered after a claim is filed is a problem far larger than whatever the alteration was meant to fix.',
    },
    consistency:
      'Their Interrogatory 7 answered a document request with an invitation to search a box in a garage. We told them that is not what NRCP 33(d) provides for. Our own document answer has to be the thing we said theirs should have been.',
  },
  {
    id: 'in-5',
    number: 5,
    topic: 'formation',
    asked:
      'State whether You consumed any portion of the doughnut with knowledge that Prine expected anything in return, and if so, identify what You understood was expected.',
    objections: [],
    answer:
      'No. He handed it over the hedge and said it was neat. I understood it the way you understand a neighbor handing you a doughnut — that he had made too many. Nothing was expected of me and nothing was asked of me, on 1 April 2025 or at any time afterwards.',
    stance: 'answer',
    readiness: 'ready',
    note:
      'Short, complete, and it forecloses the argument the question was built for. It also sits comfortably beside his sworn answer on their own set: Prine has already sworn he never mentioned a soul to Cruller and never raised the doughnut again in a year of talking over that hedge.',
  },
  {
    id: 'in-6',
    number: 6,
    topic: 'concealment',
    asked:
      'State each fact upon which You base the allegation that a writing was contained within the doughnut, and identify each person who observed that writing.',
    objections: [],
    answer:
      'There was lettering on the underside of the glaze. I noticed it on 1 April 2025 and could not read it, and I did not think about it again until the term was explained to me. My daughter Odile wrote it down in her notebook that day. The doughnut is gone, so what is left is her notebook and what I saw.',
    stance: 'answer',
    readiness: 'ready',
    note:
      'The weakest link in the count, answered squarely rather than hedged. The instrument was eaten, which means the concealment allegation rests on a contemporaneous note and one witness’s recollection — and the honest answer says exactly that. An answer that overstated the evidence here would be the first thing read back to him at trial.',
  },
  {
    id: 'in-7',
    number: 7,
    topic: 'knowledge',
    asked:
      'Identify each person to whom You have stated that Your soul had been conveyed to Prine, and state what You said to each.',
    objections: [
      {
        ground: 'Attorney–client privilege and work product',
        stated:
          'Plaintiff objects to the extent the interrogatory seeks the substance of communications with counsel or materials prepared in anticipation of litigation. Subject to that objection, Plaintiff answers as to communications with all other persons.',
      },
    ],
    answer:
      'Only my own household, and only after 15 April 2026: my wife Beatrix, and my children Odile and Linus. I told them what had been explained to me and that I had gone to a lawyer about it. I have never said it to Prine and I have not said it to anybody outside the house.',
    stance: 'answer-in-part',
    readiness: 'ready',
    note:
      'The mirror image of the objection counsel served on our own Interrogatory 4, and it is proper for exactly the same reason it was proper there. Worth the client knowing that this is what a privilege objection looks like when it is used correctly: it withholds one category, names it, and answers everything else.',
    consistency:
      'We asked counsel for a privilege log on the communications withheld from their Interrogatory 4. We should expect to produce one here, which is a reason to keep the withheld category narrow.',
  },
  {
    id: 'in-8',
    number: 8,
    topic: 'knowledge',
    asked:
      'State the substance of each communication between You and Neon Law concerning the alleged agreement, including the date of each communication and the advice given.',
    objections: [
      {
        ground: 'Attorney–client privilege and work product',
        stated:
          'The interrogatory seeks the substance of privileged attorney–client communications and attorney work product in their entirety. There is no part of it that can be answered without disclosing privileged material, and Plaintiff answers by objection alone. Plaintiff will produce a privilege log identifying the withheld communications by date and participants.',
      },
    ],
    answer: null,
    stance: 'objection-only',
    readiness: 'ready',
    note:
      'The one response in the set that is an objection and nothing else, and the only kind of interrogatory that justifies one: every word of the answer would be privileged, so there is no part left over to answer "to the extent it is not objected to." That is the line NRCP 33(b)(3) draws, and it is the same line their Interrogatory 3 fell on the wrong side of — a partly objectionable question still has to be answered as far as it reaches. The privilege log is what turns this from an assertion into a list, which is precisely what we demanded of them.',
  },
]

/* ------------------------------------------------------ derived, not typed */

/** How many drafts sit at each stage. */
export const READINESS_COUNTS: Record<Readiness, number> = {
  ready: 0,
  'needs-client': 0,
  'needs-firm': 0,
}

/** How many responses take each structural stance. */
export const STANCE_COUNTS: Record<Stance, number> = {
  answer: 0,
  'answer-over-objection': 0,
  'answer-in-part': 0,
  'objection-only': 0,
}

for (const response of RECEIVED) {
  READINESS_COUNTS[response.readiness] += 1
  STANCE_COUNTS[response.stance] += 1
}

/** Every response we intend to object to, whatever else it does. */
export const OBJECTING_COUNT: number = RECEIVED.filter(
  (response) => response.objections.length > 0,
).length

/**
 * What the two sides still owe, in the order the work has to happen.
 *
 * Derived from the drafts rather than kept as a second list, so an item that
 * stops being outstanding stops appearing here the moment its draft changes.
 */
export interface Outstanding {
  id: string
  number: number
  owner: Owner
  task: string
}

export const OUTSTANDING: Outstanding[] = RECEIVED.flatMap((response) =>
  response.outstanding
    ? [
        {
          id: response.id,
          number: response.number,
          owner: response.outstanding.owner,
          task: response.outstanding.task,
        },
      ]
    : [],
)

/** What the client, specifically, has to do. The reason this page is client-facing. */
export const CLIENT_TASKS: Outstanding[] = OUTSTANDING.filter((item) => item.owner === 'client')

/** The strip under the page heading. */
export const RESPONSE_FACTS: StatusCell[] = [
  { label: 'Served on us', value: INBOUND.served.label },
  { label: 'Responses due', value: INBOUND.due.label },
  { label: 'Days left', value: `${DAYS_REMAINING} — as of ${INBOUND.asOf.label}` },
  {
    label: 'Drafts ready',
    value: `${READINESS_COUNTS.ready} of ${RECEIVED.length}`,
  },
]

/**
 * The data checks its own story at import.
 *
 * The same reasoning as the guard at the foot of `discovery.ts`: each of these
 * mistakes renders as a perfectly convincing page. A draft that says it is
 * waiting on the client without saying what for is a work queue that cannot be
 * worked; a response that claims to be objection-only while carrying an answer
 * is a page that contradicts itself in two places a reader will not compare.
 */
RECEIVED.forEach((response, index) => {
  if (response.number !== index + 1) {
    throw new Error(
      `responses.ts: ${response.id} is numbered ${response.number} at position ${index + 1}`,
    )
  }
  if (response.stance === 'objection-only' && response.answer !== null) {
    throw new Error(`responses.ts: ${response.id} answers by objection alone and carries an answer`)
  }
  if (response.stance === 'objection-only' && response.objections.length === 0) {
    throw new Error(`responses.ts: ${response.id} answers by objection alone with no objection`)
  }
  if (response.stance === 'answer' && response.objections.length > 0) {
    throw new Error(`responses.ts: ${response.id} claims a clean answer over ${response.objections.length} objection(s)`)
  }
  if (response.stance !== 'objection-only' && response.readiness === 'ready' && response.answer === null) {
    throw new Error(`responses.ts: ${response.id} is ready to sign with nothing drafted to sign`)
  }
  if (response.readiness !== 'ready' && !response.outstanding) {
    throw new Error(`responses.ts: ${response.id} is not ready and does not say what it is waiting on`)
  }
  if (response.readiness === 'ready' && response.outstanding) {
    throw new Error(`responses.ts: ${response.id} is ready and still carries outstanding work`)
  }
  for (const objection of response.objections) {
    if (objection.rule && !RESPONSE_RULES.some((entry) => entry.id === objection.rule)) {
      throw new Error(
        `responses.ts: ${response.id} cites rule "${objection.rule}", which is not in RESPONSE_RULES`,
      )
    }
  }
})

if (RECEIVED.length > INBOUND.cap) {
  throw new Error(
    `responses.ts: ${RECEIVED.length} interrogatories exceeds the NRCP 33(a)(1) cap of ${INBOUND.cap}`,
  )
}

if (DAYS_REMAINING <= 0) {
  throw new Error('responses.ts: the response deadline is not in the future of INBOUND.asOf')
}
