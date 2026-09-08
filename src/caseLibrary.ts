// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * A general reference shelf, distinct from `research.ts`.
 *
 * `research.ts` holds the five authorities Count II is actually built on — each
 * tied to `formation`, `ratification`, or `limitations`. A case that does not
 * answer one of those questions does not belong there no matter how real it is.
 * This file is where a citation lands instead: still real, still `verified`,
 * still checked against the opinion before being written down, but carrying no
 * claim of relevance to *Cruller v. Prine*. `relevance` says so on every entry
 * rather than leaving a reader to guess why it is here.
 *
 * Every `quote` is verbatim from the opinion text retrieved via CourtListener,
 * not from a search snippet — the same verify-before-citing standard the Count
 * II authorities hold to. `summary` is written in our own words rather than
 * copied from any retrieval tool's output, and is not a substitute for the
 * opinion itself, which `url` links to in full.
 */

export interface LibraryCase {
  id: string
  cite: string
  court: string
  dateLabel: string
  docket: string
  jurisdiction: string
  /** Why this is real law but not Count II authority. */
  relevance: string
  /** In our own words, not copied from any tool's output. */
  summary: string[]
  quotes: { text: string; source: string }[]
  url: string
  verified: true
}

export const CASE_LIBRARY: LibraryCase[] = [
  {
    id: 'morros',
    cite: 'State v. Morros, 104 Nev. 709, 766 P.2d 263 (1988)',
    court: 'Nevada Supreme Court',
    dateLabel: '21 December 1988',
    docket: 'No. 18105',
    jurisdiction: 'Nevada',
    relevance:
      'Nevada water law, not contract or rescission. It answers nothing Count II turns on — it is here as a general reference, not as an authority for this matter.',
    summary: [
      'A consolidated appeal and cross-appeal over the State Engineer’s approval of water-right applications filed by two federal agencies, the Bureau of Land Management and the U.S. Forest Service, for stockwatering, wildlife watering, and an in situ recreational and fishery right in Blue Lake, Humboldt County. The Nevada Board of Agriculture argued that Nevada law requires a physical diversion of water before a right can be granted at all, so an in situ right — one that leaves the water where it is — could never issue. The district court had agreed as to the stockwatering and wildlife-watering permits but upheld the Blue Lake permit, and both sides appealed their loss.',
      'The court held that NRS 533.035 makes beneficial use, not physical diversion, the sole essential requirement for a Nevada water right, and that the application-content requirements in NRS 533.335 are informational rather than an independent diversion rule. It distinguished its own older decision in Prosole v. Steamboat Canal Co. as pre-statutory and therefore not controlling, reinstated all three federal permits, and held that a federal agency appropriating water as a landowner is entitled to the same treatment as a private one under NRS 533.010.',
    ],
    quotes: [
      {
        text: 'Accordingly, we conclude that no absolute diversion requirement precludes the granting of an in situ water right to the water of Blue Lake.',
        source: 'the court’s holding on the Blue Lake permit',
      },
      {
        text: 'The legislature explicitly defined the scope of the right to appropriate water when it enacted NRS 533.035. That provision specifies that beneficial use is “the basis, the measure and the limit of the right to the use of water.”',
        source: 'the court’s statement of the governing rule',
      },
    ],
    url: 'https://www.courtlistener.com/opinion/1349617/state-v-morros/',
    verified: true,
  },
]

export const CASE_LIBRARY_NOTE =
  'Real citations, retrieved and verified the same way as the Count II authorities — but not tied to any issue in this matter. A general reference shelf, not part of the case.'
