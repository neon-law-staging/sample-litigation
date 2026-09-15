// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'

/**
 * Shapes the matter data is written in.
 *
 * These used to come from the component library. They live here now because the
 * data modules are the ones that own them: `matter.ts` and `soulContract.ts`
 * describe what this matter says, and a rendering component should accept that
 * shape rather than dictate it. The seam is the same either way — data in one
 * file, presentation in another — but the arrow points the right direction.
 */

/** A label/value pair in the strip under a case heading. */
export interface StatusCell {
  label: ReactNode
  value: ReactNode
}

/** One numbered item in a next-steps list. */
export interface ActionItem {
  id: string
  title: ReactNode
  detail?: ReactNode
}

/** Avatar accent, named for the token family it draws from rather than a color. */
export type FeedAccent = 'brand' | 'link' | 'danger' | 'success' | 'warning' | 'neutral'

/** A dated event on the chronology rail. */
export interface FeedPost {
  id: string
  /** ISO date (YYYY-MM-DD). Drives the `<time>` element. */
  date: string
  /** Human-readable date shown on the card. */
  dateLabel: string
  actor: string
  /** Secondary line under the actor — firm, side, department. */
  role?: string
  /** One to three characters rendered in the rail disc. */
  initials: string
  accent?: FeedAccent
  /** Event category rendered as a badge beside the title. */
  kind?: string
  title: ReactNode
  body: ReactNode
}
