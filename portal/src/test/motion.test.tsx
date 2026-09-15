// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { App } from '../App'
import {
  ACCRUAL_CANDIDATES,
  COURT,
  DAYS_TO_HEARING,
  LIMITATIONS_YEARS,
  LONGEST_INTERVAL,
  MOTION,
  MOTION_DOCUMENT,
  NARROWEST_MARGIN,
  PROCEDURAL_AUTHORITIES,
  RESERVED,
  SUBSTANTIVE_AUTHORITIES,
  UNDISPUTED_FACTS,
} from '../motion'

/*
 * The motion page.
 *
 * Two properties are worth a test here, and neither is layout.
 *
 * The first is the **arithmetic**. The motion's whole argument is that three
 * years had not run on any accrual date, and `motion.ts` derives every one of
 * those dates rather than carrying them. A test that hardcoded the expiries
 * would pass while agreeing with a bug, so the assertions below check the
 * relationship — every candidate's three years must outlast the filing of
 * Count II — as well as the two numbers the page actually prints.
 *
 * The second is the **reservation**. The page has to say, on its face, that the
 * motion is aimed at one of two defenses and leaves the disputed one alone. That
 * is the property a well-meaning redesign deletes first, because it reads like a
 * caveat rather than like the point, so it gets asserted the same way the trial
 * prep deck's hidden answers do.
 */

// The page mounts the viewer, and pdf.js cannot run under jsdom. The double
// keeps this file about the page rather than about the environment's canvas
// shims; `pdf-viewer.test.tsx` is where the viewer itself is tested.
vi.mock('../pdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../pdf')>()
  const { pdfDouble } = await import('./pdf-double')
  return { ...actual, ...pdfDouble() }
})

beforeEach(() => {
  window.location.hash = '#motion'
})

afterEach(() => {
  window.location.hash = ''
})

describe('the motion page', () => {
  it('names the motion, the court, and the docket it is filed under', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: MOTION.title }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${COURT.shortName} · ${COURT.county}`)),
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(COURT.caseNumber))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Dept\\. ${COURT.department}`))).toBeInTheDocument()
  })

  it('counts the hearing from the fixture’s present moment rather than from today', () => {
    // A live clock would make this number true for one day and would make this
    // test depend on when it ran.
    expect(DAYS_TO_HEARING).toBe(33)

    render(<App />)
    // More than once: the strip prints it beside the hearing date and the
    // hearing card prints it again in a sentence.
    expect(screen.getAllByText(new RegExp(`${DAYS_TO_HEARING} days`)).length).toBeGreaterThan(0)
    expect(screen.getByText(new RegExp(MOTION.asOf.label))).toBeInTheDocument()
  })
})

describe('the limitations arithmetic', () => {
  it('derives each expiry from the accrual date rather than carrying it', () => {
    for (const entry of ACCRUAL_CANDIDATES) {
      const accrued = new Date(`${entry.iso}T00:00:00Z`)
      const expiry = new Date(`${entry.expiryIso}T00:00:00Z`)
      expect(expiry.getUTCFullYear() - accrued.getUTCFullYear()).toBe(LIMITATIONS_YEARS)
      expect(expiry.getUTCMonth()).toBe(accrued.getUTCMonth())
      expect(expiry.getUTCDate()).toBe(accrued.getUTCDate())
    }
  })

  it('leaves the claim timely on every candidate date, which is the motion’s whole argument', () => {
    // If this ever fails, the motion is wrong rather than the test — and
    // `motion.ts` throws at import before it gets here.
    expect(ACCRUAL_CANDIDATES.length).toBeGreaterThan(1)
    for (const entry of ACCRUAL_CANDIDATES) {
      expect(entry.expiryIso > MOTION.countFiled.iso, `${entry.id} expires too early`).toBe(true)
      expect(entry.marginDays).toBeGreaterThan(0)
    }
  })

  it('prints the worst case rather than the best one', () => {
    // The number a client should see is the margin on the date least favorable
    // to us, not the comfortable one.
    expect(NARROWEST_MARGIN).toBe(
      Math.min(...ACCRUAL_CANDIDATES.map((entry) => entry.marginDays)),
    )
    expect(LONGEST_INTERVAL).toBe(
      Math.max(...ACCRUAL_CANDIDATES.map((entry) => entry.elapsedDays)),
    )

    render(<App />)
    expect(screen.getAllByText(new RegExp(`${NARROWEST_MARGIN} days`)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(new RegExp(`${LONGEST_INTERVAL} days`)).length).toBeGreaterThan(0)
  })

  it('renders a row for every candidate accrual date', () => {
    render(<App />)

    for (const entry of ACCRUAL_CANDIDATES) {
      expect(screen.getAllByText(new RegExp(entry.expiryLabel)).length).toBeGreaterThan(0)
    }
  })
})

describe('what the motion does not ask for', () => {
  it('says on the page that a grant would not end the case', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'What a grant would and would not do' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What we did not ask for' })).toBeInTheDocument()
  })

  it('names the reserved defense and where it goes instead', () => {
    render(<App />)

    for (const issue of RESERVED) {
      expect(screen.getByText(issue.defense)).toBeInTheDocument()
      expect(screen.getByText(issue.question)).toBeInTheDocument()
      expect(screen.getByText(issue.destination)).toBeInTheDocument()
    }
  })

  it('marks the disputed facts as disputed rather than burying them', () => {
    // Two of the seven undisputed-material-facts are ones Prine has an interest
    // in fighting. The page has to say so, because a motion that called them
    // simply "undisputed" would be overclaiming to the one reader who cannot
    // check.
    const contested = UNDISPUTED_FACTS.filter((fact) => fact.contested)
    expect(contested.length).toBe(2)

    render(<App />)
    expect(
      screen.getAllByText('Prine would dispute this — and it still loses').length,
    ).toBe(contested.length)
  })
})

describe('the authorities on the motion page', () => {
  it('quotes every one verbatim and marks it verified', () => {
    render(<App />)

    for (const authority of [...PROCEDURAL_AUTHORITIES, ...SUBSTANTIVE_AUTHORITIES]) {
      expect(authority.verified).toBe(true)
      expect(screen.getByText(`“${authority.quote}”`)).toBeInTheDocument()
    }
    expect(screen.getAllByText('Verified').length).toBe(
      PROCEDURAL_AUTHORITIES.length + SUBSTANTIVE_AUTHORITIES.length,
    )
  })

  it('selects the substantive law from research.ts rather than restating it', async () => {
    // The reuse is the point: a second transcription of a verified quote is a
    // second chance to break the promise `verified` makes.
    const { AUTHORITIES } = await import('../research')

    for (const authority of SUBSTANTIVE_AUTHORITIES) {
      expect(AUTHORITIES).toContain(authority)
    }
  })
})

describe('the pleading itself', () => {
  it('links the rendered PDF through the mount rather than an absolute path', async () => {
    const { MOUNT } = await import('../mount')
    render(<App />)

    const link = screen.getByRole('link', { name: /Open full size/ })
    expect(link).toHaveAttribute('href', `${MOUNT}${MOTION_DOCUMENT.path}`)
  })

  it('names the Typst source and the command that regenerates it', () => {
    // The provenance is the point, the same way the documents tab names the
    // notation template behind each PDF. A committed artefact whose source is
    // not stated beside it is an artefact nobody will re-render.
    render(<App />)

    expect(screen.getByText(MOTION_DOCUMENT.source)).toBeInTheDocument()
    expect(screen.getByText(MOTION_DOCUMENT.furniture)).toBeInTheDocument()
    expect(screen.getByText(MOTION_DOCUMENT.script)).toBeInTheDocument()
  })
})

describe('the motion’s own data', () => {
  it('numbers the undisputed facts in the order the motion states them', () => {
    UNDISPUTED_FACTS.forEach((fact, index) => {
      expect(fact.number).toBe(index + 1)
    })
  })

  it('anchors every record-backed fact to an interrogatory that exists', async () => {
    // `motion.ts` throws at import if this is false. The test is here so the
    // failure names the guard rather than arriving as an unrelated import error.
    const { INTERROGATORIES } = await import('../discovery')

    for (const fact of UNDISPUTED_FACTS) {
      if (fact.anchor) {
        expect(INTERROGATORIES.some((rog) => rog.id === fact.anchor)).toBe(true)
      }
    }
  })
})
