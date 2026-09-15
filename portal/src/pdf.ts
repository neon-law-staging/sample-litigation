// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'

/**
 * Where the pdf.js worker is served from.
 *
 * `?url` makes Vite emit the worker as a hashed asset and hand back its URL
 * with the mount base already joined on, so it loads from Navigator's own
 * origin. That is not a preference: the portal serve CSP is `script-src 'self'`,
 * and a worker fetched from a CDN — which is what pdf.js reaches for when
 * `workerSrc` is unset under a bundler that cannot resolve it — is blocked
 * outright. The failure would look like a viewer that spins forever.
 *
 * It also has to be a real worker rather than none at all. pdf.js will parse on
 * the main thread if you let it, and a two-page document is enough to drop
 * frames while it does.
 *
 * The lint suppression is the `?url` suffix, not the module: oxlint resolves
 * the specifier literally, finds a worker bundle with no default export, and
 * reports it. Vite rewrites the whole specifier to a string long before that
 * export would matter.
 */
// oxlint-disable-next-line import/default
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

type PdfjsModule = typeof import('pdfjs-dist')

let pending: Promise<PdfjsModule> | null = null

/**
 * pdf.js itself, imported on first use.
 *
 * The dynamic import is what keeps a megabyte of PDF machinery out of the entry
 * chunk: a reader who never opens the documents tab never downloads it. The
 * promise is memoized so that the second document to open reuses the first
 * one's module — and dropped again if it rejects, so a failed load is
 * retryable rather than permanently poisoned.
 */
export function loadPdfjs(): Promise<PdfjsModule> {
  if (!pending) {
    const loading = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
      return pdfjs
    })
    loading.catch(() => {
      if (pending === loading) pending = null
    })
    pending = loading
  }
  return pending
}

/**
 * Begin loading the PDF at `url`.
 *
 * The loading task rather than the document, because the task is the half that
 * can be torn down: `destroy()` aborts the outstanding range requests and takes
 * the worker with it. A reader who clicks a second document while the first is
 * still arriving would otherwise leave that fetch running to completion, and
 * `PDFDocumentProxy` has no way to stop it.
 *
 * No `isEvalSupported` here, and none is needed: pdf.js 6 builds no functions
 * from strings, so nothing in it asks for the `unsafe-eval` the portal's CSP
 * withholds. The CSP-relevant decision is the worker URL above.
 */
export async function openDocument(url: string): Promise<PDFDocumentLoadingTask> {
  const pdfjs = await loadPdfjs()
  return pdfjs.getDocument({ url })
}

/**
 * The text of one page, as a single string.
 *
 * Runs are concatenated in the order pdf.js reports them, with a newline where
 * it marks the end of a line. This is what the find bar searches; it is not
 * what the text layer positions on screen, and the two can disagree — see the
 * note on highlighting in `PdfViewer`.
 */
export async function pageText(doc: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await doc.getPage(pageNumber)
  const content = await page.getTextContent()

  let text = ''
  for (const item of content.items) {
    // `getTextContent` yields marked-content markers alongside the text runs,
    // and only the runs carry `str`.
    if (!('str' in item)) continue
    text += item.str
    if (item.hasEOL) text += '\n'
  }
  return text
}

/** One hit for a find query: the page it is on, and where in that page's text. */
export interface PdfMatch {
  page: number
  index: number
}

/**
 * Every occurrence of `query` in the document, in reading order.
 *
 * Case-insensitive, and literal — a reader typing `s. 78` is looking for that
 * string, not a pattern. `texts` is the per-page text in page order, which the
 * caller caches so that typing a second character does not re-extract the
 * document.
 */
export function findMatches(texts: readonly string[], query: string): PdfMatch[] {
  const needle = query.toLowerCase()
  if (!needle) return []

  const matches: PdfMatch[] = []
  texts.forEach((text, offset) => {
    const haystack = text.toLowerCase()
    let index = haystack.indexOf(needle)
    while (index !== -1) {
      matches.push({ page: offset + 1, index })
      index = haystack.indexOf(needle, index + needle.length)
    }
  })
  return matches
}
