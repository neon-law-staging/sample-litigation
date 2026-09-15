// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { StatusCell } from './types'

/**
 * The discovery exchange — Plaintiff's first set of interrogatories, and what
 * came back.
 *
 * Two things are being simulated here, and the page exists because they are
 * different things. An interrogatory response is not one document written by
 * one person: under NRCP 33(b)(5) the party signs the answers and the attorney
 * signs the objections, so what arrives is two voices stapled together. Wendell
 * Prine answers under oath, in his own register, about a hedge and a doughnut.
 * His counsel objects in the register of a lawyer preserving grounds. Reading a
 * response without knowing which voice is speaking is how a client concludes
 * the other side admitted something it did not.
 *
 * So every entry below carries both, attributed, plus the third thing a client
 * actually needs: what it leaves us with, and what we do next.
 *
 * **The exchange is fixture. The rules are real.** The interrogatories, the
 * answers, the objections, the dates, and opposing counsel are invented, like
 * everything else in this repository. `RULES` is not: each quote is verbatim
 * from the Nevada Rules of Civil Procedure as amended effective 1 March 2019,
 * and the page cites them because the whole point of the deficient response
 * below is a rule that says in terms why the objection does not hold. Compare
 * `research.ts`, which draws the same line for case law.
 */

/* ------------------------------------------------------------- the parties */

/** Who signed what. The three roles a written discovery exchange has. */
export interface Signer {
  id: 'firm' | 'counsel' | 'party'
  name: string
  /** Firm or affiliation, as it would appear on the signature block. */
  affiliation: string
  /** Whose side, in a word a client will recognize. */
  side: 'Plaintiff' | 'Defendant'
  /** What this signature certifies. */
  signs: string
}

/**
 * The signature blocks.
 *
 * Opposing counsel is invented for the fixture — Nevada has no Marrow & Stipe
 * and no Hollis Stipe, and inventing them is deliberate: a sample matter that
 * names a real firm as the adversary in a simulated soul-conveyance dispute is
 * a sample matter with a problem. The firm side is the seeded lawyer from
 * `people.ts`, because that is who a contributor signs in as.
 */
export const SIGNERS: Signer[] = [
  {
    id: 'firm',
    name: 'Lawrence Lawyer',
    affiliation: 'Neon Law',
    side: 'Plaintiff',
    signs:
      'Served the interrogatories, and signed the set. Under NRCP 26(g) that signature certifies the requests were formed after a reasonable inquiry — a discovery request is a certification, not a wish list.',
  },
  {
    id: 'counsel',
    name: 'Hollis Stipe',
    affiliation: 'Marrow & Stipe LLP',
    side: 'Defendant',
    signs:
      'Signed the objections, and only the objections. Where an answer follows an objection, counsel drafted the framing and the client swore to the content.',
  },
  {
    id: 'party',
    name: 'Wendell Prine',
    affiliation: 'In his own person',
    side: 'Defendant',
    signs:
      'Signed the answers, under oath. He is the one who can be impeached with them at a deposition or at trial, which is why the answers read like a neighbor talking and not like a brief.',
  },
]

/**
 * Lookup by role, so a component never indexes into the array by position.
 *
 * Written out rather than folded from `SIGNERS`, because a `Record` built by
 * reduction is a `Record` the compiler has to be told about with a cast — and a
 * cast is exactly how a missing signature block reaches the page as
 * `undefined.name`. Three named lookups that throw at import cannot.
 */
function signatureBlock(id: Signer['id']): Signer {
  const found = SIGNERS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`discovery.ts: no signature block for "${id}"`)
  return found
}

export const SIGNER: Record<Signer['id'], Signer> = {
  firm: signatureBlock('firm'),
  counsel: signatureBlock('counsel'),
  party: signatureBlock('party'),
}

/* -------------------------------------------------------------- the rules */

/**
 * A rule the exchange turns on, quoted rather than paraphrased.
 *
 * `verified: true` carries the same promise it carries in `research.ts`: the
 * quote is the rule's own words, retrieved from the text and not remembered.
 * A paraphrase would be easier to read and would be the thing a reader then
 * relies on without knowing they are relying on us.
 */
export interface Rule {
  id: string
  cite: string
  /** Verbatim from the rule. */
  quote: string
  /** Why this exchange needed it. */
  bearing: string
  url: string
  verified: true
}

export const RULES: Rule[] = [
  {
    id: 'number',
    cite: 'NRCP 33(a)(1)',
    quote:
      'Unless otherwise stipulated or ordered by the court, a party may serve on any other party no more than 40 written interrogatories, including all discrete subparts.',
    bearing:
      'Why the set is eight questions and not eighty. The cap counts discrete subparts, so an interrogatory drafted with four clauses spends four of the forty — which is the discipline behind every "State" and "Identify" below carrying exactly one demand.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
  {
    id: 'contention',
    cite: 'NRCP 33(a)(2)',
    quote:
      'An interrogatory is not objectionable merely because it asks for an opinion or contention that relates to fact or the application of law to fact, but the court may order that the interrogatory need not be answered until designated discovery is complete, or until a pretrial conference or some other time.',
    bearing:
      'The rule that decides two of the responses below. "Calls for a legal conclusion" is not a ground on its own — the rule says so in terms. What the rule does allow is a *timing* order, which no one has asked for here, so the answer is due now.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
  {
    id: 'time',
    cite: 'NRCP 33(b)(2)',
    quote:
      'The responding party must serve its answers and any objections within 30 days after being served with the interrogatories.',
    bearing:
      'The clock on this page. Thirty days from 25 June 2026 ran to a Saturday; the responses arrived on the Monday.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
  {
    id: 'fully',
    cite: 'NRCP 33(b)(3)',
    quote:
      'Each interrogatory must be set out, and, to the extent it is not objected to, be answered separately and fully in writing under oath.',
    bearing:
      'Why an objection is not an exit. "To the extent it is not objected to" is what makes a subject-to-objection answer the norm rather than a courtesy — and it is the sentence to quote back when an objection arrives with nothing behind it.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
  {
    id: 'specificity',
    cite: 'NRCP 33(b)(4)',
    quote:
      'The grounds for objecting to an interrogatory must be stated with specificity. Any ground not stated in a timely objection is waived unless the court, for good cause, excuses the failure.',
    bearing:
      'Cuts both ways, which is why counsel here objects at length. Every ground not raised on 27 July 2026 is gone; that is the incentive that produces a wall of boilerplate in real practice, and the specificity requirement is the counterweight.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
  {
    id: 'signature',
    cite: 'NRCP 33(b)(5)',
    quote:
      'The person who makes the answers must sign them, and the attorney who objects must sign any objections.',
    bearing:
      'The reason this page has two voices in it. One document, two signatures, two different things being certified — and only one of them is sworn.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
  {
    id: 'records',
    cite: 'NRCP 33(d)',
    quote:
      'If the answer to an interrogatory may be determined by examining, auditing, compiling, abstracting, or summarizing a party’s business records (including electronically stored information), and if the burden of deriving or ascertaining the answer will be substantially the same for either party, the responding party may answer by: (1) specifying the records that must be reviewed, in sufficient detail to enable the interrogating party to locate and identify them as readily as the responding party could.',
    bearing:
      'Invoked below over a shoebox. The option is real, and it is conditioned: business records, and a burden substantially the same for either party. Neither condition is met by a natural person inviting the other side to come and look through his garage.',
    url: 'https://www.leg.state.nv.us/CourtRules/NRCP.html#NRCPRule33',
    verified: true,
  },
]

/* ----------------------------------------------------------- the exchange */

/** What the response did with the question, structurally. */
export type ResponseKind =
  | 'answered'
  | 'answered-over-objection'
  | 'answered-in-part'
  | 'objection-only'

/** Our read on whether the response discharged the obligation. */
export type Sufficiency = 'sufficient' | 'partial' | 'deficient'

/**
 * Which issue in the case an interrogatory is aimed at.
 *
 * One vocabulary, shared by both directions of the exchange: `responses.ts`
 * labels the set served *on* us from this same union, so a topic means the same
 * thing on both pages. `damages` appears only there, because a defendant asks
 * what the plaintiff wants and a plaintiff has no occasion to ask it back.
 */
export type Topic =
  | 'formation'
  | 'aspect'
  | 'concealment'
  | 'knowledge'
  | 'ratification'
  | 'records'
  | 'damages'

/** One ground of objection, as counsel stated it. */
export interface Objection {
  /** The ground, in the words a response uses. */
  ground: string
  /** What counsel said in support of it. */
  stated: string
  /** The rule in `RULES` the ground stands or falls on, where one does. */
  rule?: string
}

export interface Interrogatory {
  id: string
  /** Its number in the set. Sequential, and checked at import. */
  number: number
  topic: Topic
  /** The interrogatory as served. */
  asked: string
  /** Objections, signed by counsel. Empty where none was raised. */
  objections: Objection[]
  /** The answer, sworn by the party. `null` where the response was objection only. */
  answer: string | null
  kind: ResponseKind
  /** What it leaves us with, and what we do about it. */
  assessment: {
    sufficiency: Sufficiency
    note: string
    /** The next step, where the response calls for one. */
    followUp?: string
  }
}

/**
 * The set, in the order served.
 *
 * Ordered by what the case turns on rather than by importance: the words first,
 * then the aspect, then what was never said aloud, then the year of silence.
 * Read top to bottom it is the argument in Count II, put as questions the other
 * side has to answer under oath.
 */
export const INTERROGATORIES: Interrogatory[] = [
  {
    id: 'rog-1',
    number: 1,
    topic: 'formation',
    asked:
      'State verbatim each word You spoke to Cruller at the hedge between the Cruller and Prine properties on 1 April 2025.',
    objections: [],
    answer:
      'I said hello, and I said the doughnut was neat. I offered it to him the way I would offer anybody a doughnut. After a year and some months I cannot swear to every other word, but nothing I said was about a soul, because I would not say that to a neighbor.',
    kind: 'answered',
    assessment: {
      sufficiency: 'sufficient',
      note:
        'Answers the question and gives us two things to hold him to: "neat" is his own word, and he has sworn he cannot recall the rest. A witness who has sworn to a failure of recollection cannot later produce a detailed account of the same conversation without explaining where it came from.',
    },
  },
  {
    id: 'rog-2',
    number: 2,
    topic: 'aspect',
    asked:
      'State whether, at the time of the offer described in Paragraph 6 of the Amended Complaint, You appeared to Cruller in a horned aspect.',
    objections: [
      {
        ground: 'Vague and ambiguous',
        stated:
          'The phrase "horned aspect" is undefined, is not a term of art, and does not describe a fact capable of admission or denial. Defendant objects to the extent the interrogatory assumes facts not in evidence.',
        rule: 'specificity',
      },
    ],
    answer:
      'Subject to and without waiving that objection: no. I have never appeared to Cruller, or to anyone, in a horned aspect. I was wearing a sweater.',
    kind: 'answered-over-objection',
    assessment: {
      sufficiency: 'sufficient',
      note:
        'The objection is fair and the denial is what we wanted anyway. This is NRCP 33(b)(3) working as designed: the ground is preserved, and to the extent the question was not objected to it still got answered. The sweater is the kind of detail a client should be told is now locked in.',
    },
  },
  {
    id: 'rog-3',
    number: 3,
    topic: 'concealment',
    asked:
      'Identify each term of the agreement alleged in the Amended Complaint that was not spoken aloud on 1 April 2025, including any writing borne by or contained within the doughnut.',
    objections: [
      {
        ground: 'Calls for a legal conclusion',
        stated:
          'The interrogatory asks Defendant to characterize "terms" of an "agreement" whose existence and content are the ultimate questions in this action. Defendant will not adopt Plaintiff\'s legal premises by answering.',
        rule: 'contention',
      },
      {
        ground: 'Overbroad',
        stated:
          'To the extent the interrogatory seeks every unspoken term of an agreement Defendant denies exists, it is not proportional to the needs of the case.',
      },
    ],
    answer: null,
    kind: 'objection-only',
    assessment: {
      sufficiency: 'deficient',
      note:
        'The one deficient response in the set, and the rule says so in terms: an interrogatory "is not objectionable merely because it asks for an opinion or contention that relates to fact or the application of law to fact." Whether there was writing in the doughnut is also a plain question of fact, and no characterization is needed to answer it.',
      followUp:
        'Conference held 12 August 2026; counsel is considering a supplemental response. If none arrives, this is the interrogatory the motion under NRCP 37(a) is built on — one clean deficiency, quoted against one rule, beats a motion complaining about eight responses at once.',
    },
  },
  {
    id: 'rog-4',
    number: 4,
    topic: 'knowledge',
    asked:
      'State the date on which You first contended that the soul of Cruller had been conveyed to You, and identify each person to whom You stated that contention.',
    objections: [
      {
        ground: 'Attorney–client privilege and work product',
        stated:
          'Defendant objects to the extent the interrogatory seeks the date or content of communications with counsel, or materials prepared in anticipation of litigation.',
      },
    ],
    answer:
      'Subject to that objection, and excluding anything I discussed with my lawyer: 14 April 2026, in my own kitchen, to my wife Verity. I did not say it to Cruller, and I have not said it to anybody else.',
    kind: 'answered-in-part',
    assessment: {
      sufficiency: 'sufficient',
      note:
        'Narrowed, and useful anyway. 14 April 2026 is the second bite — he dates his own contention to the day Cruller finished the doughnut, not to the day of the offer. On his own sworn account, there was nothing to contend about for 378 days.',
      followUp:
        'Privilege log requested for the withheld communications, so the objection is a list of documents rather than an assertion. Verity Prine moves from a witness to the hedge conversation to a witness to his state of mind.',
    },
  },
  {
    id: 'rog-5',
    number: 5,
    topic: 'formation',
    asked:
      'Identify each person present at the hedge on 1 April 2025, and each person present when Cruller consumed the remainder of the doughnut on 14 April 2026.',
    objections: [],
    answer:
      'On 1 April 2025: myself, Cruller, my wife Verity, and my boys Ambrose and Errol, who were in the yard. On 14 April 2026 I was not present and I do not know who was.',
    kind: 'answered',
    assessment: {
      sufficiency: 'sufficient',
      note:
        'Clean, and it does work for us. Ambrose and Errol were on the roster as "in the yard, not yet noticed"; the defendant has now identified them himself, under oath, which is a better foundation for noticing them than our own inference was.',
      followUp:
        'Notice the depositions of Ambrose and Errol Prine. Both are minors, so the notice goes through counsel and any examination is bounded accordingly.',
    },
  },
  {
    id: 'rog-6',
    number: 6,
    topic: 'ratification',
    asked:
      'Describe each communication between You and Cruller between 1 April 2025 and 14 April 2026 concerning the doughnut, the alleged agreement, or the soul of Cruller.',
    objections: [],
    answer:
      'There were none. We talked over that hedge maybe forty times in the year — about the leaf blower, about a casserole, about his rain gutters twice. The doughnut never came up. I assumed he had eaten it.',
    kind: 'answered',
    assessment: {
      sufficiency: 'sufficient',
      note:
        'The most valuable answer in the set, and it was volunteered. Prine has sworn that in a year of ordinary neighborly contact he never mentioned the term he now says was agreed. Silence for 378 days is hard to square with a party who believed he held a conveyance.',
    },
  },
  {
    id: 'rog-7',
    number: 7,
    topic: 'records',
    asked:
      'Identify each document in Your possession, custody, or control that reflects, refers to, or evidences the alleged agreement.',
    objections: [
      {
        ground: 'Answer by production of records',
        stated:
          'Pursuant to NRCP 33(d), Defendant will make available for inspection the contents of a box in his garage in which he retains correspondence, receipts, and church bulletins from the relevant period.',
        rule: 'records',
      },
    ],
    answer:
      'I do not have a contract. There is a box in the garage with papers from around then and anyone is welcome to look through it.',
    kind: 'answered-in-part',
    assessment: {
      sufficiency: 'partial',
      note:
        'The invitation is neighborly and the rule does not fit it. NRCP 33(d) is for *business records*, and only where the burden of deriving the answer "will be substantially the same for either party" — a box in a garage is neither. The obligation is to identify the documents, which he has not done.',
      followUp:
        'Ask counsel to withdraw the 33(d) designation and identify documents by category and date, and serve requests for production under NRCP 34 rather than accepting an invitation to rummage.',
    },
  },
  {
    id: 'rog-8',
    number: 8,
    topic: 'concealment',
    asked:
      'State each fact upon which You base the contention that describing the doughnut as "neat" conveyed every term of the alleged agreement.',
    objections: [
      {
        ground: 'Premature contention interrogatory',
        stated:
          'The interrogatory seeks Defendant’s contentions before the close of discovery and before any deposition has been taken. Defendant will respond at the time the court directs.',
        rule: 'contention',
      },
    ],
    answer: null,
    kind: 'objection-only',
    assessment: {
      sufficiency: 'partial',
      note:
        'Half right, which is worth explaining rather than fighting. The rule does let a court order that a contention interrogatory wait until designated discovery is complete — but the court has ordered nothing here, and counsel has not asked it to. "We will respond when the court directs" is not a response the rule provides for.',
      followUp:
        'Offer a stipulation: this one is answered thirty days after the close of fact discovery. It costs us a delay we would probably get anyway and keeps the motion focused on Interrogatory 3.',
    },
  },
]

/* ------------------------------------------------------- derived, not typed */

/**
 * The proceeding's own facts.
 *
 * `served` and `responded` are the fixture's dates; the counts below are
 * derived from `INTERROGATORIES` rather than written down, because a count
 * written down is a count that goes stale the first time somebody adds a
 * question and does not think to look here.
 */
export const PROCEEDING = {
  set: 'Plaintiff’s First Set of Interrogatories',
  directedTo: 'Defendant Wendell Prine',
  served: { iso: '2026-06-25', label: '25 June 2026' },
  responded: { iso: '2026-07-27', label: '27 July 2026' },
  conferred: { iso: '2026-08-12', label: '12 August 2026' },
  /** The cap in NRCP 33(a)(1), which is why "of 40" appears on the page. */
  cap: 40,
} as const

/** How many interrogatories drew each kind of response. */
export const RESPONSE_COUNTS: Record<ResponseKind, number> = {
  answered: 0,
  'answered-over-objection': 0,
  'answered-in-part': 0,
  'objection-only': 0,
}

/** How many we are prepared to call sufficient, partial, and deficient. */
export const SUFFICIENCY_COUNTS: Record<Sufficiency, number> = {
  sufficient: 0,
  partial: 0,
  deficient: 0,
}

for (const rog of INTERROGATORIES) {
  RESPONSE_COUNTS[rog.kind] += 1
  SUFFICIENCY_COUNTS[rog.assessment.sufficiency] += 1
}

/** Every interrogatory that drew an objection, whatever else it drew. */
export const OBJECTED_COUNT: number = INTERROGATORIES.filter(
  (rog) => rog.objections.length > 0,
).length

/** The strip under the page heading. */
export const DISCOVERY_FACTS: StatusCell[] = [
  { label: 'Set', value: `${INTERROGATORIES.length} of ${PROCEEDING.cap}` },
  { label: 'Served', value: PROCEEDING.served.label },
  { label: 'Responses', value: PROCEEDING.responded.label },
  { label: 'Objected to', value: `${OBJECTED_COUNT} of ${INTERROGATORIES.length}` },
]

/**
 * The data checks its own story at import.
 *
 * Each of these has a way of going wrong that renders perfectly well: a
 * duplicated number, an answer under a response that claims to be objection
 * only, an objection citing a rule this file does not carry. A page that shows
 * a contradiction looks authoritative while being wrong, which is worse than a
 * page that fails to build — so this throws where a test will see it.
 */
INTERROGATORIES.forEach((rog, index) => {
  if (rog.number !== index + 1) {
    throw new Error(`discovery.ts: ${rog.id} is numbered ${rog.number} at position ${index + 1}`)
  }
  if ((rog.kind === 'objection-only') !== (rog.answer === null)) {
    throw new Error(`discovery.ts: ${rog.id} disagrees with itself about whether it was answered`)
  }
  if (rog.objections.length === 0 && rog.kind !== 'answered') {
    throw new Error(`discovery.ts: ${rog.id} claims ${rog.kind} with no objection behind it`)
  }
  for (const objection of rog.objections) {
    if (objection.rule && !RULES.some((rule) => rule.id === objection.rule)) {
      throw new Error(`discovery.ts: ${rog.id} cites rule "${objection.rule}", which is not in RULES`)
    }
  }
})
