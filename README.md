# Navigator Sample Project — Litigation

The reference **project application** for [Navigator](https://github.com/neon-law-source-code/navigator): a client
portal for the fixture matter *Cruller v. Prine*.

It exists so that "attach a React app to a matter" has a worked example a contributor can read, clone, and copy — and so
Navigator's own local development loop has something real to build and serve instead of a hardcoded HTML string.

**Everything here is fixture data.** *Cruller v. Prine* is a simulated matter. No client data belongs in this
repository, ever.

## Where it mounts

Navigator serves this bundle at:

```text
/app/projects/sample-litigation/portal/
```

which you can find at <https://staging.neonlaw.com>

## Run it locally

Node >= 22 and pnpm 11. The Vite workspace is `portal/`; run its commands there:

```bash
cd portal
```

Then install and start it:

```bash
pnpm install
```

```bash
pnpm dev
```

### Documents

No PDF under `portal/dist/documents/` is hand-authored.

Five come from `navigator notations render`.

Their notation templates are in Navigator's shared catalog, not here.

The motion comes from Typst.

*The motion is typeset, not templated* below is why it is not a notation template like the others.

The notation ones come from Markdown carrying a questionnaire and a workflow in its frontmatter. The renderer validates
against the same rule set as `navigator project gate` and refuses a template with any violation, so a PDF that exists is
a template that passed.

There are five: the summons that opened the trespass count already before the Eighth Judicial District Court, the
engagement letter that opens the representation, the notice of rescission served on the defendant, the affidavit of the
witness whose notebook the count turns on, and the answer to Prine's counterclaim that Count II drew in return. The
engagement letter is the one that declares a **render profile** — `output: letter` in its frontmatter — so it arrives on
Neon Law letterhead while the other four render as plain pages. That key is the one place a template says what the
finished document should look like, which is why `MatterDocument.format` carries it to the card rather than letting the
component guess from the title.

None of those five lives in this repository, and that is the second reversal worth knowing about. They are
jurisdiction-wide Neon Law forms — `jurisdiction: NV`, titles like "Summons (Nevada)" — and they belong to Navigator's
shared catalog under `templates/notations/neon_law/shared/`. This matter **references** each one by its `code`, which is
the identity Navigator resolves: when no `templates/<code>.md` exists here, notation creation finds the workspace-shared
row and pins that exact version, so provenance stays with the catalog. Carrying a copy would shadow the shared code and
persist a matter-scoped version of global reference data, which is backwards — and a renamed code is a different
template, not a refactor, because there is no alias and no migration path. So the codes in `portal/src/documents.ts` are
fixed: `summons__nevada`, `rescission_notice__nevada`, `engagement_letter__nevada`, `witness_affidavit__nevada`, and
`answer_to_counterclaim__nevada`. This repository's own flat `templates/` holds only blueprints that are genuinely
specific to this matter.

They are **generated during the build rather than committed**, which is a reversal of what this repository used to do
and worth understanding before changing it. The repository gate refuses a rendered PDF anywhere in this tree except
`dist/` — it follows the bytes rather than the path, so moving them elsewhere does not help — and `dist/` is the one
directory `vite build` owns. So both render scripts run as `postbuild`, after Vite has emptied and refilled it, and
`pnpm test` gets all six because it builds first. `portal/src/test/bundle.test.ts` asserts every one of them reaches
`dist/`; Vite otherwise would not notice them going missing.

That is also why `portal/scripts/toolchain.sh` exists. The reusable gate this repository is pinned to does install the
Navigator CLI, but only after it has run `typecheck`, `test`, and `build`, and it never installs Typst at all — and a
caller pinned to an immutable release tag cannot reorder that job. So the build fetches both tools itself, the CLI at
the exact version `navigator.yaml` pins, and skips the download entirely when they are already on `PATH`. Nothing is
written inside the checkout.

`pnpm validate` is the check that keeps this matter's own blueprints renderable: `navigator project gate` runs the whole
rule set over the whole tree, templates included, and the gate's `verify` job runs it in CI on every pull request. The
notation rule set is versioned in Navigator rather than here, which means a template can stop validating without
anything in this repository changing: that is exactly what happened to the `staff_review` workflow state these templates
used to carry, before `N106` began requiring the `lawyer_review` gate that every one of them now names.

### The viewer is ours

The documents tab uses this repository's `portal/src/PdfViewer.tsx`, not a browser or navigator-ux viewer.

The library contract makes it a leaf component.

It takes a `src` and a `label` and renders a page.

That shape is right for a library but wrong for this tab. The viewer must find a phrase across every page, retain zoom
while the reader switches documents, and degrade to a plain link when it cannot start. Owning it keeps those behaviors
editable rather than wrapped.

What it does not own is the parsing. `pdfjs-dist` does that, in a worker, and the component is the chrome around it:
paint the page to a canvas, lay pdf.js's transparent text runs over it so the page can be selected and read aloud, and
keep the two in step through every zoom and page turn. Three things about that are load- bearing enough to be worth
knowing before editing it:

- **The worker is same-origin, and hashed.** `portal/src/pdf.ts` imports it with Vite's `?url` suffix.
  The build emits it under the mount, avoiding the CSP-blocked CDN fallback that leaves a reader staring at a spinner.
  `bundle.test.ts` asserts the emitted worker and the URL that reaches it.
- **pdf.js is loaded on demand.** The import inside `loadPdfjs()` is dynamic, which splits the parser into its own
  chunk: a reader who never opens this tab never downloads it. It is nearly half the JavaScript in the build, so a
  static import anywhere in `portal/src/pdf.ts` would quietly cost every other page. That is a test too.
- **One paint per canvas.** pdf.js locks a canvas for the duration of a render and throws if a second starts on it, and
  it releases that lock when a cancelled render *settles* rather than when `cancel()` returns. So a new paint cancels
  its predecessor and then waits for it. Skip the wait and the symptom is not an error — it is a page that paints and
  then never gets its text layer.

The find bar counts hits in the text pdf.js reports for each page, and highlights them by wrapping runs in the rendered
text layer. Those two can disagree: a match straddling two positioned runs is counted and turns the page, but arrives
unmarked. Counting from the page text rather than from the runs is what keeps the tally honest in that case.

### The people, and the glossary

Two data files answer questions the graph cannot.

`portal/src/people.ts` holds two rosters that look alike and mean different things. One is the **Navigator Persons** —
rows that can sign in, each with a system-wide tier and a participation row on this Project. The other is the **cast in
the pleaded facts**, the Cruller and Prine households. Dermot Cruller is the plaintiff and has no account; Cleo Client
has an account and is not the plaintiff. Keeping those two facts side by side is the point of the file: participation is
a property of a Person–Project Role row, a party is a fact in a pleading, and Navigator never lets the second grant the
first. The Navigator Persons are the five the development seed writes, spelled the way it spells them — including the
Admin who deliberately gets no participation row and therefore cannot reach this matter at all.

`portal/src/glossary.ts` is the vocabulary, scoped. Navigator keeps **one** canonical glossary.

This file paraphrases Navigator terms, identifies a local source, and links to the canonical definition. That definition
governs when the two disagree.

It exists because the same word can mean a pleading to a lawyer and a table to this codebase. Matter and Project are one
row. Person is a login, not a party. Letter is a piece of mail in the schema and a render profile in a template's
frontmatter. A contributor who has not been told that reads every file in this repository slightly wrong.

### The authorities are real

Everything about the matter is invented. The citations on the research tab are not: each was retrieved from Midpage or
CourtListener and checked against the opinion or statute text before it was written down, and every quote in
`portal/src/research.ts` is verbatim. `Authority.verified` lets the page say so on the card.

A demo that blurs real law into fixture data teaches a reader to trust a citation because it looked like one. The card's
"Read it on Midpage" / "Read it on CourtListener" label is derived from the authority's own URL rather than hardcoded,
since `dr-horton` came from CourtListener while the rest came from Midpage — a wrong label would be exactly the kind of
thing this section warns against.

### Discovery is two voices, not one

`#discovery` renders one written exchange: Plaintiff's first set of interrogatories to Wendell Prine, and what came back
thirty days later. The page exists because of a fact about the document it renders. Under NRCP 33(b)(5):

> The person who makes the answers must sign them, and the attorney who objects must sign any objections.

So a response is signed twice, by two people, certifying different things. Prine swears to the answers and can be
impeached with them; his counsel signs the objections and swears to nothing. The PDF does not make that obvious, and a
client who misses it concludes the other side admitted something it did not.

So each interrogatory is rendered as attributed blocks — what we asked, what counsel objected, what the defendant swore,
and then the part no response contains: what it leaves us with, and what we do next. The one deficient response in the
set is deficient for a reason quoted from the rule rather than asserted by us.

The same line this repository draws for case law is drawn here. **The exchange is fixture and the rules are real**: the
questions, answers, objections, dates, and opposing counsel are invented. `Rule.verified` in `portal/src/discovery.ts`
marks the verbatim Nevada Rules of Civil Procedure quotes. Opposing counsel is invented deliberately.

A sample matter must not cast a real firm as the adversary in a simulated soul-conveyance dispute.

`portal/src/discovery.ts` checks its own story at import. A duplicated number, an answer filed under a response that
claims to be objection-only, or an objection citing a missing rule throws where a test sees it. Each renders perfectly
well while being wrong, which is the failure mode worth a guard.

### Nothing on the interrogatories tab has been served

`#interrogatories` is the other direction of the same fight: Defendant's first set to Dermot Cruller, and the responses
being drafted for it. It is a separate view from `#discovery` because it renders a document at a different point in its
life. Theirs is finished — served, answered, signed — and the only open question is whether it is sufficient. Ours is
not. Nothing on that page has been served, and no answer on it is sworn until the client swears to it, so every draft
block is labeled as a draft on its face rather than in a footnote. A client who reads a draft answer as a filed one has
been misled by us, which is the same failure the two-voices layout on the discovery page exists to prevent.

Three things about `portal/src/responses.ts` are worth knowing before editing it:

- **The deadline is derived, not written down.** NRCP 33(b)(2) gives thirty days from service, and thirty days from the
  fixture's date of service lands on a Sunday — so the date the page prints is a Monday that appears nowhere in the
  data. Changing the date of service moves it. All the date arithmetic is in UTC, because a local-midnight `Date` puts
  the deadline on a different day west of Greenwich than east of it.
- **"Now" is fixture data too.** "25 days left" is counted from a fixed `asOf` date the page names, not from
  `new Date()`. A live clock would make the number true for one day, and would make every test that reads it depend on
  when it ran.
- **The rules are reused rather than re-quoted.** `RESPONSE_RULES` selects from the verbatim quotes in `discovery.ts` by
  id. `Rule.verified` promises the quote came from the rule's text rather than from memory, and a second transcription
  of the same sentence in a second file is a second chance to break that promise.

The drafts also have to square with the positions the other page is pressing. We are moving to compel on their
Interrogatory 3 because a contention question drew an objection and nothing else, so the contention questions here get
answered rather than deflected — and where a draft turns on that kind of consistency it says so, in a `consistency`
field the page renders beside the draft. One response in the set is an objection and nothing else, because every word of
the answer would be privileged; that is the line NRCP 33(b)(3) draws, and it is the line their Interrogatory 3 fell on
the wrong side of.

### The prep deck hides its own answers

`#trial-prep` is the third document in the discovery sequence and the only one that never gets served: the flashcards
the client studies before he is deposed. It is written as cards rather than as a memo because of a difference that is
behavioral rather than cosmetic — **the answer side is not rendered until the reader turns the card over.** Not hidden
with CSS: absent. A visually hidden answer is still one the eye catches, a screen reader announces, and a find-in-page
lands on, and any of those turns a rehearsal back into a document the client reads once and believes he has practiced.
`portal/src/test/trial-prep.test.tsx` asserts the absence in both directions, because it is exactly the property a
well-meaning redesign removes first.

Three things about `portal/src/trialPrep.ts`:

- **A card that claims record support has to point at the record.** Every `anchor` names an interrogatory in
  `discovery.ts` or `responses.ts` by id, and the guard at the foot of the module throws at import if it names one that
  does not exist. A prep deck that drifts from the sworn record is worse than no deck — it rehearses a witness into
  contradicting himself, and it looks exactly like a deck that works while doing it.
- **The most important answer is reused, not retyped.** The card on the second bite reads its answer out of the drafted
  interrogatory response rather than keeping a copy, for the same reason `responses.ts` selects its rule quotes from
  `discovery.ts` by id. The examiner will be holding the sworn version, and any daylight between the two is his best
  question of the day.
- **Two cards have no answer at all, deliberately.** The date the client learned of the term is the fact the whole count
  turns on, and it is not ours to draft. Those cards say so on their face and the page collects them into what the
  client has to bring to the session — the same shape as the outstanding-work list on the interrogatories page, and the
  same reason for it.

The `weak` field on a card is the other half of the teaching. It holds an answer that is **true and still costs
ground**, with the reason it costs ground, because that is the distinction witness prep is actually about; a deck that
modelled a helpful lie would be a different document with a different name. `MOCK_CROSS` puts the same material in a run
— three agreeable questions and then the one they were for — so a client can feel the shape of an examination rather
than meet each question in isolation.

### The motion is typeset, not templated

`#motion` is the matter's first court filing, and the only document here that is **not** a notation template. It is
Typst source in `portal/pleadings/`, compiled by `pnpm render:pleadings`, and the reason is pleading paper.

Pleading paper is a typesetting problem before it is a drafting one: 28 numbered lines down the left margin, a double
rule beside them, a single rule at the right, and body text whose every baseline has to land on one of the 28 numbers —
on every page, through every heading, and across a caption box. A notation template cannot ask for that. It declares a
**render profile** in its frontmatter — `output: letter` or the default plain page — and the renderer owns the furniture
from there. That is the right trade for a letter or an affidavit and the wrong one here, and inventing a `pleading`
profile in this repository would be inventing it in the wrong repository, because the profiles are Navigator's.

So the split is by tool, and `portal/scripts/render-pleadings.sh` is separate from `portal/scripts/render-documents.sh`
for the same reason: that one needs the Navigator CLI. This one needs `typst`. A contributor who edits the motion does
not have to install Navigator to re-render it, and `portal/scripts/toolchain.sh` fetches whichever of the two is
missing. Both outputs land in `dist/documents/` during `postbuild`, and `portal/src/test/bundle.test.ts` asserts the
motion reaches `dist/` separately from the five notation PDFs. `vite build` does not know Typst exists, so it would not
notice the file going missing.

`navigator project gate` covers this matter's own blueprints under `templates/` as part of the whole tree. That is why
`portal/pleadings/` is a directory of the application rather than `templates/typst/`. A `.typ` file does not belong in
notation validation.

Three things about `portal/pleadings/pleading-paper.typ`:

- **One constant drives everything.** `LINE` is the baseline-to-baseline distance, and every vertical measurement in the
  file is a whole multiple of it. The numbers are placed on an absolute grid in the page background and the text is laid
  out on the same grid in the flow, so the two cannot drift apart: neither is measured from the other.
- **The line box is pinned, not measured.** `top-edge` and `bottom-edge` are absolute, which makes the box exactly one
  font size tall whatever glyphs are on the line. Left at Typst's default the box is measured from the tallest glyph
  actually present, so a line with no ascenders would be shorter than its neighbours and every line after it would sit
  slightly wrong.
- **Fixed-height blocks take different spacing from text blocks.** A block Typst measures from its own text costs
  `spacing + SIZE` between the baselines either side of it; a block given an explicit height costs `spacing` exactly.
  The caption box is the second kind, which is why its gaps are multiples of `LINE` while everything else uses `NEXT`
  and `SKIP`. Getting that wrong puts every line after the caption half a line off its number, on every page.

The typeface is Typst's bundled Libertinus Serif rather than a system font, because a committed PDF that renders
differently on the next contributor's machine is a committed PDF nobody can review.

### The motion argues arithmetic, and the module checks it

`portal/src/motion.ts` is the one data module whose subject is a *calculation*, and it is written that way on purpose.

The motion is aimed at the statute of limitations defense and at nothing else. NRS 11.190(3)(d) gives three years; Count
II was filed sixteen months after the earliest date any theory can start the clock; so the defense fails on every
accrual date the record supports and the court never has to choose between them. That is a subtraction, so
`ACCRUAL_CANDIDATES` derives each expiry and each margin from the dates rather than carrying them, and **the guard at
the foot of the module throws at import if any candidate's three years had already run** when Count II was filed. A
motion whose own premise is false is a page that renders perfectly while being wrong, which is the failure mode worth a
guard.

Two more things worth knowing before editing it:

- **The motion is narrow because the interesting fact is disputed.** What Dermot knew on 14 April 2026 is the fact the
  whole count turns on, and it is contested — so a motion built on it would be a motion that has to lose. Part IV.C of
  the PDF declines to move on ratification, on the record, and says why; `RESERVED` is that decision as data, and
  `MotionPage` renders it beside the relief sought rather than in a footnote. A client who reads a granted motion as the
  end of the case has been misled by the layout, which is the same failure the draft labels on the interrogatories page
  exist to prevent.
- **The authorities are reused, not re-quoted.** `SUBSTANTIVE_AUTHORITIES` selects from the verified entries in
  `research.ts` by id, the same way `responses.ts` selects its rule quotes from `discovery.ts`. The two procedural
  authorities live in `motion.ts` because `research.ts` is scoped to the three substantive issues in Count II and the
  summary judgment standard is none of them — widening its `issue` union to admit a rule of procedure would make the
  research tab claim to answer a question it does not ask. They carry the same `verified` promise: the NRCP 56 quotes
  are the rule's own words, and the two sentences from *Wood v. Safeway* were checked against the opinion text before
  they were written down.

`portal/src/motion.ts` also carries the matter's first docket number, because nothing before it needed one — a notation
template renders a letter or an affidavit and neither has a caption. It is invented, like the rest of the matter and for
the same reason the adverse firm is: a real Clark County docket number belongs to a real case.

### There is no session code here

Navigator streams this bundle from its own origin, and the session check and the participation gate have both already
run before the first byte arrives. This portal renders nothing that varies by who is looking, so a session fetch would
buy a request and no behavior.

A portal that *does* vary by reader still never verifies a token itself. Reads go through Navigator's `/app/api` and
writes through its REST command boundary, same-origin, so the session cookie and the participation gate apply without
any code here doing anything to earn them.

### Routing is by fragment

`#introduction` selects the second view. A path-based route would need Navigator to serve `index.html` for every
sub-path under the mount, and it does not promise that — a deep link to `…/portal/introduction` would 404 in production
while working fine under the dev server. A fragment is never sent to the origin, so every view is a bookmarkable URL
that cannot 404.

## License

Copyright (C) 2026 Neon Law Foundation. Licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE).
[`LICENSE`](./LICENSE) is the license text verbatim as the Free Software Foundation publishes it, and it is the only
license file in this repository — there is no summary of it to drift out of step. Every source file carries the matching
SPDX notice. [`portal/src/test/license.test.ts`](./portal/src/test/license.test.ts) asserts the text's exact length, the
notice on every source file, and the notice in each file the build publishes.

Section 13 is the clause that distinguishes the AGPL from the plain GPL, and it is not incidental for a browser portal
that Navigator serves over a network: deploy a **modified** version for other people to use and you owe those users the
corresponding source of what you deployed, not the source of this repository. Running an unmodified copy, forking it
privately, and building it locally trigger nothing.

That grant covers the work the Foundation owns. It does not relicense the third-party libraries this application draws
on, which keep their own terms and their own copyright holders:

| License | Library |
| --- | --- |
| MIT | `react`, `react-dom`, the `@radix-ui/react-*` primitives, `clsx`, `tailwind-merge`, and `tailwindcss` |
| ISC | `lucide-react`, `d3-array`, `d3-force`, `d3-scale`, `d3-shape` |
| Apache-2.0 | `@neon-law-source-code/navigator-ux`, `class-variance-authority`, `pdfjs-dist` |
| SIL OFL 1.1 | Source Serif 4 — the two woff2 files navigator-ux vendors, which this build emits under the mount |

`tailwindcss` is a build-time dependency rather than a shipped library: it is compiled into the emitted stylesheet.

A copyleft license here and permissive licenses underneath are not in conflict: copyleft flows downstream to what
includes this work, never upstream to what this work includes. navigator-ux was AGPL-3.0-only through v0.8.0 and is
Apache-2.0 from v26.9.3 on; its `NOTICE` records that each earlier version stays under the terms it shipped with, so the
pin in `portal/package.json` is also what fixes which license applies.

```text
SPDX-License-Identifier: AGPL-3.0-or-later
```
