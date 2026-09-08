// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest'

/*
 * The licensing invariants, asserted against the files themselves.
 *
 * Three things drift independently: the license text, the per-file notices, and
 * what the build actually publishes. A repository that declares AGPL in
 * `package.json` while carrying a reflowed license text, a new source file with
 * no notice, or a bundle whose minifier quietly ate the banner is not licensed
 * the way it says it is — and nothing else in this suite would notice.
 *
 * The files are read with `import.meta.glob` rather than `node:fs`, for the same
 * reason `bundle.test.ts` does it: nothing in a browser bundle should be able to
 * reach for `process`, and the way to guarantee that is to never put it in
 * scope.
 */

const SPDX = 'SPDX-License-Identifier: AGPL-3.0-or-later'
const COPYRIGHT = 'Copyright (C) 2026 Shook Law PLLC.'
const BUILD_FIRST = 'no dist/ — run `pnpm build` before `pnpm test`, or run `pnpm check`'

/*
 * The AGPL-3.0 text as the Free Software Foundation publishes it at
 * <https://www.gnu.org/licenses/agpl-3.0.txt>: 661 newlines, 34523 bytes. The
 * bounds pin the file without hashing it, so this test needs no crypto import.
 */
const LICENSE_NEWLINES = 661
const LICENSE_BYTES = 34523

// Globbed with a trailing `*` because Vite's glob plugin rejects a pattern with
// no extension. The pattern is deliberately wider than the one file it should
// find — `it is the only license file` below is what makes that width a check
// rather than an accident.
const licenses = import.meta.glob<string>('../../LICENSE*', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const manifests = import.meta.glob<string>('../../package.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const documents = import.meta.glob<string>('../../index.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Every file this project authors, plus the script that renders the documents it
// serves. `src/index.css` is absent on purpose: Vite's CSS plugin answers a
// `?raw` import with an empty string under the test environment, so the
// stylesheet's notice is asserted against the emitted asset instead.
const sources = import.meta.glob<string>(['../**/*.ts', '../**/*.tsx', '../../scripts/*.sh'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

// The published tree. These are the files a reader of the deployed portal
// receives, and the only license notice most of them will ever see.
const builtDocuments = import.meta.glob<string>('../../dist/index.html', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const builtScripts = import.meta.glob<string>('../../dist/assets/*.js', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const builtStyles = import.meta.glob<string>('../../dist/assets/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** The named file's contents, or a failure that says which file went missing. */
function only(files: Record<string, string>, missing: string): string {
  const text = Object.values(files)[0]
  if (typeof text !== 'string') throw new Error(missing)
  return text
}

/** The license text itself, picked out of the `LICENSE*` matches by exact name. */
function licenseText(): string {
  const entry = Object.entries(licenses).find(([path]) => path.endsWith('/LICENSE'))
  if (!entry) throw new Error('LICENSE is missing')
  return entry[1]
}

/** The paths under `sources` whose contents lack `needle`. */
function without(needle: string): string[] {
  return Object.entries(sources)
    .filter(([, text]) => !text.includes(needle))
    .map(([path]) => path)
}

describe('the license', () => {
  it('is the AGPL-3.0 text verbatim', () => {
    // Byte for byte, because a summary, a reflow, or a helpfully-updated URL is
    // no longer the license the SPDX identifier names.
    const text = licenseText()
    const lines = text.split('\n')

    expect(lines[0]).toBe('                    GNU AFFERO GENERAL PUBLIC LICENSE')
    expect(lines[1]).toBe('                       Version 3, 19 November 2007')
    expect(text).toContain(
      '13. Remote Network Interaction; Use with the GNU General Public License.',
    )
    expect(text.trimEnd().endsWith('<https://www.gnu.org/licenses/>.')).toBe(true)
    expect(lines.length - 1).toBe(LICENSE_NEWLINES)
    expect(text.length).toBe(LICENSE_BYTES)
  })

  it('is the only license file', () => {
    // One file, and it is the FSF's text. A repository that also carries a
    // guide, a summary, or a NOTICE has two things that can disagree about the
    // terms, and the reader has no way to know which one governs. The terms are
    // `LICENSE`; everything explaining them lives in the README, which nobody
    // mistakes for a grant.
    expect(Object.keys(licenses).map((path) => path.split('/').pop())).toEqual(['LICENSE'])
  })

  it('is the license `package.json` declares', () => {
    expect(only(manifests, 'package.json is missing')).toContain('"license": "AGPL-3.0-or-later"')
  })
})

describe('the license notices', () => {
  it('cover every source file', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(0)

    const bare = without(SPDX)
    expect(bare, `no AGPL notice in: ${bare.join(', ')}`).toEqual([])
  })

  it('name the copyright holder alongside the identifier', () => {
    // An SPDX tag alone says which terms apply but not whose grant it is.
    const unowned = without(COPYRIGHT)
    expect(unowned, `no copyright line in: ${unowned.join(', ')}`).toEqual([])
  })

  it('state the notice in full at the entry point', () => {
    const entry = only(
      import.meta.glob<string>('../main.tsx', { query: '?raw', import: 'default', eager: true }),
      'src/main.tsx is missing',
    )

    expect(entry).toContain('This program is free software')
    expect(entry).toContain('WITHOUT\n * ANY WARRANTY')
    expect(entry).toContain('https://www.gnu.org/licenses/')
    expect(entry).toContain(SPDX)
  })

  it('appear in the source document Navigator publishes', () => {
    expect(only(documents, 'index.html is missing')).toContain(SPDX)
  })
})

describe('the published bundle', () => {
  it('carries the notice in its entry document', () => {
    // Vite does not minify HTML, so the comment survives untouched. If a future
    // build step starts stripping comments, this is the check that says so.
    expect(only(builtDocuments, BUILD_FIRST)).toContain(SPDX)
  })

  it('carries the notice in its script', () => {
    // Added by the `portal-license-banner` plugin in `vite.config.ts`, after
    // code generation, because the minifier drops comments.
    expect(Object.keys(builtScripts).length, BUILD_FIRST).toBeGreaterThan(0)
    for (const [path, code] of Object.entries(builtScripts)) {
      expect(code, `no AGPL notice in ${path}`).toContain(SPDX)
    }
  })

  it('carries the notice in its stylesheet', () => {
    // `/*!` in `src/index.css` marks a legal comment, which the CSS minifier
    // keeps. Downgrade it to a plain comment and this fails.
    expect(Object.keys(builtStyles).length, BUILD_FIRST).toBeGreaterThan(0)
    for (const [path, css] of Object.entries(builtStyles)) {
      expect(css, `no AGPL notice in ${path}`).toContain(SPDX)
    }
  })
})
