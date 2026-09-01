// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The documents in the matter.
 *
 * All three PDFs are real files produced by `navigator template render` from
 * the notation templates in `templates/neon_law/`, and `pnpm render:documents`
 * regenerates them. Nothing here is hand-authored PDF: if the prose in a
 * document is wrong, the template is wrong, and the fix is upstream of this
 * file.
 *
 * `path` is relative to the bundle mount. It is joined through `portalPath` at
 * the point of use rather than written absolute, for the same reason every
 * other link in this app is — a hardcoded `/app/projects/sample-litigation/...` breaks
 * silently the day the mount moves.
 *
 * These are static files beside the bundle **because this is the sample
 * project**. In Navigator the documents of a real matter are loaded from blob
 * storage, and that storage carries authorization rules tailored to the
 * Project: who may read a document is decided there, per project, rather than
 * by anything in a bundle the reader has already downloaded.
 *
 * That difference does not reach the viewer. `PdfViewer` takes a URL and reads
 * it same-origin, so the change is where `path` points — not how the document
 * is opened, painted, or searched.
 */

export interface MatterDocument {
  id: string
  title: string
  /** What it is, procedurally. */
  kind: string
  /** Path under the mount, without a leading slash. */
  path: string
  /** The notation template it was rendered from. */
  template: string
  /** The `code:` in that template's frontmatter. */
  code: string
  /**
   * The render profile the template declares in its `output:` frontmatter.
   * `letter` is Neon Law letterhead; `plain` is the default page. It is the one
   * place a template says what the finished document should look like, which is
   * why it belongs beside the template rather than in the component that draws
   * the card.
   */
  format: 'plain' | 'letter'
  date: string
  dateLabel: string
  /**
   * Pages in the rendered PDF, shown on the card before the viewer has parsed
   * anything. It is a fact about the artefact rather than about the template, so
   * it can go stale when the renderer changes how it typesets — check it after
   * `pnpm render:documents` rather than assuming a template edit left it alone.
   */
  pages: number
  /** Why this document matters — to Count II, or to the representation itself. */
  why: string
  /**
   * Where the document is in its own life. `signed` is an executed instrument
   * rather than a step in the pleading, which is why the engagement letter
   * carries it and the two litigation documents do not.
   */
  status: 'signed' | 'served' | 'draft'
}

/*
 * In date order, which is also the order they matter in: the engagement letter
 * is the document that makes the other two possible, and it is the one open
 * when the tab is reached.
 */
export const DOCUMENTS: MatterDocument[] = [
  {
    id: 'engagement',
    title: 'Engagement Letter',
    kind: 'Engagement letter',
    path: 'documents/engagement-letter-dermot-cruller.pdf',
    template: 'templates/neon_law/nevada_engagement_letter.md',
    code: 'engagement_letter__nevada',
    format: 'letter',
    date: '2026-04-20',
    dateLabel: '20 April 2026',
    pages: 4,
    why: 'The engagement itself — signed five days after Dermot learned of the soul term, and the reason a document dated 2 May can say "through counsel". It is also where the matter is committed to arbitration rather than to a jury: the recorded covenants for the street require these neighbors to arbitrate before either of them may try a claim of this kind.',
    status: 'signed',
  },
  {
    id: 'notice',
    title: 'Notice of Rescission',
    kind: 'Notice',
    path: 'documents/notice-of-rescission.pdf',
    template: 'templates/neon_law/nevada.md',
    code: 'rescission_notice__nevada',
    format: 'plain',
    date: '2026-05-02',
    dateLabel: '2 May 2026',
    pages: 2,
    why: 'Served seventeen days after discovery. Prompt notice on discovery is what answers the laches half of the defense, and the date on this document is the proof of it.',
    status: 'served',
  },
  {
    id: 'affidavit',
    title: 'Affidavit of Odile Cruller',
    kind: 'Affidavit',
    path: 'documents/affidavit-odile-cruller.pdf',
    template: 'templates/neon_law/nevada_affidavit.md',
    code: 'witness_affidavit__nevada',
    format: 'plain',
    date: '2026-06-11',
    dateLabel: '11 June 2026',
    pages: 1,
    why: 'The contemporaneous notebook, sworn to. It is the only evidence bearing directly on what Dermot knew on 14 April 2026 — the fact the entire count turns on.',
    status: 'draft',
  },
]
