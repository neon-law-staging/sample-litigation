// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import { MOUNT } from '../mount'
import {
  CERTIFIER,
  CLIENT_TASKS,
  DAYS_REMAINING,
  INBOUND,
  READINESS_COUNTS,
  RECEIVED,
  RESPONSE_RULES,
} from '../responses'

/*
 * The interrogatories page.
 *
 * What is worth testing here is not the layout, it is the two promises the page
 * makes. The first is that nothing on it reads as filed: these are drafts, the
 * answers are not sworn yet, and a client who signs on the strength of this
 * page having looked authoritative has been misled by us rather than by the
 * other side. The second is the same promise the discovery page makes — the
 * page renders what `responses.ts` says rather than a copy of it, so every
 * assertion below counts against the data module.
 */

beforeEach(() => {
  window.location.hash = '#interrogatories'
})

afterEach(() => {
  window.location.hash = ''
})

describe('the interrogatories page', () => {
  it('names the set served on us, and the clock it is on', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: /Responses to Prine's interrogatories/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Discovery · Cruller v\. Prine · Nevada/)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`was served on you on ${INBOUND.served.label}`)),
    ).toBeInTheDocument()
    expect(screen.getByText(`${DAYS_REMAINING} days left`)).toBeInTheDocument()
  })

  it('derives the deadline from service rather than carrying one that can go stale', () => {
    // Thirty days from Friday 14 August 2026 is a Sunday, so the date the page
    // prints is the Monday after — and it is computed, not written down.
    expect(INBOUND.due.iso).toBe('2026-09-14')
    expect(INBOUND.due.label).toBe('14 September 2026')
    expect(DAYS_REMAINING).toBe(25)

    render(<App />)
    expect(screen.getAllByText(new RegExp(INBOUND.due.label)).length).toBeGreaterThan(0)
  })

  it('says the deadline is counted as of a fixed date rather than implying it is now', () => {
    render(<App />)

    expect(screen.getByText(`Counted as of ${INBOUND.asOf.label}`)).toBeInTheDocument()
  })

  it('renders every interrogatory in the set, in the order served', () => {
    render(<App />)

    const drafts = screen.getAllByRole('article').map((article) => article.textContent ?? '')
    expect(drafts).toHaveLength(RECEIVED.length)

    RECEIVED.forEach((response, index) => {
      expect(drafts[index]).toContain(`Interrogatory ${response.number}`)
      expect(drafts[index]).toContain(response.asked)
    })
  })

  it('marks every drafted answer as the client’s to swear, and not yet signed', () => {
    render(<App />)

    for (const response of RECEIVED) {
      const article = screen.getByRole('article', { name: response.asked })
      if (!response.answer) continue

      const block = within(article).getByText(response.answer).closest('section')
      expect(block).not.toBeNull()
      expect(block?.textContent).toContain(`Draft answer — ${CERTIFIER.answers.name}`)
      expect(block?.textContent).toContain('to be sworn by you')
      expect(block?.textContent).toContain('not yet signed')
      // The one thing this page must never claim about an unserved draft.
      expect(block?.textContent).not.toContain('sworn under oath')
    }
  })

  it('attributes every objection to counsel, as a draft counsel has yet to sign', () => {
    render(<App />)

    for (const response of RECEIVED) {
      const article = screen.getByRole('article', { name: response.asked })

      for (const objection of response.objections) {
        const block = within(article).getByText(objection.stated).closest('section')
        expect(block?.textContent).toContain(`Objection — ${CERTIFIER.objections.name}`)
        expect(block?.textContent).toContain('to be signed by counsel')
        // An objection is a position, never testimony — on either side's page.
        expect(block?.textContent).not.toContain('oath')
      }
    }
  })

  it('says plainly that nothing on the page has been served or sworn', () => {
    render(<App />)

    expect(screen.getByText(/None of it has been\s+served and none of it is sworn yet/)).toBeInTheDocument()
  })

  it('does not pretend to have drafted an answer it is waiting on the client for', () => {
    render(<App />)

    const waiting = RECEIVED.filter(
      (response) => response.answer === null && response.stance !== 'objection-only',
    )
    expect(waiting.length).toBeGreaterThan(0)

    for (const response of waiting) {
      const article = screen.getByRole('article', { name: response.asked })
      expect(article.textContent).toContain('Nothing drafted yet')
      expect(article.textContent).toContain(response.outstanding?.task as string)
    }
  })

  it('puts what the client owes at the top, derived from the drafts', () => {
    render(<App />)

    expect(CLIENT_TASKS).toHaveLength(READINESS_COUNTS['needs-client'])

    // The card is the nearest ancestor of the heading that holds the list, so
    // this asserts the tasks are *in that card* rather than merely somewhere on
    // a page that also renders each one down beside its own draft.
    let card: HTMLElement | null = screen.getByRole('heading', { name: 'What we need from you' })
    while (card && !card.querySelector('ol')) card = card.parentElement

    expect(card).not.toBeNull()
    for (const task of CLIENT_TASKS) {
      expect(card?.textContent).toContain(task.task)
      expect(card?.textContent).toContain(`Interrogatory ${task.number}`)
    }
  })

  it('explains why the one objection-only response is allowed to be one', () => {
    render(<App />)

    const objectionOnly = RECEIVED.filter((response) => response.stance === 'objection-only')
    expect(objectionOnly).toHaveLength(1)

    for (const response of objectionOnly) {
      const article = screen.getByRole('article', { name: response.asked })
      expect(article.textContent).toContain('No answer will be given')
      expect(article.textContent).toContain(response.note)
    }
  })

  it('narrows the set to the drafts waiting on the client', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: 'Needs you' }))

    const shown = screen.getAllByRole('article')
    const waiting = RECEIVED.filter((response) => response.outstanding?.owner === 'client')
    expect(shown).toHaveLength(waiting.length)
    for (const response of waiting) {
      expect(screen.getByRole('article', { name: response.asked })).toBeInTheDocument()
    }
  })

  it('quotes the rules verbatim, reusing the ones the discovery page verified', () => {
    render(<App />)

    for (const rule of RESPONSE_RULES) {
      expect(rule.verified).toBe(true)
      const link = screen.getByRole('link', {
        name: new RegExp(rule.cite.replace(/[()]/g, '\\$&')),
      })
      expect(link).toHaveAttribute('href', rule.url)
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
      expect(screen.getByText(rule.quote)).toBeInTheDocument()
    }
  })

  it('says the drafts are invented, and names the counsel it invented', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Drafts, and invented ones' })).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${CERTIFIER.requests.name} of ${CERTIFIER.requests.affiliation}`)),
    ).toBeInTheDocument()
  })

  it('carries the ready hook, exactly once, on this view too', () => {
    render(<App />)

    expect(document.querySelectorAll('#sample-litigation-portal-ready')).toHaveLength(1)
  })
})

describe('reaching the interrogatories from the rest of the portal', () => {
  it('offers the tab in the section nav, marked as the current page', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'Portal sections' })
    const link = within(nav).getByRole('link', { name: 'Interrogatories' })
    expect(link).toHaveAttribute('href', `${MOUNT}#interrogatories`)
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('links back to the set we served, so the two halves are one fight', () => {
    render(<App />)

    const link = screen.getByRole('link', { name: /Read what we asked them/ })
    expect(link).toHaveAttribute('href', `${MOUNT}#discovery`)
  })

  it('links from the overview, derived from the mount', () => {
    window.location.hash = ''
    render(<App />)

    const link = screen.getByRole('link', { name: /Review your draft responses/ })
    expect(link).toHaveAttribute('href', `${MOUNT}#interrogatories`)
  })
})

describe('the response drafts as data', () => {
  it('never drafts an objection on a ground we have argued is not a ground', () => {
    // We are moving to compel on their Interrogatory 3 because "calls for a
    // legal conclusion" is not a ground under NRCP 33(a)(2). A draft of ours
    // resting on the same phrase would hand that motion straight back.
    for (const response of RECEIVED) {
      for (const objection of response.objections) {
        expect(objection.ground.toLowerCase()).not.toContain('legal conclusion')
      }
    }
  })

  it('keeps the set inside the NRCP 33(a)(1) cap', () => {
    expect(RECEIVED.length).toBeLessThanOrEqual(INBOUND.cap)
  })

  it('says what every unfinished draft is waiting on, and on whom', () => {
    for (const response of RECEIVED) {
      if (response.readiness === 'ready') {
        expect(response.outstanding).toBeUndefined()
      } else {
        expect(response.outstanding?.task).toBeTruthy()
        expect(['client', 'firm']).toContain(response.outstanding?.owner)
      }
    }
  })
})
