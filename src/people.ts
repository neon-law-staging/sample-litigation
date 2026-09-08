// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The people on the matter — fixture data, and nothing else.
 *
 * Two different kinds of person are in this file, and the distinction is the
 * reason it exists rather than being folded into `soulContract.ts`:
 *
 * 1. **Navigator Persons.** Rows in the `person` table, each carrying a
 *    system-wide role tier and, for this matter, a Person–Project Role that
 *    records their participation. These are the accounts that can *sign in* and
 *    reach the portal. Navigator's dev seed writes exactly five of them
 *    (`store::seed::seed_role_matrix_sample`), and the five below are those
 *    five, spelled the way the seed spells them.
 * 2. **People in the pleaded facts.** Dermot, Wendell, and the two households. They
 *    are parties and witnesses in a simulated dispute. Most of them are not
 *    Navigator Persons at all, and none of them can sign in.
 *
 * Conflating the two is the mistake this file is written to prevent. "Who is on
 * this matter" has two honest answers — who may read it, and who it is about —
 * and a portal that answers only the second one has no idea who is looking at
 * it. Each entry therefore says which kind it is, and every vocabulary word
 * used below (Person, Participation, Person–Project Role, DRI) is defined in
 * `glossary.ts` against Navigator's canonical glossary.
 *
 * The graph in `soulContract.ts` stays the source of truth for the *facts* — who
 * stood where, who saw what. `GRAPH_NODES` is keyed by the same ids as the cast
 * below, so the two never drift about who exists.
 */

import { GRAPH_NODES } from './soulContract'

/* ------------------------------------------------------- Navigator Persons */

/**
 * The system-wide tier on a `person` row — Navigator's authorization tier, and
 * the only place it lives. It is read from the database on the OIDC callback,
 * never from the token: the id_token carries `sub` and `email` and nothing that
 * grants anything.
 */
export type PersonRole = 'owner' | 'admin' | 'lawyer' | 'clerk' | 'client'

/** Which side of the matter a participation row puts a principal on. */
export type MatterSide = 'firm' | 'client' | 'none'

export interface NavigatorPerson {
  id: string
  name: string
  email: string
  /** The tier on the `person` row. */
  role: PersonRole
  /**
   * The `participation` value on this person's Person–Project Role row for
   * `sample-litigation`, or `null` where the seed deliberately writes no row.
   *
   * Written out rather than derived here because the value is the seed's, and
   * the seed is what a local Navigator actually contains — note that the lawyer
   * row reads `attorney` rather than `lawyer`, which is the fixture's own
   * spelling and not a typo in this file.
   */
  participation: string | null
  side: MatterSide
  /** Directly responsible individual on one side, where designated. */
  dri: 'lawyer' | 'client' | null
  /** What this account is for, and what it demonstrates. */
  note: string
}

/**
 * The five seeded accounts, in tier order.
 *
 * A local Navigator's Rauthy fixture signs in as each of these, which is what
 * makes them worth naming in the portal: a contributor reading this page can
 * match the person they are logged in as to the row that let them through.
 */
export const NAVIGATOR_PEOPLE: NavigatorPerson[] = [
  {
    id: 'owner',
    name: 'Olive Owner',
    email: 'owner@neonlaw.com',
    role: 'owner',
    participation: 'owner',
    side: 'firm',
    dri: null,
    note: 'Carries a firm-side row so the matter appears in the Owner\'s own participation-scoped list. There is no privileged bypass of that list for any tier, which is why even an Owner needs the row.',
  },
  {
    id: 'admin',
    name: 'Ada Admin',
    email: 'admin@neonlaw.com',
    role: 'admin',
    participation: null,
    side: 'none',
    dri: null,
    note: 'Deliberately has no participation row, and therefore cannot see this matter at all — not in the list, not by URL. The absence is the fixture\'s point: privileged reach is somewhere an administrator navigates to, not a silent widening of a shared route.',
  },
  {
    id: 'lawyer',
    name: 'Lawrence Lawyer',
    email: 'lawyer@neonlaw.com',
    role: 'lawyer',
    participation: 'attorney',
    side: 'firm',
    dri: 'lawyer',
    note: 'The licensed lawyer answerable for the matter, and the Firm DRI named in the engagement letter. The `lawyer_review` step in every notation template in this repository is the point where this person, and no automation, approves a document.',
  },
  {
    id: 'clerk',
    name: 'Clara Clerk',
    email: 'clerk@neonlaw.com',
    role: 'clerk',
    participation: 'clerk',
    side: 'firm',
    dri: null,
    note: 'Firm side, supervised. A Clerk works the matter under the lawyer DRI; the tier is what lets that supervision be a rule rather than a convention.',
  },
  {
    id: 'client',
    name: 'Cleo Client',
    email: 'client@neonlaw.com',
    role: 'client',
    participation: 'client',
    side: 'client',
    dri: 'client',
    note: 'The client-side account, and the Client DRI. This is the lens this portal is built for: signing in as this person is how a contributor sees what a client sees.',
  },
]

/**
 * The entity the matter is opened against.
 *
 * Every Project is opened against an Entity, and a solo natural person gets a
 * `Human` entity rather than an exception to the rule — which is why a
 * one-plaintiff trespass claim still has an organization row behind it.
 */
export const MATTER_ENTITY = {
  name: 'Dermot Cruller',
  entityType: 'Human',
  jurisdiction: 'Nevada',
} as const

/* ------------------------------------------------- people in the fixture */

/** Which side of the dispute a person in the pleaded facts stands on. */
export type Household = 'cruller' | 'prine'

/** How a person in the facts is expected to reach the record, if at all. */
export type Standing = 'party' | 'witness' | 'non-testifying'

export interface MatterPerson {
  /** Matches a `GRAPH_NODES` id, so the roster and the graph cannot disagree. */
  id: string
  name: string
  household: Household
  standing: Standing
  /** One line: who they are to the case. */
  role: string
  /** The paragraph the detail pane shows. */
  detail: string
  /** Whether this person is also a Navigator Person who can sign in. */
  signsIn: false
  /** Where their evidence lands, in a phrase. Absent for a non-witness. */
  evidence?: string
}

/**
 * The cast, client side first.
 *
 * `role` and `detail` are read from `GRAPH_NODES` rather than restated, because
 * two copies of a person's description are two descriptions that will
 * eventually disagree. What this file adds is the part a graph node has no
 * place for: standing, and where the evidence lands.
 */
const CAST: Omit<MatterPerson, 'name' | 'role' | 'detail' | 'household'>[] = [
  {
    id: 'dermot',
    standing: 'party',
    signsIn: false,
    evidence: 'His own account of what he knew on 14 April 2026 — the fact Count II turns on.',
  },
  {
    id: 'beatrix',
    standing: 'witness',
    signsIn: false,
    evidence: 'What was said at the hedge, and Dermot\'s state of knowledge across the year.',
  },
  {
    id: 'odile',
    standing: 'witness',
    signsIn: false,
    evidence: 'The dated notebook, sworn to in the affidavit on the documents tab.',
  },
  {
    id: 'linus',
    standing: 'witness',
    signsIn: false,
    evidence: 'The second bite, and that Dermot said nothing about a contract while taking it.',
  },
  { id: 'posy', standing: 'non-testifying', signsIn: false },
  {
    id: 'wendell',
    standing: 'party',
    signsIn: false,
    evidence: 'Denies the horned aspect and denies concealment. Deposition noticed.',
  },
  {
    id: 'verity',
    standing: 'witness',
    signsIn: false,
    evidence: 'That the hedge conversation was ordinary neighborly conduct.',
  },
  { id: 'ambrose', standing: 'witness', signsIn: false, evidence: 'In the yard. Not yet noticed.' },
  { id: 'errol', standing: 'witness', signsIn: false, evidence: 'In the yard. Not yet noticed.' },
]

/**
 * The roster, joined to the graph at module load.
 *
 * A cast entry naming a node that does not exist is a programming error rather
 * than something to render an empty card for, so it throws here — at import,
 * where a test sees it — instead of degrading quietly in the browser.
 */
export const MATTER_PEOPLE: MatterPerson[] = CAST.map((entry) => {
  const node = GRAPH_NODES.find((candidate) => candidate.id === entry.id)
  if (!node) throw new Error(`people.ts names ${entry.id}, which is not a node in the graph`)
  if (node.household === 'res') {
    throw new Error(`${entry.id} is a thing, not a person: the roster is people only`)
  }
  return {
    id: entry.id,
    name: node.label,
    household: node.household,
    standing: entry.standing,
    role: node.role,
    detail: node.detail,
    signsIn: entry.signsIn,
    evidence: entry.evidence,
  }
})

/** The households, for grouping the roster. */
export const HOUSEHOLDS: { id: Household; label: string; note: string }[] = [
  {
    id: 'cruller',
    label: 'Cruller',
    note: 'The client side. Dermot is the plaintiff; the rest of the household are his witnesses.',
  },
  {
    id: 'prine',
    label: 'Prine',
    note: 'Adverse. Contact runs through the defendant\'s counsel, never directly.',
  },
]

/**
 * Why the two lists never merge.
 *
 * Rendered on the page rather than left in this comment, because a reader of the
 * portal is exactly the person who needs it: the row that lets you *read* the
 * matter and the role you play *in* the matter are different records, and only
 * one of them decides what you can see.
 */
export const TWO_ROSTERS_NOTE =
  'Dermot Cruller is the plaintiff and has no account. Cleo Client has an account and is not the plaintiff. Both statements are true at once, because participation is a property of a Person–Project Role row and a party is a fact in a pleading — and Navigator never lets the second one grant the first.'
