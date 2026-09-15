// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LoaderCircle,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
  TextLayer,
} from 'pdfjs-dist'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { findMatches, loadPdfjs, openDocument, pageText, type PdfMatch } from './pdf'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The document viewer.
 *
 * navigator-ux ships a `PdfViewer`, and this is deliberately not it. The
 * library's is a leaf component by its own contract — it takes a `src` and a
 * `label` and renders a page — which is the right shape for a library and the
 * wrong one for this tab, where the viewer has to answer questions about a
 * matter: find a phrase across every page of a document, hold a zoom while the reader
 * switches documents, and degrade to a plain link when pdf.js cannot start.
 * Owning it here means those behaviors are editable rather than wrapped.
 *
 * What it does not own is the parsing. pdf.js does that, in a worker, and this
 * component is the chrome around it: paint a page to canvas, lay the selectable
 * text over it, and keep the two in step through every zoom and page change.
 */

/*
 * `set-state-in-effect` is off for this file, and only this file.
 *
 * The rule is right in general: an effect that sets state during the same
 * commit is usually a value that should have been derived during render. Here it
 * is not. Every effect below synchronizes with pdf.js — opening a document,
 * painting a page, extracting page text — and each of those is asynchronous work
 * against an external system whose result cannot be computed while rendering. A
 * document that has not loaded yet has no page count to derive anything from.
 *
 * The rule's own advice ("use an effect only when synchronizing with an external
 * system") is exactly what this component does, which is why the suppression is
 * a file-level statement about what the file is rather than three scattered
 * apologies. It is scoped to this file so the rule keeps guarding the rest of
 * the app, where there is no external system to synchronize with.
 */
/* oxlint-disable react/set-state-in-effect */

const MIN_SCALE = 0.5
const MAX_SCALE = 4
const ZOOM_STEP = 0.25

/** Breathing room left around the page when fitting it to the frame. */
const FIT_PADDING = 32

type Status = 'loading' | 'ready' | 'error'

export interface PdfViewerProps {
  /**
   * URL of the PDF. Same-origin.
   *
   * Here that is a static file under the mount, because the sample project
   * ships its own documents. In Navigator it is blob storage, with
   * authorization rules tailored to the Project deciding who may read the
   * document behind the URL. Either way it is fetched from Navigator's origin
   * under the reader's session, which is what lets this component hold no
   * credential and make no authorization decision of its own.
   */
  src: string
  /** Names the document for assistive technology. */
  label: string
  className?: string
}

export function PdfViewer({ src, label, className }: PdfViewerProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [failure, setFailure] = useState('')

  const [pageNumber, setPageNumber] = useState(1)
  const [fitWidth, setFitWidth] = useState(true)
  const [manualScale, setManualScale] = useState(1)
  const [renderedScale, setRenderedScale] = useState(1)
  const [frameWidth, setFrameWidth] = useState(0)

  const [findOpen, setFindOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<PdfMatch[]>([])
  const [activeMatch, setActiveMatch] = useState(0)

  const frameRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textRef = useRef<HTMLDivElement | null>(null)
  /**
   * The paint in flight, held across effect runs rather than inside one.
   *
   * pdf.js locks a canvas for the duration of a render and throws outright if a
   * second one starts on it — so the run that is about to paint has to be able
   * to reach the run that is already painting, whichever effect started it.
   */
  const renderRef = useRef<RenderTask | null>(null)
  /** Every page's text, extracted once per document and reused for each query. */
  const textsRef = useRef<string[] | null>(null)

  const total = doc?.numPages ?? 0

  /* ------------------------------------------------------------- the file */

  useEffect(() => {
    let cancelled = false
    let loading: PDFDocumentLoadingTask | null = null

    setStatus('loading')
    setFailure('')
    setDoc(null)
    setPageNumber(1)
    setMatches([])
    textsRef.current = null

    const open = async () => {
      const task = await openDocument(src)
      loading = task
      // Nothing is watching this document any more — the reader switched files
      // while it was loading. Tear it down rather than leave the fetch running
      // and the worker allocated.
      if (cancelled) {
        void task.destroy().catch(ignore)
        return
      }

      const next = await task.promise
      if (cancelled) return
      setDoc(next)
      setStatus('ready')
    }

    open().catch((cause: unknown) => {
      if (cancelled) return
      setFailure(messageFor(cause))
      setStatus('error')
    })

    return () => {
      cancelled = true
      void loading?.destroy().catch(ignore)
    }
  }, [src])

  /* ------------------------------------------------------ the frame width */

  // Fit-to-width needs the frame's inner width, and the frame changes size
  // without the window doing anything — the documents tab lays it beside a
  // panel that reflows. `ResizeObserver` sees that; a window `resize` listener
  // does not, and is the fallback only because jsdom has no observer.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const measure = () => setFrameWidth(frame.clientWidth)
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  /* ----------------------------------------------------------- the page */

  useEffect(() => {
    const canvas = canvasRef.current
    const textLayer = textRef.current
    if (!doc || !canvas || !textLayer) return

    let cancelled = false
    let layer: TextLayer | null = null

    const draw = async () => {
      // Cancelling the previous paint is not enough on its own: pdf.js releases
      // the canvas when the cancelled task *settles*, not when `cancel()`
      // returns. Starting the next render before then is what raises "cannot
      // use the same canvas during multiple render() operations" — and because
      // that throw lands in a superseded run, it surfaces as a page that paints
      // and then never gets its text layer, rather than as an error.
      const previous = renderRef.current
      if (previous) {
        previous.cancel()
        await previous.promise.catch(ignore)
      }
      if (cancelled) return

      const page = await doc.getPage(pageNumber)
      if (cancelled) return

      const unscaled = page.getViewport({ scale: 1 })
      const scale =
        fitWidth && frameWidth > 0
          ? clamp((frameWidth - FIT_PADDING) / unscaled.width, MIN_SCALE, MAX_SCALE)
          : manualScale
      const viewport = page.getViewport({ scale })

      // The canvas is sized in device pixels and displayed in CSS pixels, so a
      // page on a 2× display is painted at twice the resolution rather than
      // scaled up from a blurry one. The transform is what tells pdf.js to draw
      // into the larger buffer.
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const task = page.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      })
      renderRef.current = task
      try {
        await task.promise
      } finally {
        // Only clear the slot if it is still this task's: a newer run may have
        // claimed it while this one was being cancelled.
        if (renderRef.current === task) renderRef.current = null
      }
      if (cancelled) return

      // The text layer sits exactly over the canvas in CSS pixels, and pdf.js
      // positions each run against `--total-scale-factor`. Set the size in
      // device pixels or forget the variable, and the selectable text drifts
      // off the glyphs it belongs to at every zoom but 100%.
      textLayer.replaceChildren()
      textLayer.style.width = `${Math.floor(viewport.width)}px`
      textLayer.style.height = `${Math.floor(viewport.height)}px`
      textLayer.style.setProperty('--total-scale-factor', String(scale))

      const pdfjs = await loadPdfjs()
      if (cancelled) return

      layer = new pdfjs.TextLayer({
        textContentSource: await page.getTextContent(),
        container: textLayer,
        viewport,
      })
      await layer.render()
      if (cancelled) return

      markHits(textLayer, query)
      setRenderedScale(scale)
    }

    draw().catch((cause: unknown) => {
      // A cancelled render is the expected result of changing page mid-paint,
      // not a failure to report.
      if (cancelled || isCancellation(cause)) return
      setFailure(messageFor(cause))
      setStatus('error')
    })

    return () => {
      cancelled = true
      renderRef.current?.cancel()
      layer?.cancel()
    }
  }, [doc, pageNumber, fitWidth, manualScale, frameWidth, query])

  /* ----------------------------------------------------------- searching */

  useEffect(() => {
    const needle = query.trim()
    if (!doc || !needle) {
      setMatches([])
      setActiveMatch(0)
      return
    }

    let cancelled = false

    const run = async () => {
      // Extracted once per document: typing a second character re-searches
      // strings that are already in hand rather than re-reading the file.
      if (!textsRef.current) {
        const pages = await Promise.all(
          Array.from({ length: doc.numPages }, (_unused, index) => pageText(doc, index + 1)),
        )
        if (cancelled) return
        textsRef.current = pages
      }

      const found = findMatches(textsRef.current, needle)
      if (cancelled) return
      setMatches(found)
      setActiveMatch(0)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [doc, query])

  // Following a hit is a page change, and the page effect above repaints with
  // the query still set, so the run arrives already marked.
  const current = matches[activeMatch]
  useEffect(() => {
    if (current) setPageNumber(current.page)
  }, [current])

  /* ----------------------------------------------------------- the chrome */

  const goTo = useCallback(
    (next: number) => {
      if (total > 0) setPageNumber(clamp(next, 1, total))
    },
    [total],
  )

  const zoomBy = useCallback(
    (delta: number) => {
      setFitWidth(false)
      setManualScale(clamp(roundTo(renderedScale + delta, 100), MIN_SCALE, MAX_SCALE))
    },
    [renderedScale],
  )

  const stepMatch = useCallback(
    (delta: number) => {
      if (matches.length === 0) return
      setActiveMatch((index) => (index + delta + matches.length) % matches.length)
    },
    [matches.length],
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Arrow keys are left alone: inside a text layer they belong to the
    // caret, and stealing them would break selecting a quotation.
    if (event.key === 'PageDown') goTo(pageNumber + 1)
    else if (event.key === 'PageUp') goTo(pageNumber - 1)
    else if (event.key === 'Home') goTo(1)
    else if (event.key === 'End') goTo(total)
    else return
    event.preventDefault()
  }

  return (
    <div className={cn('flex flex-col overflow-hidden bg-muted/40', className)}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-y bg-card px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => goTo(pageNumber - 1)}
            disabled={status !== 'ready' || pageNumber <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <p className="min-w-24 text-center font-mono text-xs tabular-nums text-muted-foreground">
            {status === 'ready' ? `Page ${pageNumber} of ${total}` : 'Page — of —'}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => goTo(pageNumber + 1)}
            disabled={status !== 'ready' || pageNumber >= total}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomBy(-ZOOM_STEP)}
            disabled={status !== 'ready' || renderedScale <= MIN_SCALE}
            aria-label="Zoom out"
          >
            <ZoomOut />
          </Button>
          <p className="min-w-12 text-center font-mono text-xs tabular-nums text-muted-foreground">
            {status === 'ready' ? `${Math.round(renderedScale * 100)}%` : '—'}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={status !== 'ready' || renderedScale >= MAX_SCALE}
            aria-label="Zoom in"
          >
            <ZoomIn />
          </Button>
          <Button
            variant={fitWidth ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFitWidth(true)}
            disabled={status !== 'ready'}
            aria-pressed={fitWidth}
          >
            Fit width
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={findOpen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFindOpen((open) => !open)}
            disabled={status !== 'ready'}
            aria-expanded={findOpen}
          >
            <Search /> Find
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={src} target="_blank" rel="noreferrer noopener">
              Open <ExternalLink />
            </a>
          </Button>
        </div>
      </div>

      {findOpen ? (
        <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
          <label className="sr-only" htmlFor="pdf-find">
            Find in {label}
          </label>
          <input
            id="pdf-find"
            type="search"
            value={query}
            autoComplete="off"
            placeholder="Find in document"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              stepMatch(event.shiftKey ? -1 : 1)
            }}
            className="h-8 w-56 rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p aria-live="polite" className="font-mono text-xs tabular-nums text-muted-foreground">
            {query.trim() === ''
              ? 'Type to search'
              : matches.length === 0
                ? 'No matches'
                : `${activeMatch + 1} of ${matches.length}`}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => stepMatch(-1)}
            disabled={matches.length === 0}
            aria-label="Previous match"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => stepMatch(1)}
            disabled={matches.length === 0}
            aria-label="Next match"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto size-8"
            onClick={() => {
              setFindOpen(false)
              setQuery('')
            }}
            aria-label="Close find"
          >
            <X />
          </Button>
        </div>
      ) : null}

      {/*
        `tabIndex` makes the scroller focusable, which is what gives a keyboard
        reader the scroll keys at all — and is why `onKeyDown` only claims the
        paging ones.
      */}
      <div
        ref={frameRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label={label}
        className="relative min-h-80 flex-1 overflow-auto p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="relative mx-auto w-fit">
          {/*
            The canvas is the picture of the page and the text layer is its
            text, so the canvas is hidden from assistive technology: announcing
            both would read every document twice.
          */}
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={cn(
              'block rounded-sm bg-white shadow-md',
              status === 'ready' ? '' : 'hidden',
            )}
          />
          <div ref={textRef} className="pdf-text-layer" />
        </div>

        {status === 'loading' ? (
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading {label}…
          </p>
        ) : null}

        {status === 'error' ? (
          <div className="mx-auto max-w-md py-12 text-center text-sm">
            <p className="font-serif font-semibold">This document could not be displayed.</p>
            <p className="mt-1 text-muted-foreground">{failure}</p>
            <p className="mt-3">
              <a className="text-primary underline underline-offset-4" href={src}>
                Open {label} directly
              </a>
            </p>
          </div>
        ) : null}
      </div>

      {/*
        Named rather than a bare "Page 2 of 2": this fires on every page change,
        and a reader with two documents open hears which one moved.
      */}
      <p aria-live="polite" className="sr-only">
        {status === 'ready' ? `${label}, showing page ${pageNumber} of ${total}` : ''}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ helpers */

/** Swallow a teardown rejection: the caller is already walking away. */
function ignore(): undefined {
  return undefined
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high)
}

/** `value` rounded to the nearest 1/`step` — keeps zoom labels off 74.9999%. */
function roundTo(value: number, step: number): number {
  return Math.round(value * step) / step
}

function isCancellation(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'RenderingCancelledException'
}

function messageFor(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : 'The document could not be read.'
}

/**
 * Wrap each occurrence of `query` in the rendered text layer with a `<mark>`.
 *
 * The text layer's own glyphs are transparent — they exist to be selected, not
 * seen — so a highlight here is a colored background sitting exactly over the
 * painted text on the canvas beneath.
 *
 * One honest limitation: pdf.js splits a page into positioned runs, and a match
 * straddling two of them cannot be wrapped by a single element. Those hits
 * still count in the find bar and still turn the page; they just arrive
 * unmarked. Counting from the page's joined text rather than from the runs is
 * what keeps the tally right in that case.
 */
function markHits(container: HTMLElement, query: string): void {
  const needle = query.trim().toLowerCase()
  if (needle === '') return

  for (const span of Array.from(container.querySelectorAll('span'))) {
    // Only leaf runs: pdf.js nests spans under marked content, and rewriting a
    // parent would throw away the children it positions.
    if (span.childElementCount > 0) continue

    const text = span.textContent
    if (!text) continue
    const haystack = text.toLowerCase()
    if (!haystack.includes(needle)) continue

    const rebuilt = document.createDocumentFragment()
    let at = 0
    for (;;) {
      const hit = haystack.indexOf(needle, at)
      if (hit === -1) break
      if (hit > at) rebuilt.append(text.slice(at, hit))
      const mark = document.createElement('mark')
      mark.className = 'pdf-find-hit'
      mark.textContent = text.slice(hit, hit + needle.length)
      rebuilt.append(mark)
      at = hit + needle.length
    }
    if (at < text.length) rebuilt.append(text.slice(at))
    span.replaceChildren(rebuilt)
  }
}
