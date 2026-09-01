// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { App } from '../App'
import { MOUNT } from '../mount'

describe('the Cruller v. Prine portal', () => {
  it('renders the matter, its claim, and what the client is asked to do next', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'Cruller v. Prine' })).toBeInTheDocument()
    expect(screen.getByText(/Trespass to land · Nevada/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Where things stand' })).toBeInTheDocument()

    expect(screen.getByText('Review the complaint draft')).toBeInTheDocument()
    expect(screen.getByText('Confirm the discovery timeline')).toBeInTheDocument()
    expect(screen.getByText('Message your legal team with questions')).toBeInTheDocument()
  })

  it('says plainly that the matter is a fixture', () => {
    render(<App />)

    expect(
      screen.getByText('Fixture data only — Cruller v. Prine is a simulated matter.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Legal notice' })).toBeInTheDocument()
  })

  it('carries the ready hook only once it has mounted', () => {
    // The hook is Navigator's signal that the bundle booted, so it must not
    // exist before React renders. A static marker in index.html would report
    // "ready" for an app that threw on mount.
    expect(document.getElementById('sample-litigation-portal-ready')).toBeNull()

    render(<App />)

    expect(document.getElementById('sample-litigation-portal-ready')).toBeInTheDocument()
  })

  it('never hardcodes the mount into a link', () => {
    const { container } = render(<App />)
    const hrefs = Array.from(container.querySelectorAll('a[href]')).map((anchor) =>
      anchor.getAttribute('href'),
    )

    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).toBeTruthy()
      if (href?.startsWith('/')) {
        // A same-origin link is either inside this bundle — and therefore
        // derived from the base — or one of Navigator's own `/app` routes.
        // Anything else is a path that assumes where the bundle is mounted.
        expect(href.startsWith(MOUNT) || href.startsWith('/app/')).toBe(true)
      }
    }
    expect(hrefs.some((href) => href?.startsWith(MOUNT))).toBe(true)
  })
})
