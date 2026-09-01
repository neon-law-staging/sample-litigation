// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { PdfViewer } from '../PdfViewer'
import { findMatches } from '../pdf'
import { cancelledPaints, failNextOpen, PAGES, resetPdfDouble, stallPage } from './pdf-double'

/*
 * The document viewer.
 *
 * Everything pdf.js would do is replaced by `./pdf-double`; what is exercised
 * here is the part this repository owns. See that file for why the seam is
 * drawn at our module rather than at the library.
 */

vi.mock('../pdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../pdf')>()
  const { pdfDouble } = await import('./pdf-double')
  // `findMatches` survives from the real module: it is pure, so there is no
  // reason to fake it and every reason to let these tests cover it.
  return { ...actual, ...pdfDouble() }
})

const SRC = '/app/projects/sample-litigation/portal/documents/notice-of-rescission.pdf'

beforeEach(() => {
  resetPdfDouble()
})

afterEach(() => {
  resetPdfDouble()
})

/** Render the viewer and wait for its first page to arrive. */
async function open() {
  const user = userEvent.setup()
  render(<PdfViewer src={SRC} label="Notice of Rescission" />)
  await screen.findByText('Page 1 of 2')
  return { user }
}

/** The page canvas — hidden from the accessibility tree, so queried directly. */
function canvas(): HTMLCanvasElement {
  const found = document.querySelector('canvas')
  if (!found) throw new Error('the viewer rendered no canvas')
  return found
}

function textLayer(): HTMLElement {
  const found = document.querySelector('.pdf-text-layer')
  if (!(found instanceof HTMLElement)) throw new Error('the viewer rendered no text layer')
  return found
}

describe('the viewer', () => {
  it('reports the page count once the document opens', async () => {
    await open()

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  it('sizes the canvas and the text layer to the same viewport', async () => {
    await open()

    // The two have to agree in CSS pixels or the selectable text drifts off the
    // glyphs beneath it. The canvas carries a second, larger size in device
    // pixels; that one is deliberately not shared.
    await waitFor(() => expect(textLayer().style.width).toBe('612px'))
    expect(canvas().style.width).toBe('612px')
    expect(canvas().style.height).toBe('792px')
    expect(textLayer().style.height).toBe('792px')
    expect(textLayer().style.getPropertyValue('--total-scale-factor')).toBe('1')
  })

  it('steps through the pages and stops at both ends', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  })

  it('announces the document by name when the page changes', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    // Named, because a reader may have opened more than one document and needs
    // to know which one just moved.
    expect(
      await screen.findByText('Notice of Rescission, showing page 2 of 2'),
    ).toBeInTheDocument()
  })

  it('zooms in and out, and repaints at the new scale', async () => {
    const { user } = await open()
    expect(screen.getByText('100%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(await screen.findByText('125%')).toBeInTheDocument()
    await waitFor(() => expect(canvas().style.width).toBe('765px'))

    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(await screen.findByText('100%')).toBeInTheDocument()
    await waitFor(() => expect(canvas().style.width).toBe('612px'))
  })

  it('cancels a paint that is still running when the page changes', async () => {
    // Page 1 hangs mid-render. Turning to page 2 has to cancel it: pdf.js locks
    // the canvas until a render settles, and the next one throws on a canvas
    // still held by the last.
    stallPage(1)
    const user = userEvent.setup()
    render(<PdfViewer src={SRC} label="Notice of Rescission" />)
    await screen.findByText('Page 1 of 2')

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    await waitFor(() => expect(cancelledPaints).toContain(1))
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()
    // The paint that was waited for actually finished: the text layer is the
    // step after `await task.promise`, so its presence is the proof.
    await waitFor(() => expect(textLayer().textContent).toContain('consumed in two sittings'))
  })

  it('offers the file directly when the document cannot be opened', async () => {
    failNextOpen('Invalid PDF structure.')
    render(<PdfViewer src={SRC} label="Notice of Rescission" />)

    expect(await screen.findByText('This document could not be displayed.')).toBeInTheDocument()
    expect(screen.getByText('Invalid PDF structure.')).toBeInTheDocument()

    // A viewer that cannot show the file must not be the only way to reach it.
    expect(screen.getByRole('link', { name: /Open Notice of Rescission directly/ })).toHaveAttribute(
      'href',
      SRC,
    )
  })
})

describe('finding text', () => {
  it('counts every hit in the document and moves to the page carrying it', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: /Find/ }))
    await user.type(screen.getByRole('searchbox'), 'consumed')

    // The phrase is on page two only, so following the hit is a page turn.
    expect(await screen.findByText('1 of 1')).toBeInTheDocument()
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('marks the hits inside the text layer', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: /Find/ }))
    await user.type(screen.getByRole('searchbox'), 'Dermot')

    await waitFor(() => {
      const marks = textLayer().querySelectorAll('mark.pdf-find-hit')
      expect(marks.length).toBeGreaterThan(0)
      expect(marks[0]?.textContent).toBe('Dermot')
    })
  })

  it('walks the hits and wraps at the end', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: /Find/ }))
    await user.type(screen.getByRole('searchbox'), 'Cruller')

    // Once per page, so the counter is a two-entry ring.
    expect(await screen.findByText('1 of 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next match' }))
    expect(await screen.findByText('2 of 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next match' }))
    expect(await screen.findByText('1 of 2')).toBeInTheDocument()
  })

  it('says so when nothing matches, and leaves the page alone', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: /Find/ }))
    await user.type(screen.getByRole('searchbox'), 'estoppel')

    expect(await screen.findByText('No matches')).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
  })

  it('closes and clears', async () => {
    const { user } = await open()

    await user.click(screen.getByRole('button', { name: /Find/ }))
    await user.type(screen.getByRole('searchbox'), 'Dermot')
    await screen.findByText('1 of 2')

    await user.click(screen.getByRole('button', { name: 'Close find' }))
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()

    // Reopening starts empty rather than restoring the last search, and the
    // marks from it are gone.
    await user.click(screen.getByRole('button', { name: /Find/ }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    await waitFor(() => expect(textLayer().querySelectorAll('mark').length).toBe(0))
  })
})

describe('the toolbar', () => {
  it('links to the file itself alongside the viewer', async () => {
    await open()

    const toolbarLink = screen.getByRole('link', { name: /Open/ })
    expect(toolbarLink).toHaveAttribute('href', SRC)
    expect(toolbarLink).toHaveAttribute('target', '_blank')
    // `noopener` matters on a target of `_blank`: without it the opened
    // document gets a handle back to this window.
    expect(toolbarLink.getAttribute('rel')).toContain('noopener')
  })

  it('names the scroll region for the reader who has to tab into it', async () => {
    await open()

    const frame = screen.getByLabelText('Notice of Rescission')
    expect(frame).toHaveAttribute('tabindex', '0')
    expect(within(frame).getByText((_, node) => node?.tagName === 'CANVAS')).toBeTruthy()
  })
})

describe('findMatches', () => {
  it('finds every occurrence, in reading order, across pages', () => {
    expect(findMatches(PAGES, 'Dermot Cruller')).toEqual([
      { page: 1, index: PAGES[0]?.indexOf('Dermot Cruller') },
      { page: 2, index: PAGES[1]?.indexOf('Dermot Cruller') },
    ])
  })

  it('ignores case', () => {
    expect(findMatches(['Rescission and rescission'], 'RESCISSION')).toHaveLength(2)
  })

  it('does not overlap a match with itself', () => {
    // Naively advancing by one would report three hits in `aaaa` for `aa`.
    expect(findMatches(['aaaa'], 'aa')).toEqual([
      { page: 1, index: 0 },
      { page: 1, index: 2 },
    ])
  })

  it('treats the query literally rather than as a pattern', () => {
    expect(findMatches(['s. 78 applies'], 's. 78')).toHaveLength(1)
    expect(findMatches(['sX78 applies'], 's. 78')).toHaveLength(0)
  })

  it('finds nothing for an empty query', () => {
    expect(findMatches(PAGES, '')).toEqual([])
  })
})
