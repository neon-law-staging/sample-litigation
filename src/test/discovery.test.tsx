// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import {
  INTERROGATORIES,
  OBJECTED_COUNT,
  PROCEEDING,
  RULES,
  SIGNER,
  SUFFICIENCY_COUNTS,
} from '../discovery'
import { MOUNT } from '../mount'

/*
 * The discovery page.
 *
 * Two things are worth testing here and they are not the layout. The first is
 * the attribution contract: an answer is the party's and sworn, an objection is
 * counsel's and is not, and a page that blurs them is the failure this page was
 * built to prevent. The second is that the page renders what `discovery.ts`
 * says rather than a copy of it — every assertion below counts against the data
 * module, so adding a ninth interrogatory cannot leave the page behind.
 */

beforeEach(() => {
  window.location.hash = '#discovery'
})

afterEach(() => {
  window.location.hash = ''
})

describe('the discovery page', () => {
  it('renders the set as the page heading, with the dates it was served and answered', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: `Interrogatories to ${SIGNER.party.name}`,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Discovery · Cruller v\. Prine · Nevada/i)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`went out on ${PROCEEDING.served.label}`)),
    ).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`came back on ${PROCEEDING.responded.label}`)),
    ).toBeInTheDocument()
  })

  it('counts the set against the 40-interrogatory cap rather than saying "all"', () => {
    render(<App />)

    // The cap is the reason the set is eight questions, so the strip says so.
    expect(
      screen.getByText(`${INTERROGATORIES.length} of ${PROCEEDING.cap}`),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`${OBJECTED_COUNT} of ${INTERROGATORIES.length}`),
    ).toBeInTheDocument()
  })

  it('renders every interrogatory in the set, in the order served', () => {
    render(<App />)

    const asked = screen.getAllByRole('article').map((article) => article.textContent ?? '')
    expect(asked).toHaveLength(INTERROGATORIES.length)

    INTERROGATORIES.forEach((rog, index) => {
      expect(asked[index]).toContain(`Interrogatory ${rog.number}`)
      expect(asked[index]).toContain(rog.asked)
    })
  })

  it('attributes every answer to the party under oath and every objection to counsel', () => {
    render(<App />)

    for (const rog of INTERROGATORIES) {
      const article = screen.getByRole('article', { name: rog.asked })

      if (rog.answer) {
        // The answer block names the defendant and says it is sworn. Both halves
        // matter: a client who reads an objection as sworn testimony has been
        // misled by the document, not by the other side.
        const answer = within(article).getByText(rog.answer)
        const block = answer.closest('section')
        expect(block).not.toBeNull()
        expect(block?.textContent).toContain(`Answer — ${SIGNER.party.name}`)
        expect(block?.textContent).toContain('sworn under oath')
      }

      for (const objection of rog.objections) {
        const stated = within(article).getByText(objection.stated)
        const block = stated.closest('section')
        expect(block?.textContent).toContain(`Objection — ${SIGNER.counsel.name}`)
        expect(block?.textContent).toContain('signed by counsel')
        // Counsel's block never claims an oath.
        expect(block?.textContent).not.toContain('under oath')
      }
    }
  })

  it('says so plainly where the response was an objection and nothing else', () => {
    render(<App />)

    const objectionOnly = INTERROGATORIES.filter((rog) => rog.answer === null)
    expect(objectionOnly.length).toBeGreaterThan(0)

    for (const rog of objectionOnly) {
      const article = screen.getByRole('article', { name: rog.asked })
      expect(article.textContent).toContain('No answer was given')
    }
  })

  it('badges the deficient response and carries the follow-up it calls for', () => {
    render(<App />)

    const deficient = INTERROGATORIES.filter((rog) => rog.assessment.sufficiency === 'deficient')
    expect(deficient).toHaveLength(SUFFICIENCY_COUNTS.deficient)

    for (const rog of deficient) {
      const article = screen.getByRole('article', { name: rog.asked })
      expect(within(article).getByText('Deficient')).toBeInTheDocument()
      expect(rog.assessment.followUp).toBeTruthy()
      expect(article.textContent).toContain(rog.assessment.followUp as string)
    }
  })

  it('narrows the set to the responses that were never answered', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: 'Not answered' }))

    const shown = screen.getAllByRole('article')
    const unanswered = INTERROGATORIES.filter((rog) => rog.answer === null)
    expect(shown).toHaveLength(unanswered.length)
    for (const rog of unanswered) {
      expect(screen.getByRole('article', { name: rog.asked })).toBeInTheDocument()
    }
  })

  it('quotes the rules verbatim and links out to the rules themselves', () => {
    render(<App />)

    for (const rule of RULES) {
      const link = screen.getByRole('link', { name: new RegExp(rule.cite.replace(/[()]/g, '\\$&')) })
      expect(link).toHaveAttribute('href', rule.url)
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
      expect(screen.getByText(rule.quote)).toBeInTheDocument()
    }

    // The same promise `research.ts` makes: the law is real even though the
    // matter is invented, and the page says which is which on its face.
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('says the exchange is invented, and names the counsel it invented', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'The exchange is invented' })).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`${SIGNER.counsel.name} of ${SIGNER.counsel.affiliation}`)),
    ).toBeInTheDocument()
  })

  it('carries the ready hook, exactly once, on this view too', () => {
    render(<App />)

    expect(document.querySelectorAll('#sample-litigation-portal-ready')).toHaveLength(1)
  })
})

describe('reaching discovery from the rest of the portal', () => {
  it('offers discovery in the section nav, marked as the current page', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'Portal sections' })
    const link = within(nav).getByRole('link', { name: 'Discovery' })
    expect(link).toHaveAttribute('href', `${MOUNT}#discovery`)
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('links from the overview, derived from the mount', () => {
    window.location.hash = ''
    render(<App />)

    const link = screen.getByRole('link', { name: /Read the interrogatories and responses/ })
    expect(link).toHaveAttribute('href', `${MOUNT}#discovery`)
  })
})
