// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { INTERROGATORIES, type Topic } from './discovery'
import { INBOUND, RECEIVED } from './responses'
import { GAP_DAYS } from './soulContract'
import type { StatusCell } from './types'

/**
 * Witness preparation — the deck the client studies before he testifies.
 *
 * `discovery.ts` is what the other side swore to. `responses.ts` is what we are
 * drafting for our own client to swear to. This module is the third document in
 * that sequence and the only one that never gets served: it is what we say to
 * Dermot Cruller in a conference room, written down so he can study it between
 * sessions and so nothing in it depends on him remembering a two-hour meeting.
 *
 * It is written as flashcards for a reason that is not decoration. A witness
 * who reads a memo about his own testimony learns the memo; a witness who is
 * asked the question cold, answers it in his head, and only then turns the card
 * over has practiced the thing he will actually have to do. So every card holds
 * the question on its face and the answer behind it, and the page will not show
 * the second until the reader asks for it.
 *
 * Three lines this file will not cross, each of which is a way witness prep
 * goes wrong:
 *
 * 1. **The answers are his, not ours.** Every `answer` below is written in the
 *    register of a man who talks about hedges and refrigerators, because that
 *    is what he sounds like and a witness reciting his lawyer's sentences is
 *    the most obvious thing in a courtroom. They are drafted from what he has
 *    already told us and from what the record already shows; where the file
 *    cannot supply the answer, the card says so instead of inventing one.
 * 2. **Nothing here coaches a false answer.** Preparing a witness means telling
 *    him what will be asked, what the question is for, and how to answer it
 *    truthfully without volunteering a case away. `weak` exists to show the
 *    difference between an answer that hurts and an answer that lies — the
 *    weak answers below are unhelpful, not untrue.
 * 3. **A card that claims record support has to point at the record.** Every
 *    `anchor` names an interrogatory in `discovery.ts` or `responses.ts` by id,
 *    and the guard at the foot of this file throws if it names one that does
 *    not exist. A prep deck that drifts from the sworn record is worse than no
 *    deck: it rehearses the witness into contradicting himself.
 *
 * **Fixture, like everything else.** Dermot Cruller, Wendell Prine, and Hollis
 * Stipe of Marrow & Stipe LLP are invented, as is every question and answer
 * below. No part of this is legal advice, and no real witness was prepared with
 * it.
 */

/* ---------------------------------------------------------------- the room */

/**
 * When the testimony happens, counted from the same present moment the
 * interrogatories page uses.
 *
 * `INBOUND.asOf` is the fixture's "now" — a fixed date rather than
 * `new Date()`, for the reason `responses.ts` explains. Reusing it means the
 * two pages cannot disagree about what day it is, which they would within a
 * week of each other keeping a copy.
 */
const DAY_MS = 86_400_000

function daysFromAsOf(iso: string): number {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${INBOUND.asOf.iso}T00:00:00Z`)) / DAY_MS)
}

export const PREP = {
  witness: 'Dermot A. Cruller',
  witnessRole: 'Plaintiff · testifying in his own case',
  examiner: 'Hollis Stipe',
  examinerFirm: 'Marrow & Stipe LLP',
  ourCounsel: 'Lawrence Lawyer',
  ourFirm: 'Neon Law',
  /** The working session this deck is written for. */
  session: { iso: '2026-09-02', label: '2 September 2026' },
  /** His deposition, noticed by the defense. The first time he answers out loud. */
  deposition: { iso: '2026-10-06', label: '6 October 2026' },
  /** The trial setting. */
  trial: { iso: '2027-03-08', label: '8 March 2027' },
  asOf: INBOUND.asOf,
} as const

/** Days until he is first examined under oath, as of `PREP.asOf`. */
export const DAYS_TO_DEPOSITION: number = daysFromAsOf(PREP.deposition.iso)

/** Days until trial, as of `PREP.asOf`. */
export const DAYS_TO_TRIAL: number = daysFromAsOf(PREP.trial.iso)

/**
 * Why one deck covers both.
 *
 * Rendered on the page rather than left in this comment, because it is the
 * thing a client is most likely to get wrong about the order of events: the
 * deposition is not a rehearsal that stops mattering when trial starts. A
 * deposition answer can be read to the jury, so the answer he gives in a
 * conference room in October is an answer he gives at trial in March whether or
 * not he says it the same way twice.
 */
export const ONE_DECK_TWO_ROOMS =
  'His deposition comes first, and every answer he gives there can be read aloud to the jury at trial. There is no practice version of this testimony — the transcript is the testimony, five months early.'

/**
 * An answer he is already swearing to, pulled from the response being drafted
 * rather than typed out again.
 *
 * The same discipline `responses.ts` applies to the rules it quotes, and here
 * it is not a nicety. A card that rehearses him in one form of words while his
 * interrogatory answer swears to another is how a witness gets impeached with
 * his own file — and the examiner will be holding the interrogatory answer.
 * Two copies of the most important sentence in the case is one copy too many.
 */
function sworn(id: string): string {
  const response = RECEIVED.find((candidate) => candidate.id === id)
  if (!response) throw new Error(`trialPrep.ts: no drafted response "${id}"`)
  if (!response.answer) throw new Error(`trialPrep.ts: "${id}" has no drafted answer to rehearse`)
  return response.answer
}

/* --------------------------------------------------------------- the cards */

/** Which examination the question belongs to. */
export type Round = 'cross' | 'direct'

/** How much trouble the question is, which is what decides the order to study in. */
export type Heat = 'settled' | 'watch' | 'hard'

/** Where in the portal the supporting record can be read. */
export type RecordView = 'discovery' | 'interrogatories'

/**
 * What in the sworn record backs the answer up.
 *
 * `set` and `id` are a foreign key into the two exchange modules rather than a
 * restatement of them: `served` means an interrogatory we put to Prine and he
 * answered under oath, `received` means one of theirs and the response we are
 * drafting. The guard at the foot of this file checks that the id exists, so a
 * card cannot claim support from a question nobody asked.
 */
export interface RecordAnchor {
  set: 'served' | 'received'
  id: string
  /** What that piece of record actually establishes, in one line. */
  says: string
  view: RecordView
}

/** The answer that does not lie and still loses ground, and what it costs. */
export interface WeakAnswer {
  said: string
  costs: string
}

export interface PrepCard {
  id: string
  /** Position in the deck. Sequential, and checked at import. */
  number: number
  round: Round
  topic: Topic
  heat: Heat
  /** The question, in the mouth of whoever is asking it. */
  asked: string
  /** What the question is *for* — the answer they are hoping to get. */
  aim: string
  /** What he should say, in his own register. `null` where only he can supply it. */
  answer: string | null
  /** Why that answer is the right one. Our voice, not his. */
  why: string
  /** A truthful answer that hurts, and the reason it hurts. */
  weak?: WeakAnswer
  /** The follow-up that arrives if the answer opens a door. */
  followUp?: string
  anchor?: RecordAnchor
}

/**
 * The deck, in the order the questions will come at him.
 *
 * Cross-examination first because that is the part he is afraid of and the part
 * that is drafted from their theory rather than ours — read top to bottom, the
 * first ten cards are the defense of this case put as questions. The three
 * direct cards are last for the opposite reason: they look easy, and the way a
 * witness loses ground on direct is by relaxing into them.
 */
export const PREP_CARDS: PrepCard[] = [
  {
    id: 'card-bite',
    number: 1,
    round: 'cross',
    topic: 'formation',
    heat: 'watch',
    asked:
      'On the first of April last year, Mr. Prine held out a doughnut and you took it. And you bit into it. Yes or no?',
    aim:
      'To get acceptance on the record in three words, before anything is said about what he understood. If the bite is the acceptance, the contract formed on 1 April 2025 and everything he learned afterwards is too late.',
    answer: 'Yes, I took it and I had a bite of it.',
    why:
      'It is true, it is two clauses long, and it gives away nothing. The legal significance of that bite is an argument for the lawyers — whether beginning a performance accepts an offer or only makes it irrevocable while you carry on. A witness who tries to win that argument in the answer sounds rehearsed and puts his own gloss on a fact that is not in dispute.',
    weak: {
      said: 'Yes, but I want to be clear that I never agreed to anything, and I only took one small bite, and anyone would have done the same.',
      costs:
        'Three volunteered facts and a defense of himself, to a question that asked for one. "One small bite" invites a question about the bite he took a year later, and arguing before he has been accused makes him look like a man who knows he has a problem.',
    },
    followUp: 'And nobody made you take it. You wanted it.',
    anchor: {
      set: 'served',
      id: 'rog-1',
      says: 'Prine has sworn to what he said at the hedge, and it is "hello" and "neat" and nothing about a soul.',
      view: 'discovery',
    },
  },
  {
    id: 'card-neat',
    number: 2,
    round: 'cross',
    topic: 'formation',
    heat: 'settled',
    asked:
      'My client said the doughnut was neat. That is all he said. You are not telling this jury that a neighbor saying "neat" over a hedge is some kind of trick, are you?',
    aim:
      'To make the word sound harmless, so that the case looks like a man suing over an ordinary kindness. The question is built to be answered "no", which then reads as agreement that nothing improper happened.',
    answer:
      'He said it was neat. That is exactly what he said, and it is the only thing he said about it. Nobody mentioned a soul to me that day.',
    why:
      'He agrees with the fact and declines the characterization, without arguing about it. The sentence he must not lose is the last one, because it is the fact their own client has already sworn to — the whole concealment count is that the operative term was never spoken aloud, and their witness confirmed it on 27 July.',
    anchor: {
      set: 'served',
      id: 'rog-1',
      says: 'Prine, under oath: "nothing I said was about a soul, because I would not say that to a neighbor."',
      view: 'discovery',
    },
  },
  {
    id: 'card-lettering',
    number: 3,
    round: 'cross',
    topic: 'concealment',
    heat: 'hard',
    asked:
      'You saw lettering on the underside of that glaze. You could not read it. And you ate it anyway — without asking a single question about what it said.',
    aim:
      'Unreasonable reliance. If he saw writing and chose not to inspect it, the defense argues he assented to whatever it said, and the concealment count becomes a man who did not bother to read.',
    answer:
      'I saw there was something written under the glaze. I could not make it out, and it did not occur to me that a doughnut was a piece of paper. If I had thought there was an agreement in it, I would have read it — that is why I am here.',
    why:
      'The last sentence is the whole answer to the question and it is the truth: the reason he did not inspect is that nothing about the transaction told him there was anything to inspect. Note that he concedes seeing the lettering. He has to — Odile wrote it down that day, and a witness caught minimizing a fact his own daughter recorded has lost more than the fact.',
    weak: {
      said: 'I could not read it because the glaze was over it. It was deliberately hidden from me.',
      costs:
        '"Deliberately" is an argument, not an observation — he cannot know what was in Prine\'s mind, and a witness who testifies to somebody else\'s intent gets taken apart on the next question. Let the concealment be proved by the facts he actually saw.',
    },
    followUp: 'You have eaten a great many doughnuts, Mr. Cruller. Have you inspected any of the others?',
    anchor: {
      set: 'received',
      id: 'in-6',
      says: 'His own draft answer says the same thing, and says the instrument is gone — so the notebook and his recollection are the evidence.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-gap',
    number: 4,
    round: 'cross',
    topic: 'ratification',
    heat: 'hard',
    asked: `That doughnut sat in your refrigerator for ${GAP_DAYS} days. In all that time you never once asked my client what the writing said.`,
    aim:
      'To make the silence look like knowledge. Either he knew about the term and did nothing — which is acquiescence — or the writing meant so little to him that he cannot now claim he was deceived by it.',
    answer:
      'That is right. I did not think about it. It was a doughnut in the refrigerator behind the milk, and I had no reason to think it was anything else.',
    why:
      'The honest answer is also the strongest one, and it survives the trap in the question. Their theory needs the silence to be *his* silence; it was both sides\' silence. Prine has sworn that in that same year the two of them talked over the hedge about forty times, about the leaf blower and a casserole and the rain gutters twice, and that the doughnut never came up. A man who believed he held a conveyance of his neighbor\'s soul did not mention it in forty conversations.',
    weak: {
      said: 'I meant to ask him about it, and I kept forgetting.',
      costs:
        'It concedes the writing was on his mind — which is the one thing the question is fishing for. "Meant to ask" becomes "so you knew there was something to ask about" on the very next question, and the discovery date starts sliding backwards from 15 April 2026 toward the hedge.',
    },
    anchor: {
      set: 'served',
      id: 'rog-6',
      says: 'Prine swore there were no communications about the doughnut in the whole year. His silence is on the record next to Cruller\'s.',
      view: 'discovery',
    },
  },
  {
    id: 'card-second-bite',
    number: 5,
    round: 'cross',
    topic: 'ratification',
    heat: 'hard',
    asked:
      'On 14 April 2026 you took that doughnut out of the refrigerator and you finished it. You took every bit of the benefit of this bargain, and now you want out of it.',
    aim:
      'Ratification, which is the count. A contract voidable for fraud can be affirmed by conduct, and eating the whole consideration is about as affirmative as conduct gets — if he knew what he was affirming.',
    answer: sworn('in-1'),
    why:
      'Ratification requires knowledge of the facts that made the contract voidable — accepting a benefit in ignorance affirms nothing. So the answer is not about the eating, which is admitted, but about what he knew while he ate, which is the only fact in the question that is actually in dispute. This is the most important sentence he will say in the case, and it is the answer he is already swearing to on the interrogatories — this card reads it out of `responses.ts` rather than keeping a second copy, because the examiner will have the sworn version in his hand and any daylight between the two is his best question of the day.',
    weak: {
      said: 'I suppose I had a feeling something was off about that doughnut, but I ate it anyway.',
      costs:
        'A "feeling something was off" is knowledge, in the only sense the ratification defense needs. It moves his discovery date to before the second bite, and on the pleaded facts that is the end of Count II.',
    },
    followUp: 'You were hungry. With a full refrigerator, you chose the year-old doughnut.',
    anchor: {
      set: 'received',
      id: 'in-1',
      says: 'The same answer, in the same words, going out under his oath in the interrogatory response.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-next-day',
    number: 6,
    round: 'cross',
    topic: 'knowledge',
    heat: 'hard',
    asked:
      'And the very next day — the very next day, after a year of nothing — you discovered that your soul had been signed away. That is your testimony?',
    aim:
      'To make the date sound manufactured. The date is the case: if discovery is placed any earlier than 14 April 2026, the second bite becomes ratification and the count fails, so the defense will attack 15 April 2026 as too convenient to be true.',
    answer: null,
    why:
      'This is the one card in the deck we cannot write, and it must not be written for him. The answer has to be his own account of an actual morning — where he was, what time it was, who said it or what he read, and who else was in the room. Odile\'s notebook is going to be read against it line by line, and a sworn answer that misses the day by one is the best cross-examination the defense will ever get. If he does not remember the hour, the answer is that he does not remember the hour: a witness is allowed not to know things, and is not allowed to guess.',
    weak: {
      said: 'It was the fifteenth. I am sure of it. It was around ten in the morning, I think, or maybe closer to noon.',
      costs:
        'Certainty and hedging in the same breath, which reads as a man assembling a story. Worse, an invented hour can be contradicted by a phone record or a timestamped notebook page, and once one detail is broken the jury re-reads everything else he said.',
    },
    anchor: {
      set: 'received',
      id: 'in-2',
      says: 'The interrogatory that is still waiting on him. Nothing goes out on this until he has told us the account in his own words.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-notebook',
    number: 7,
    round: 'cross',
    topic: 'records',
    heat: 'watch',
    asked:
      'This notebook of your daughter\'s. It has been in your house, in your possession, for a year and a half. Who has had access to it?',
    aim:
      'Authenticity. If the notebook can be made to look curated — pages added, pages removed, entries tidied after the lawyers arrived — then the only contemporaneous evidence in the case goes with it, and so does the discovery date it supports.',
    answer:
      'It is Odile\'s notebook and it lives in her room. I have not written in it, and I have not taken anything out of it. I brought it to my lawyers the way it was.',
    why:
      'Short, and every word of it has to stay true between now and trial — which is why the instruction that goes with this card matters more than the answer does. Do not tidy it, do not copy the useful pages out, do not remove anything, and do not let anybody else. A document altered after a claim is filed is a far larger problem than whatever the alteration was meant to fix, and it converts an evidentiary question into a credibility one.',
    followUp: 'And you did not think to make a copy. Of the single most important document in your case.',
    anchor: {
      set: 'received',
      id: 'in-4',
      says: 'The draft that identifies the notebook by author and date range, rather than inviting them to come and look through the house.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-horns',
    number: 8,
    round: 'cross',
    topic: 'aspect',
    heat: 'watch',
    asked:
      'Mr. Cruller. You have told this court, in a sworn pleading, that your neighbor appeared to you with horns.',
    aim:
      'Not a fact at all — this question is aimed at the jury. If the plaintiff can be made to look like a man who sees horns on his neighbors, nothing else he says needs to be answered.',
    answer:
      'I described what I saw that afternoon, and I stand by the description. The part of this I am asking the court to undo does not depend on it.',
    why:
      'Two sentences, no retreat and no argument. He must not soften the description — a witness who backs off a sworn allegation under pressure has just told the jury he exaggerates — and he must not defend it at length, because every extra sentence is another minute spent on the one topic the defense wants the jury thinking about. Prine has denied it under oath, and it is a swearing contest we do not need to win: the concealment count turns on what was in the doughnut and what was said about it, not on what Prine looked like while he said it.',
    weak: {
      said: 'Well — it was the light, maybe. I might have been mistaken about that part.',
      costs:
        'It hands them the retraction they came for, and it teaches the jury that his sworn statements are things he might have been mistaken about. The next question is about the lettering under the glaze, and the answer to that one is now worth less.',
    },
    anchor: {
      set: 'served',
      id: 'rog-2',
      says: 'Prine denies it flatly, under oath: "I have never appeared to Cruller, or to anyone, in a horned aspect. I was wearing a sweater."',
      view: 'discovery',
    },
  },
  {
    id: 'card-lawyer',
    number: 9,
    round: 'cross',
    topic: 'knowledge',
    heat: 'watch',
    asked:
      'Who was the first person to use the words "conveyance of your soul" to you? Was it your lawyer?',
    aim:
      'Two things at once. If the phrase came from counsel, the defense argues the claim was manufactured in a law office — and if he answers by describing what his lawyer told him, he has waived privilege over the conversation he is describing.',
    answer:
      'I have talked to my lawyers about this case, and I am not going to repeat what we said. Outside of that: I told my wife Beatrix and my two children after I learned about it, and nobody else.',
    why:
      'He may say he spoke to a lawyer — the fact of the conversation is not privileged and denying it would be false. What he may not do is describe its contents, and the risk here is a helpful witness answering a friendly-sounding question at length and waiving the privilege on his own. The safe habit is a short answer and a pause: if the question is going somewhere it should not, that pause is when his own counsel objects.',
    followUp: 'So a lawyer told you about this. Before that conversation you had no complaint at all.',
    anchor: {
      set: 'received',
      id: 'in-7',
      says: 'The same line drawn in the interrogatory response — the privileged category named and withheld, everything else answered.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-money',
    number: 10,
    round: 'cross',
    topic: 'damages',
    heat: 'settled',
    asked: 'What is a soul worth, Mr. Cruller? Put a number on it for the jury.',
    aim:
      'To make him name a figure. Any number sounds grasping, and a plaintiff who prices the thing he says cannot be sold has undercut his own count. A refusal, delivered badly, sounds evasive instead.',
    answer:
      'I am not asking for money on that part of the case. What I want is the thing undone.',
    why:
      'Eleven words and it is complete, because it happens to be exactly what the pleading asks for: Count II seeks rescission and cancellation of the alleged instrument, which is equitable relief and is not computed. The trespass count is the one with figures in it, and those are hedge-repair receipts he can produce rather than a number he has to justify.',
    anchor: {
      set: 'received',
      id: 'in-3',
      says: 'The objection and answer already drafted on this: Count II is not a money claim, and the interrogatory assumes it is.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-direct-hedge',
    number: 11,
    round: 'direct',
    topic: 'formation',
    heat: 'watch',
    asked: 'Mr. Cruller, tell the jury what happened at the hedge on the first of April last year.',
    aim:
      'Ours, and the friendliest question he will get all day — which is precisely what makes it dangerous. An open question invites a witness to keep talking, and everything past the answer is material the other side gets to cross-examine on.',
    answer:
      'I was in the yard. Wendell was on his side of the hedge and he held out a doughnut and said it was neat. I said thank you and I took it. My wife was with me. That was the whole of it.',
    why:
      'Five short sentences that put the scene in front of the jury and stop. He does not characterize Prine, he does not describe the horns unless he is asked, and he does not reach for the lettering — each of those has its own question later, asked in an order we chose. A witness who tells the whole story in the first answer has taken that ordering away from his own lawyer.',
    weak: {
      said: 'Well, you have to understand what kind of neighbor Wendell has always been, and I should probably start with the hedge itself, because there is a history there going back to the gutters…',
      costs:
        'It opens the trespass history, the neighbours\' relationship, and his opinion of Prine, none of which was asked about and all of which is now fair game on cross.',
    },
  },
  {
    id: 'card-direct-discovery',
    number: 12,
    round: 'direct',
    topic: 'knowledge',
    heat: 'hard',
    asked: 'When did you first learn that there was a term about your soul?',
    aim:
      'Ours, and the pivot of the whole count. The answer has to be a date, delivered plainly, with no hedging around it — because the defense is going to spend an hour trying to move it.',
    answer: null,
    why:
      'The same account as card 6, told once and told the same way. It cannot be drafted here for the same reason: it is his morning, not ours. What we can say now is the shape of it — the date, then how he learned it, then who was there, and nothing else. The engagement letter is signed on 20 April and the notice of rescission goes out on 2 May, seventeen days later, so his date is the beginning of a sequence the documents corroborate. That is why it has to be right.',
    anchor: {
      set: 'received',
      id: 'in-2',
      says: 'The interrogatory answer that has to say the same thing, sworn three weeks before he is deposed on it.',
      view: 'interrogatories',
    },
  },
  {
    id: 'card-direct-why',
    number: 13,
    round: 'direct',
    topic: 'ratification',
    heat: 'watch',
    asked: 'Why did you finish the doughnut?',
    aim:
      'Ours, and it exists so the jury hears the ordinary reason from him before they hear the sinister one from them. The answer is not a defense of anything; it is a man explaining a Tuesday.',
    answer:
      'I was hungry, it was in the refrigerator, and I did not want to waste it. Linus was in the kitchen. I did not think about it at all — there was nothing to think about yet.',
    why:
      'The last clause is the one that does the legal work and it has to arrive sounding like the end of a sentence rather than the point of one. "There was nothing to think about yet" is his state of knowledge on 14 April 2026, which is the fact the count turns on, and a jury believes it far more readily when it comes out as an aside than when it comes out as a conclusion.',
    anchor: {
      set: 'received',
      id: 'in-1',
      says: 'His drafted interrogatory answer, which says the same thing in the same voice.',
      view: 'interrogatories',
    },
  },
]

/* ---------------------------------------------------------- the ground rules */

/**
 * The habits, which matter more than any single answer.
 *
 * A witness who has these six and no preparation at all does better than a
 * witness who has memorized thirteen answers and none of these. They are on the
 * page rather than in a handout because the handout is the thing that gets left
 * in the car.
 */
export interface GroundRule {
  id: string
  rule: string
  why: string
}

export const GROUND_RULES: GroundRule[] = [
  {
    id: 'pause',
    rule: 'Wait a beat before every answer.',
    why:
      'It gives your own lawyer time to object, and it costs a transcript nothing — the pause does not appear in the record. A witness who answers on top of the question also answers the objectionable ones.',
  },
  {
    id: 'answer-asked',
    rule: 'Answer the question you were asked, and then stop talking.',
    why:
      'Silence after a short answer is uncomfortable, and examiners use that discomfort deliberately: the next thing said in that silence is almost always volunteered. Let it be uncomfortable.',
  },
  {
    id: 'dont-know',
    rule: '"I do not know" and "I do not remember" are complete answers.',
    why:
      'They are also different answers — one is a fact you never had, the other is a fact you had and lost. Neither is a failure. A guess that turns out wrong is a failure, and it is permanent.',
  },
  {
    id: 'dont-argue',
    rule: 'Do not argue with the examiner, and do not try to win.',
    why:
      'Arguing makes an adversary of a stranger in front of the jury, and it always ends with a longer answer than the question deserved. Disagreeing with a premise is fine; sparring over it is not.',
  },
  {
    id: 'documents',
    rule: 'If a question is about a document, ask to see the document.',
    why:
      'You are entitled to read it before you are asked what it says. Answering from memory about a paper somebody else is holding is how a witness gets impeached with his own file.',
  },
  {
    id: 'consistency',
    rule: 'Your interrogatory answers will be in his hand.',
    why:
      'Everything you swore to on 14 September is a document the examiner has tabbed and highlighted. That is the reason we do not send an answer out until you have read it in your own words and said it is true.',
  },
]

/* ------------------------------------------------------------- the mock cross */

/** Who is speaking in the simulated exchange. */
export type Voice = 'examiner' | 'witness' | 'counsel'

export interface Turn {
  id: string
  voice: Voice
  text: string
  /** The aside for the client — why the turn goes the way it does. Not spoken. */
  coaching?: string
}

/**
 * A run of cross-examination, played out.
 *
 * The cards teach one question at a time, which is not how the questions
 * arrive. An examiner builds: three answers that cost nothing, and then the one
 * the first three were for. This sequence is written so the client can feel that
 * shape — every question in it is fair, every answer in it is true, and the
 * pressure comes entirely from the order.
 *
 * It is fixture, like the rest. No such examination has taken place.
 */
export const MOCK_CROSS: Turn[] = [
  {
    id: 'mc-1',
    voice: 'examiner',
    text: 'Mr. Cruller, you have lived next to my client for eleven years.',
    coaching:
      'The first three questions of a cross are almost always agreeable ones. He is building a rhythm of yeses, and the rhythm is the point.',
  },
  { id: 'mc-2', voice: 'witness', text: 'That is right.' },
  {
    id: 'mc-3',
    voice: 'examiner',
    text: 'In eleven years he has given you things over that hedge before. Tomatoes. A casserole.',
  },
  { id: 'mc-4', voice: 'witness', text: 'He has, yes.' },
  {
    id: 'mc-5',
    voice: 'examiner',
    text: 'And you have never once suspected a tomato of containing a contract.',
    coaching:
      'The laugh line. It is aimed at the jury, not at the witness. Answer it flatly and let it pass — a witness who tries to be funny back has stopped being a witness.',
  },
  {
    id: 'mc-6',
    voice: 'witness',
    text: 'No.',
    coaching: 'One word. Nothing follows it. This is the answer the whole rhythm was built to earn, and it costs nothing.',
  },
  {
    id: 'mc-7',
    voice: 'examiner',
    text: 'So on the first of April, when he handed you a doughnut and said it was neat, you understood exactly what was happening. A neighbor was giving you a doughnut.',
    coaching:
      'Here is the turn. Two true things and a conclusion, offered as one question — and the conclusion is the defense\'s whole formation argument.',
  },
  {
    id: 'mc-8',
    voice: 'witness',
    text: 'I understood that a neighbor was giving me a doughnut. That is exactly what I understood.',
    coaching:
      'He agrees with the part that is true and says it back in his own words, which quietly declines the part that is not. He does not add "but". The "but" is his own lawyer\'s job on redirect.',
  },
  {
    id: 'mc-9',
    voice: 'examiner',
    text: 'And you kept it for a year. Three hundred and seventy-eight days, in a refrigerator, behind the milk.',
  },
  { id: 'mc-10', voice: 'witness', text: 'Yes.' },
  {
    id: 'mc-11',
    voice: 'examiner',
    text: 'You never asked him about the writing. Not in a year. Not in — what was it — forty conversations over that hedge?',
    coaching:
      'That figure is from Prine\'s own sworn interrogatory answer. The examiner uses it because it sounds like an admission against Cruller; it is at least as good for us, and the jury will hear it again on redirect.',
  },
  {
    id: 'mc-12',
    voice: 'witness',
    text: 'I never asked him about it. It did not cross my mind.',
  },
  {
    id: 'mc-13',
    voice: 'examiner',
    text: 'It did not cross your mind. And yet you now say there was writing under that glaze that would have cost you your immortal soul. Which is it, Mr. Cruller — did you see the writing, or did it not cross your mind?',
    coaching:
      'The false choice. Both halves are true and the question is built so that either answer looks like a retreat from the other. This is the moment the deck exists for.',
  },
  {
    id: 'mc-14',
    voice: 'witness',
    text: 'Both. I saw there was something written and I could not read it, and then I did not think about it again. It was a doughnut.',
    coaching:
      'He refuses the choice without arguing about it, in two short sentences, and the last one is the reason the first two are not a contradiction. Then he stops.',
  },
  {
    id: 'mc-15',
    voice: 'examiner',
    text: 'You are asking this jury to believe you did not think about it for a year, and then thought about it the day after you ate the evidence.',
    coaching:
      'Not a question, and argumentative. The pause the witness has been taking all morning is what makes the next line possible.',
  },
  {
    id: 'mc-16',
    voice: 'counsel',
    text: 'Objection — argumentative.',
    coaching:
      'Our objection, not his answer. This is precisely why a witness waits a beat: he cannot object for himself, and answering fast takes the objection away.',
  },
  {
    id: 'mc-17',
    voice: 'examiner',
    text: 'I will withdraw it. Mr. Cruller — when did you learn about the term?',
  },
  {
    id: 'mc-18',
    voice: 'witness',
    text: 'The fifteenth of April, twenty twenty-six.',
    coaching:
      'The date, and nothing after the date. The account of how he learned it belongs to the next question if it is asked, and to his own lawyer on redirect if it is not. This is the answer the entire count rests on, and the shorter it is the harder it is to move.',
  },
]

/* ------------------------------------------------------- derived, not typed */

/** How many cards sit at each level of trouble. */
export const HEAT_COUNTS: Record<Heat, number> = { settled: 0, watch: 0, hard: 0 }

/** How many belong to each examination. */
export const ROUND_COUNTS: Record<Round, number> = { cross: 0, direct: 0 }

for (const card of PREP_CARDS) {
  HEAT_COUNTS[card.heat] += 1
  ROUND_COUNTS[card.round] += 1
}

/** The cards whose answer only the witness can supply. The reason for the session. */
export const AWAITING_WITNESS: PrepCard[] = PREP_CARDS.filter((card) => card.answer === null)

/** The strip under the page heading. */
export const PREP_FACTS: StatusCell[] = [
  { label: 'Witness', value: PREP.witness },
  { label: 'Deposition', value: `${PREP.deposition.label} — ${DAYS_TO_DEPOSITION} days` },
  { label: 'Trial', value: `${PREP.trial.label} — ${DAYS_TO_TRIAL} days` },
  { label: 'Cards', value: `${PREP_CARDS.length} · ${HEAT_COUNTS.hard} hard` },
]

/**
 * The deck checks its own story at import.
 *
 * The same reasoning as the guards in `discovery.ts` and `responses.ts`, with
 * one addition that matters more here than anywhere else in the bundle: a card
 * may not claim support from a piece of record that does not exist. A prep deck
 * that cites a sworn answer nobody gave rehearses the witness into a
 * contradiction, and it does it while looking exactly like a deck that works.
 */
PREP_CARDS.forEach((card, index) => {
  if (card.number !== index + 1) {
    throw new Error(`trialPrep.ts: ${card.id} is numbered ${card.number} at position ${index + 1}`)
  }
  if (card.answer === null && !card.why.length) {
    throw new Error(`trialPrep.ts: ${card.id} has no drafted answer and does not say why`)
  }
  if (card.answer !== null && card.answer.trim().length === 0) {
    throw new Error(`trialPrep.ts: ${card.id} carries an empty answer, which is not the same as none`)
  }
  const anchor = card.anchor
  if (anchor) {
    const exists =
      anchor.set === 'served'
        ? INTERROGATORIES.some((rog) => rog.id === anchor.id)
        : RECEIVED.some((response) => response.id === anchor.id)
    if (!exists) {
      throw new Error(
        `trialPrep.ts: ${card.id} anchors to ${anchor.set} "${anchor.id}", which is not in the record`,
      )
    }
    const expected: RecordView = anchor.set === 'served' ? 'discovery' : 'interrogatories'
    if (anchor.view !== expected) {
      throw new Error(`trialPrep.ts: ${card.id} anchors to a ${anchor.set} question and links to ${anchor.view}`)
    }
  }
})

const VOICES: Voice[] = ['examiner', 'witness', 'counsel']

MOCK_CROSS.forEach((turn) => {
  if (!VOICES.includes(turn.voice)) {
    throw new Error(`trialPrep.ts: ${turn.id} is spoken by nobody in the room`)
  }
})

if (DAYS_TO_DEPOSITION <= 0 || DAYS_TO_TRIAL <= DAYS_TO_DEPOSITION) {
  throw new Error('trialPrep.ts: the deposition and the trial are not both ahead of PREP.asOf, in that order')
}
