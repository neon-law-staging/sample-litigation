// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import { INTERROGATORIES } from '../discovery'
import { MOUNT } from '../mount'
import { RECEIVED } from '../responses'
import {
  AWAITING_WITNESS,
  GROUND_RULES,
  MOCK_CROSS,
  PREP,
  PREP_CARDS,
  ROUND_COUNTS,
} from '../trialPrep'

/*
 * The witness preparation deck.
 *
 * One promise on this page is worth more than the layout it is made of: a card
 * does not show its answer until the reader asks for it. A prep deck that
 * displays the question and the suggested answer side by side is a memo, and a
 * client who reads a memo has not practiced anything — he has read a memo and
 * believes he has practiced. That is the thing a well-meaning redesign removes
 * first, so it is asserted first and asserted in both directions.
 *
 * The rest counts against `trialPrep.ts` rather than against the component, on
 * the same principle as the discovery and interrogatories suites: the page
 * renders what the data says, so an assertion here is an assertion about the
 * deck.
 */

beforeEach(() => {
  window.location.hash = '#trial-prep'
})

afterEach(() => {
  window.location.hash = ''
})

async function typist() {
  const { default: userEvent } = await import('@testing-library/user-event')
  return userEvent.setup()
}

describe('the trial preparation page', () => {
  it('names the witness, the two rooms, and the deck it is counting', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Getting ready to testify' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Witness preparation · Cruller v\. Prine · Nevada/)).toBeInTheDocument()
    // The witness is named in the facts strip and again in the alerts, so this
    // asks whether he is on the page rather than how many times.
    expect(screen.getAllByText(PREP.witness).length).toBeGreaterThan(0)
    expect(screen.getByText(new RegExp(`^${PREP_CARDS.length} cards`))).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(PREP.deposition.label)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(new RegExp(PREP.trial.label)).length).toBeGreaterThan(0)
  })

  it('keeps the answer off the page until the card is turned over', () => {
    render(<App />)

    const first = PREP_CARDS[0]
    expect(first?.answer).toBeTruthy()
    // Not hidden — absent. A visually hidden answer is still one a reader's eye
    // catches and a find-in-page lands on, and either turns the deck into a memo.
    expect(screen.queryByText(String(first?.answer))).not.toBeInTheDocument()
    expect(screen.queryByText(String(first?.why))).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: new RegExp(first!.asked.slice(0, 40)) })).toBeInTheDocument()
  })

  it('shows the answer, the reasoning, and the weaker answer once it is turned over', async () => {
    const user = await typist()
    render(<App />)

    const first = PREP_CARDS[0]
    await user.click(screen.getByRole('button', { name: 'Turn the card over' }))

    expect(screen.getByText(String(first?.answer))).toBeInTheDocument()
    expect(screen.getByText(String(first?.why))).toBeInTheDocument()
    expect(screen.getByText(String(first?.aim))).toBeInTheDocument()
    expect(screen.getByText(`“${first?.weak?.said}”`)).toBeInTheDocument()
    expect(screen.getByText(String(first?.weak?.costs))).toBeInTheDocument()
  })

  it('takes the answer back down when the next question arrives', async () => {
    const user = await typist()
    render(<App />)

    const [first, second] = PREP_CARDS
    await user.click(screen.getByRole('button', { name: 'Turn the card over' }))
    expect(screen.getByText(String(first?.answer))).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next/ }))

    expect(screen.getByRole('article', { name: new RegExp(second!.asked.slice(0, 40)) })).toBeInTheDocument()
    expect(screen.queryByText(String(second?.answer))).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Turn the card over' })).toBeInTheDocument()
  })

  it('refuses to draft the answers only the witness can give', async () => {
    const user = await typist()
    render(<App />)

    expect(AWAITING_WITNESS.length).toBeGreaterThan(0)
    expect(
      screen.getByRole('heading', { name: 'The answers we cannot write for you' }),
    ).toBeInTheDocument()

    // Turning one of them over produces an instruction, not an answer.
    await user.click(screen.getByRole('radio', { name: 'All of them' }))
    const article = screen.getByRole('article', {
      name: new RegExp(AWAITING_WITNESS[0]!.asked.slice(0, 30)),
    })
    await user.click(within(article).getByRole('button', { name: 'Turn the card over' }))
    expect(article.textContent).toContain('We will not write this one for you')
  })

  it('shows the whole deck at once when the reader asks for it', async () => {
    const user = await typist()
    render(<App />)

    expect(screen.getAllByRole('article')).toHaveLength(1)
    await user.click(screen.getByRole('radio', { name: 'All of them' }))
    expect(screen.getAllByRole('article')).toHaveLength(PREP_CARDS.length)
  })

  it('narrows the deck to the questions the other side is asking', async () => {
    const user = await typist()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: 'Theirs' }))
    await user.click(screen.getByRole('radio', { name: 'All of them' }))

    expect(screen.getAllByRole('article')).toHaveLength(ROUND_COUNTS.cross)
    for (const card of PREP_CARDS.filter((entry) => entry.round === 'cross')) {
      expect(
        screen.getByRole('article', { name: new RegExp(card.asked.slice(0, 30)) }),
      ).toBeInTheDocument()
    }
  })

  it('attributes every question to whoever is asking it', async () => {
    const user = await typist()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: 'All of them' }))

    for (const card of PREP_CARDS) {
      const article = screen.getByRole('article', { name: new RegExp(card.asked.slice(0, 30)) })
      const asker = card.round === 'cross' ? PREP.examiner : PREP.ourCounsel
      expect(article.textContent).toContain(`Asked by ${asker}`)
    }
  })

  it('carries the ground rules, which matter more than any single answer', () => {
    render(<App />)

    for (const rule of GROUND_RULES) {
      expect(screen.getByText(rule.rule)).toBeInTheDocument()
      expect(screen.getByText(rule.why)).toBeInTheDocument()
    }
  })

  it('plays the examination out in order, and can drop the coaching notes', async () => {
    const user = await typist()
    render(<App />)

    const spoken = MOCK_CROSS.map((turn) => turn.text)
    for (const line of spoken) {
      expect(screen.getByText(line)).toBeInTheDocument()
    }

    const coached = MOCK_CROSS.find((turn) => turn.coaching)
    expect(screen.getByText(String(coached?.coaching))).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Notes off' }))

    expect(screen.queryByText(String(coached?.coaching))).not.toBeInTheDocument()
    // The exchange itself survives the notes going away.
    expect(screen.getByText(String(coached?.text))).toBeInTheDocument()
  })

  it('says the deck is a rehearsal rather than a script, and that all of it is invented', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'A rehearsal, not a script' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Fixture, like the rest of the portal' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(PREP.examinerFirm)).length).toBeGreaterThan(0)
  })

  it('carries the ready hook, exactly once, on this view too', () => {
    render(<App />)

    expect(document.querySelectorAll('#sample-litigation-portal-ready')).toHaveLength(1)
  })
})

describe('reaching the deck from the rest of the portal', () => {
  it('offers the tab in the section nav, marked as the current page', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'Portal sections' })
    const link = within(nav).getByRole('link', { name: 'Trial prep' })
    expect(link).toHaveAttribute('href', `${MOUNT}#trial-prep`)
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('links from the overview, derived from the mount', () => {
    window.location.hash = ''
    render(<App />)

    const link = screen.getByRole('link', { name: /Work through the deck/ })
    expect(link).toHaveAttribute('href', `${MOUNT}#trial-prep`)
  })

  it('sends a reader from a card to the record it was drafted from', async () => {
    const user = await typist()
    render(<App />)

    await user.click(screen.getByRole('radio', { name: 'All of them' }))
    const anchored = PREP_CARDS.find((card) => card.anchor?.set === 'served')
    const article = screen.getByRole('article', { name: new RegExp(anchored!.asked.slice(0, 30)) })
    await user.click(within(article).getByRole('button', { name: 'Turn the card over' }))

    const link = within(article).getByRole('link', { name: /Read it in the record/ })
    expect(link).toHaveAttribute('href', `${MOUNT}#discovery`)
  })
})

describe('the deck as data', () => {
  it('never claims support from a piece of record that does not exist', () => {
    // The guard in `trialPrep.ts` throws at import for this, which means a
    // broken anchor fails every suite at once. Asserting it here is what names
    // the reason when that happens.
    for (const card of PREP_CARDS) {
      if (!card.anchor) continue
      const found =
        card.anchor.set === 'served'
          ? INTERROGATORIES.some((rog) => rog.id === card.anchor?.id)
          : RECEIVED.some((response) => response.id === card.anchor?.id)
      expect(found).toBe(true)
    }
  })

  it('sends every anchor to the view that actually holds it', () => {
    for (const card of PREP_CARDS) {
      if (!card.anchor) continue
      expect(card.anchor.view).toBe(card.anchor.set === 'served' ? 'discovery' : 'interrogatories')
    }
  })

  it('keeps the deck consistent with the answer the client is about to swear to', () => {
    // Card 5 is the ratification question, and the answer on it is the same
    // one going out under his oath in the interrogatory response. Two versions
    // of the most important sentence in the case is how a witness is impeached
    // with his own file.
    const card = PREP_CARDS.find((entry) => entry.id === 'card-second-bite')
    const drafted = RECEIVED.find((response) => response.id === 'in-1')
    expect(card?.answer).toBe(drafted?.answer)
  })

  it('offers a weaker answer that is unhelpful rather than untrue', () => {
    // The point of `weak` is to show ground given away, never to model a lie —
    // a deck that rehearses a witness in what to conceal is a different
    // document with a different name.
    for (const card of PREP_CARDS) {
      if (!card.weak) continue
      expect(card.weak.said.length).toBeGreaterThan(0)
      expect(card.weak.costs.length).toBeGreaterThan(0)
    }
  })
})
