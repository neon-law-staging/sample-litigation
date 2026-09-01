// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

// Nevada pleading paper, as furniture.
//
// Pleading paper is a typesetting problem before it is a drafting one: 28
// numbered lines down the left margin, a double rule beside them, a single rule
// at the right, and body text whose every baseline lands on one of the 28
// numbers. A line number that drifts half a line away from the text beside it
// is the tell that a document was typed rather than typeset, and it is the
// reason this file exists separately from the motion that uses it.
//
// Everything here is driven off one constant. `LINE` is the baseline-to-baseline
// distance, and every vertical measurement in this file and in any document
// that imports it is a whole multiple of it. That is the whole trick: the
// numbers are placed on an absolute grid in the page background, the text is
// laid out on the same grid in the flow, and the two cannot disagree because
// neither is measured from the other.
//
// Why the grid holds
// ------------------
// Typst gives each line a box whose height comes from the font's `top-edge` and
// `bottom-edge`, and inserts `leading` between boxes. Pinning both edges to
// absolute values makes the box height exactly `SIZE`, so
//
//   baseline-to-baseline = SIZE + leading = 12pt + 12pt = LINE
//
// independent of which glyphs are on the line — which is not true of the
// default `top-edge`, because that one is measured from the tallest glyph
// actually present and so changes when a line happens to have no ascenders.
//
// The same reasoning governs block spacing. Across a block boundary the
// baseline delta is `spacing + SIZE`, not `spacing`, so a spacing of `LINE`
// would silently push everything below it half a line off the numbers. `NEXT`
// and `SKIP` below are the only two vertical gaps this document uses, and both
// are derived rather than typed.

#let FONT = "Libertinus Serif"
#let SIZE = 12pt

/// Baseline-to-baseline. Double-spaced 12pt, which is what the line numbers count.
#let LINE = 24pt

/// Numbered lines per page. 28 is the Nevada and California convention.
#let LINES = 28

/// Distance from the top of a line box down to its baseline, pinned absolutely.
#let ASCENT = 9pt

/// Distance from the baseline down to the bottom of the line box.
#let DESCENT = SIZE - ASCENT

/// Top margin — the top of line 1's box.
#let TOP = 72pt

/// Height of the ruled text block: exactly the 28 lines it contains.
#let BLOCK = LINE * LINES

/// Bottom margin, so that the block plus the margins is exactly the page.
#let BOTTOM = 11in - TOP - BLOCK

// Block spacing, derived from the grid rather than guessed at. A block boundary
// costs `spacing + SIZE` between baselines, so these are the only two values
// that keep the text on the numbers.

/// No blank line: the next baseline is the next number.
#let NEXT = LINE - SIZE

/// One blank line between blocks.
#let SKIP = NEXT + LINE

// Horizontal furniture. The text block starts to the right of the rules, and
// the numbers sit to the left of them, so all four are stated together here
// rather than being spread across the file.
#let NUM-WIDTH = 0.92in
#let RULE-INNER = 1.12in
#let RULE-OUTER = 1.16in
#let RULE-RIGHT = 8.03in
#let MARGIN-LEFT = 1.4in
#let MARGIN-RIGHT = 8.5in - RULE-RIGHT + 0.12in

/// The line numbers and the three vertical rules, drawn identically on every page.
#let furniture() = {
  set text(font: FONT, size: SIZE, top-edge: ASCENT, bottom-edge: -DESCENT)

  // The numbers. `dy` is the top of the number's line box, and because that box
  // has the same pinned edges as a body line, its baseline lands on the same
  // grid position as the body text beside it.
  for n in range(1, LINES + 1) {
    place(
      top + left,
      dy: TOP + LINE * (n - 1),
      box(width: NUM-WIDTH, align(right, text(fill: luma(35%), str(n)))),
    )
  }

  // The rules span the text block exactly, which is what makes the block look
  // like ruled paper rather than like a box drawn around some text.
  for x in (RULE-OUTER, RULE-INNER, RULE-RIGHT) {
    place(top + left, dx: x, dy: TOP, line(angle: 90deg, length: BLOCK, stroke: 0.7pt))
  }
}

/// A pleading on 28-line paper.
///
/// `note` is the fixture disclaimer in the footer. It is a parameter rather than
/// a constant because it is the one piece of furniture that is about this
/// repository rather than about Nevada practice, and a document that borrowed
/// this file for a real filing should have to say so explicitly.
#let pleading(note: none, body) = {
  set page(
    width: 8.5in,
    height: 11in,
    margin: (left: MARGIN-LEFT, right: MARGIN-RIGHT, top: TOP, bottom: BOTTOM),
    background: furniture(),
    footer: context {
      set text(font: FONT, size: 9pt, fill: luma(35%))
      // Two columns, not three. The note has to fit on one line: the bottom
      // margin is only what the 28-line grid leaves over, so a footer that
      // wraps is a footer whose second line is off the page.
      grid(
        columns: (1fr, auto),
        align: (left, right),
        if note != none { note } else { [] },
        [Page #counter(page).display() of #counter(page).final().first()],
      )
    },
    footer-descent: 18pt,
  )

  set text(font: FONT, size: SIZE, top-edge: ASCENT, bottom-edge: -DESCENT, hyphenate: false)
  set par(leading: NEXT, spacing: NEXT, justify: false, first-line-indent: 0pt)

  body
}

/// A run of lines set flush left with no indent — attorney block, captions, signatures.
///
/// `align(left)` is not redundant. This is used inside `align(right, ...)` for
/// the signature blocks, and alignment inherits into the box, so without it a
/// signature block comes out right-ragged instead of flush against its own rule.
#let flush(body) = {
  set par(first-line-indent: 0pt, justify: false)
  set align(left)
  body
}

/// Body prose: indented first line, and the grid preserved across paragraphs.
#let prose(body) = {
  set par(first-line-indent: (amount: 0.5in, all: true), justify: true)
  body
}

/// A centered heading, bold and underlined, with a blank line on each side.
#let heading-centered(body) = block(above: SKIP, below: SKIP, width: 100%, align(
  center,
  strong(underline(body)),
))

/// A numbered section heading, flush left.
#let section(body) = block(above: SKIP, below: NEXT, strong(upper(body)))

/// The caption box: parties on the left, docket on the right, ruled top and bottom.
///
/// `lines` is the height in grid rows rather than in points, because the box has
/// to be a whole number of numbered lines or everything below it lands between
/// two numbers for the rest of the document.
///
/// The spacing below is `LINE` rather than `SKIP`, and that difference is the
/// one genuine trap in this file. A block whose height Typst measures from its
/// own text costs `spacing + SIZE` between the baselines either side of it, so
/// its gaps have to be `NEXT` or `SKIP`. A block given an explicit height — this
/// one — costs `spacing` exactly, so its gaps have to be whole multiples of
/// `LINE` instead. Using `SKIP` here would put every line after the caption
/// half a line above its own number, on every page of the document.
#let caption-box(lines: 9, parties, docket) = {
  let inner = LINE * lines
  block(
    above: SKIP,
    below: LINE,
    width: 100%,
    stroke: (top: 0.7pt, bottom: 0.7pt),
    inset: 0pt,
    grid(
      columns: (58%, 42%),
      rows: (inner,),
      stroke: (x, y) => if x == 1 { (left: 0.7pt) } else { none },
      // Inset `y: 0pt` for the same reason: any vertical padding here that is
      // not a multiple of `LINE` takes the caption text off the numbers.
      block(inset: (right: 8pt, y: 0pt), flush(parties)),
      block(inset: (left: 12pt, y: 0pt), flush(docket)),
    ),
  )
}
