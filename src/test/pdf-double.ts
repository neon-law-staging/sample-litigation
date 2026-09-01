// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * A stand-in for `src/pdf.ts`, for the tests that render the viewer.
 *
 * pdf.js cannot run here and should not be asked to: jsdom has no canvas
 * raster, no worker, and — the part that actually decides it — no
 * `requestAnimationFrame` loop of the kind pdf.js continues its render on. A
 * test that drove the real library would be testing the environment's shims.
 *
 * So the seam is this repository's own module rather than the library. What is
 * left under test is everything this repository wrote: which page is asked for,
 * how the canvas and the text layer are sized against the viewport, when a
 * paint is cancelled, and what the find bar does with the result. The double is
 * deliberately faithful about the shapes pdf.js returns, because those shapes
 * are the contract the component is written against.
 */

/** The fake document's text, one entry per page. */
export const PAGES = [
  'Notice of Rescission. Dermot Cruller gives notice that the instrument is rescinded.',
  'The doughnut was consumed in two sittings. Dermot Cruller rescinds the whole of it.',
]

interface Viewport {
  width: number
  height: number
}

interface TextLayerOptions {
  container: HTMLElement
  textContentSource: { items: { str: string }[] }
}

/** How the next call to `openDocument` should behave. */
let failure: string | null = null

/** Pages whose paint should hang, so a test can supersede one mid-render. */
const stalled = new Set<number>()

export function failNextOpen(message: string | null): void {
  failure = message
}

export function stallPage(pageNumber: number): void {
  stalled.add(pageNumber)
}

export function resetPdfDouble(): void {
  failure = null
  stalled.clear()
  cancelledPaints.length = 0
}

/** Every page number whose paint was cancelled, in the order it happened. */
export const cancelledPaints: number[] = []

function fakePage(pageNumber: number) {
  return {
    // The real viewport carries far more than this; these are the two fields
    // the viewer reads, and the scaling relationship between them is the thing
    // worth keeping honest — US Letter at 72dpi.
    getViewport: ({ scale }: { scale: number }): Viewport => ({
      width: 612 * scale,
      height: 792 * scale,
    }),

    render: () => {
      let settle: (() => void) | undefined
      const promise = stalled.has(pageNumber)
        ? new Promise<void>((resolve) => {
            settle = resolve
          })
        : Promise.resolve()

      return {
        promise,
        cancel: () => {
          cancelledPaints.push(pageNumber)
          settle?.()
        },
      }
    },

    getTextContent: () =>
      Promise.resolve({ items: [{ str: PAGES[pageNumber - 1] ?? '', hasEOL: true }] }),
  }
}

const FAKE_DOCUMENT = {
  numPages: PAGES.length,
  getPage: (pageNumber: number) => Promise.resolve(fakePage(pageNumber)),
}

/**
 * The exports that replace `src/pdf.ts`.
 *
 * `findMatches` is not among them — it is pure, and the tests run the real one.
 */
export function pdfDouble() {
  return {
    openDocument: (_url: string) =>
      Promise.resolve({
        promise: failure === null ? Promise.resolve(FAKE_DOCUMENT) : Promise.reject(new Error(failure)),
        destroy: () => Promise.resolve(),
      }),

    loadPdfjs: () =>
      Promise.resolve({
        // One positioned run per text item, which is what pdf.js emits and
        // what the find-bar highlighting walks.
        TextLayer: class {
          #container: HTMLElement
          #source: TextLayerOptions['textContentSource']

          constructor({ container, textContentSource }: TextLayerOptions) {
            this.#container = container
            this.#source = textContentSource
          }

          render(): Promise<void> {
            for (const item of this.#source.items) {
              const span = document.createElement('span')
              span.textContent = item.str
              this.#container.append(span)
            }
            return Promise.resolve()
          }

          cancel(): void {}
        },
      }),

    pageText: (_doc: unknown, pageNumber: number) => Promise.resolve(PAGES[pageNumber - 1] ?? ''),
  }
}
