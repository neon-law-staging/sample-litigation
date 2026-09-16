// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { App } from '../App'
import { DOCUMENTS } from '../documents'
import { MOUNT } from '../mount'
import { AHEAD, FILED, TIMELINE } from '../timeline'
import { TimelinePage } from '../TimelinePage'

/**
 * The timeline is the one page whose whole claim is that it is *in order* and
 * *derived*. Both of those fail invisibly — a misordered entry renders, a stale
 * date renders — so they are asserted here rather than looked at.
 */

afterEach(() => {
  window.location.hash = ''
})

describe('the case timeline', () => {
  it('begins with the complaint and the summons', () => {
    render(<TimelinePage />)

    const rail = screen.getByRole('list', { name: 'Case timeline' })
    const titles = within(rail)
      .getAllByRole('listitem')
      .map((post) => post.textContent ?? '')

    expect(titles[1]).toContain('The case is opened')
    expect(titles[2]).toContain('The summons issues and is served on Prine')
  })

  it('runs in date order, and every date comes from the module that owns it', () => {
    const dates = TIMELINE.map((entry) => entry.date)
    expect([...dates].sort()).toEqual(dates)

    // The two ends of the case, read from `documents.ts` and `trialPrep.ts`
    // rather than typed here: if either module moves a date, this fails.
    const summons = DOCUMENTS.find((document) => document.id === 'summons')
    expect(TIMELINE[0]?.date).toBe(summons?.date)
    expect(TIMELINE.at(-1)?.id).toBe('trial')
  })

  it('divides what is on file from what is still on the calendar', () => {
    render(<TimelinePage />)

    expect(FILED.length).toBeGreaterThan(AHEAD.length)
    expect(FILED.length + AHEAD.length).toBe(TIMELINE.length)
    expect(screen.getByText(/^Today ·/)).toBeInTheDocument()
    expect(screen.getAllByText('Upcoming')).toHaveLength(AHEAD.length)
  })

  it('attaches the rendered document to the event that produced it', () => {
    render(<TimelinePage />)

    const summons = screen.getByRole('link', { name: /Summons\b.*1 page/ })
    expect(summons).toHaveAttribute('href', `${MOUNT}documents/summons-wendell-prine.pdf`)
  })

  it('links from the overview, and sits in front of it in the nav', () => {
    render(<App />)

    const nav = screen.getByRole('navigation', { name: 'Portal sections' })
    const sections = within(nav)
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(sections[0]).toBe('Timeline')
    expect(sections[1]).toBe('Overview')

    expect(
      screen.getByRole('link', { name: /See what has happened so far/ }),
    ).toHaveAttribute('href', `${MOUNT}#timeline`)
  })

  it('is the view the timeline fragment selects', () => {
    window.location.hash = '#timeline'
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'What has happened so far' }),
    ).toBeInTheDocument()
  })
})
