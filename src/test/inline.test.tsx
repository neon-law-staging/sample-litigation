// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GLOSSARY } from '../glossary'
import { Inline, runsOf } from '../inline'
import { NAVIGATOR_PEOPLE } from '../people'

/*
 * The inline formatter, from both ends.
 *
 * The interesting assertions are the second describe block: the data files are
 * where the marks are written, so the check that matters is that every string
 * they hold survives the renderer with no mark left showing. A formatter that
 * works on its own test fixtures and drops an asterisk onto the page is the bug
 * this file is here to catch.
 */

describe('the inline formatter', () => {
  it('turns backticks into code and double asterisks into emphasis', () => {
    render(
      <p>
        <Inline>{'The `code:` key is **required** on every template.'}</Inline>
      </p>,
    )

    expect(screen.getByText('code:').tagName).toBe('CODE')
    expect(screen.getByText('required').tagName).toBe('STRONG')
    expect(screen.getByText(/on every template/)).toBeInTheDocument()
  })

  it('leaves an unclosed mark as literal text rather than eating the sentence', () => {
    // The right failure for prose: a stray backtick should look like a typo,
    // not silently swallow the rest of the paragraph into a code span.
    const runs = runsOf('a stray ` backtick and then some more words')
    expect(runs).toEqual([{ text: 'a stray ` backtick and then some more words', style: 'plain' }])
  })

  it('keeps an empty mark literal', () => {
    // `` and **** are not a code span and not emphasis — they are punctuation
    // somebody typed, and the slice that would strip them produces nothing.
    expect(runsOf('`` and ****').every((run) => run.style === 'plain')).toBe(true)
  })
})

describe('the data the formatter renders', () => {
  const strings = [
    ...GLOSSARY.flatMap((term) => [term.definition, term.here]),
    ...NAVIGATOR_PEOPLE.map((person) => person.note),
  ]

  it('leaves no mark visible once rendered', () => {
    for (const source of strings) {
      const text = runsOf(source)
        .map((run) => run.text)
        .join('')
      expect(text, source).not.toContain('`')
      expect(text, source).not.toContain('**')
    }
  })

  it('balances every mark it opens', () => {
    // An odd count means one of them is literal, which the renderer handles but
    // the author almost certainly did not intend.
    for (const source of strings) {
      expect((source.match(/`/g) ?? []).length % 2, source).toBe(0)
      expect((source.match(/\*\*/g) ?? []).length % 2, source).toBe(0)
    }
  })
})
