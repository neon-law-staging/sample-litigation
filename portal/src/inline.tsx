// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'

/**
 * Two marks of inline Markdown, and no more.
 *
 * The data modules in this bundle are prose about code — `src/glossary.ts` and
 * `src/people.ts` both have to name a column, a path, or a frontmatter key in
 * the middle of a sentence. Written as plain strings those names lose the one
 * bit of typography that tells a reader "this is an identifier, read it
 * literally," and written as JSX they stop being data: a `<code>` element in
 * `glossary.ts` would put presentation in the file whose whole point is that it
 * holds none.
 *
 * So the strings carry `` `backticks` `` and `**emphasis**`, and this component
 * is the one place that knows what those mean. It is deliberately not a Markdown
 * parser — no links, no lists, no nesting, no HTML passthrough. The subset is
 * two marks because those are the two the prose needs, and every mark a renderer
 * supports is a mark somebody has to escape later.
 *
 * The failure it exists to prevent is visible rather than subtle: without it the
 * page shows the asterisks. `src/test/inline.test.tsx` asserts both directions —
 * that the marks become elements, and that nothing in the data leaks a raw mark
 * onto the page.
 */

/** One run of text, and how it is set. */
interface Run {
  text: string
  style: 'plain' | 'code' | 'strong'
}

/*
 * One expression, alternating the two marks, so a single pass splits the string
 * and the delimiters survive in the capture groups. `[^`]+` and `[^*]+` refuse
 * to cross their own delimiter, which is what keeps an unclosed mark from eating
 * the rest of the sentence — it stays literal text instead, which is the right
 * failure for prose.
 */
const MARKS = /(`[^`]+`|\*\*[^*]+\*\*)/g

/** Split a string into its runs. Exported for the test, not for callers. */
export function runsOf(source: string): Run[] {
  return source
    .split(MARKS)
    .filter((piece) => piece.length > 0)
    .map((piece) => {
      if (piece.startsWith('`') && piece.endsWith('`') && piece.length > 2) {
        return { text: piece.slice(1, -1), style: 'code' as const }
      }
      if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) {
        return { text: piece.slice(2, -2), style: 'strong' as const }
      }
      return { text: piece, style: 'plain' as const }
    })
}

/**
 * Render one string of light Markdown.
 *
 * Returns a fragment rather than a wrapper element, so the caller keeps control
 * of the block: `<p><Inline …/></p>` and `<dd><Inline …/></dd>` both work, and
 * neither inherits a `<div>` it did not ask for.
 */
export function Inline({ children }: { children: string }): ReactNode {
  return (
    <>
      {runsOf(children).map((run, index) => {
        const key = `${index}-${run.style}`
        if (run.style === 'code') {
          return (
            <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
              {run.text}
            </code>
          )
        }
        if (run.style === 'strong') {
          return (
            <strong key={key} className="font-semibold">
              {run.text}
            </strong>
          )
        }
        return <span key={key}>{run.text}</span>
      })}
    </>
  )
}
