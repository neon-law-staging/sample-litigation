// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ActionItem, StatusCell } from './types'

/**
 * The matter this portal renders — fixture data, and nothing else.
 *
 * *Cruller v. Prine* is simulated. It is the matter Navigator's own seed
 * opens for every local login (`store/src/seed.rs`), which is why the code,
 * the claim, and the jurisdiction below match that seed exactly: a sample that
 * disagrees with the fixture it is served beside teaches the wrong thing.
 *
 * Data lives here rather than inside a component on purpose. Every component
 * in `src/components/ui` takes its data as props and imports no application
 * module, so the seam between "what this matter says" and "how a matter looks"
 * is a file boundary you can see. A real portal replaces this
 * module with a same-origin read against Navigator's `/app/api`; the
 * components above it do not change.
 */

export const MATTER = {
  /** The Project code. It is also the first segment of the bucket prefix. */
  code: 'sample-litigation',
  caption: 'Cruller v. Prine',
  claim: 'Trespass to land',
  jurisdiction: 'Nevada',
} as const

/** The strip under the case head: four facts a client should not have to hunt for. */
export const MATTER_FACTS: StatusCell[] = [
  { label: 'Matter', value: MATTER.caption },
  { label: 'Claim', value: MATTER.claim },
  { label: 'Jurisdiction', value: MATTER.jurisdiction },
  { label: 'Data', value: 'Fixture only' },
]

/** What the client is being asked to do next. Carried over from the stub. */
export const NEXT_STEPS: ActionItem[] = [
  {
    id: 'complaint-draft',
    title: 'Review the complaint draft',
    detail: 'Read it end to end and note anything that does not match your account of events.',
  },
  {
    id: 'discovery-timeline',
    title: 'Confirm the discovery timeline',
    detail: 'Check the proposed dates against your own calendar.',
  },
  {
    id: 'ask-questions',
    title: 'Message your legal team with questions',
    detail: 'Anything unclear is worth raising early rather than at a deadline.',
  },
]
