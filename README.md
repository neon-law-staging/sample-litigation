# Navigator Sample Project

The reference **project application** for [Navigator](https://github.com/neon-law-source-code/navigator): a client
portal for the fixture matter *Cruller v. Prine*, built with Vite, React 19, Tailwind CSS, and shadcn-style components
owned in this repository — plus [navigator-ux](https://github.com/neon-law-source-code/navigator-ux) on the documents
tab, where it frames a PDF viewer this repository owns.

It exists so that "attach a React app to a matter" has a worked example a contributor can read, clone, and copy — and so
Navigator's own local development loop has something real to build and serve instead of a hardcoded HTML string.

**Everything here is fixture data.** *Cruller v. Prine* is a simulated matter. No client data belongs in this
repository, ever.

## Where it mounts

Navigator serves this bundle at:

```text
/app/projects/sample-litigation/portal/
```

`sample-litigation` is the Project code; `portal` is a literal segment of Navigator's route, not an application name it
looks up — see `portal/src/project_portal.rs` in the Navigator repository. Navigator streams the bytes through its own
origin behind the session cookie and the participation gate; it never redirects to a signed URL, because a signed URL is
bearer-shareable and would not carry the session.

That has three consequences for this app:

1. **Vite `base` is baked at build time** and must be `/app/projects/sample-litigation/portal/`. A bundle built with the
   wrong base 404s on every asset. It is one named constant at the top of `vite.config.ts`.
2. **Never hardcode a mount-absolute link.** Write links relative to the base, or derive them — `src/mount.ts` is the
   whole of that job here, and `portalPath()` is what every in-bundle link goes through. Hardcoded
   `/sample-litigation/...` strings are the single most common way one of these bundles breaks under its real mount.
   Links to Navigator's *own* routes (`/app/projects`) stay absolute, because they are Navigator's paths rather than
   paths inside this bundle.
3. **Same-origin is the whole mechanism.** Because the bundle is served from Navigator's origin, its calls to
   Navigator's read and command APIs are session-gated automatically. There is no backend in this repository.

The serve CSP is:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'
```

Nothing in this bundle is inline or off-origin, which is why it needs no exception. That rules out a few things a
vibe-coded prototype reaches for by default:

- **No `cdn.tailwindcss.com`.** Tailwind is compiled into the hashed CSS asset by `@tailwindcss/vite`. A CDN script tag
  works on the dev server and is blocked in production — the worst possible place to find out — so
  `src/test/bundle.test.ts` asserts the built output loads nothing from a CDN.
- **No webfont *request*.** There are two webfonts — Source Serif 4, vendored by navigator-ux under the OFL — and the
  build emits both as hashed assets under the mount, so `font-src 'self'` covers them. A font served from a CDN would be
  blocked here, and in an authenticated portal it would also be a third party watching every page of a matter.
- **No remote images.** The illustrations in `src/art.tsx` are original inline SVG, themed off the same variables as
  everything else. Hotlinking artwork would be the only thing in the bundle that could fail because of somebody else's
  server — and it would be somebody else's artwork.

## The one contract Navigator depends on

The bundle must show that it actually mounted, through an element with:

```html
id="sample-litigation-portal-ready"
```

React renders it, on the page kicker, so it exists **only once the app has mounted** — which is the point of it. A
static marker in `index.html` would report "ready" for a bundle that failed to boot, and Navigator's browser walkthrough
drives a real browser and waits on a CSS locator, so what it sees is the live DOM.

The built `index.html` also carries `<meta name="navigator-ready-hook" content="sample-litigation-portal-ready">`, so a
check that reads the published document rather than driving a browser still finds the contract it is looking for. Both
are asserted by `src/test/bundle.test.ts`, against what `pnpm build` actually emitted.

## Run it locally

Node >= 22 and pnpm 11 (`packageManager` pins the exact version). Two commands, from a clean clone:

```bash
pnpm install
```

```bash
pnpm dev
```

Then open the portal at its mount path — **not** `http://localhost:5173/`, which is outside the base and serves nothing:

```text
http://localhost:5173/app/projects/sample-litigation/portal/
```

The PDF viewer is on the documents tab, which this link opens directly:

```text
http://localhost:5173/app/projects/sample-litigation/portal/#introduction
```

Pick **Documents** from the tab strip on that page. The first document opens in the viewer on arrival; the cards beside
it switch which one is open, and the toolbar carries page navigation, zoom, fit-to-width, and find-in-document.

One thing worth knowing if the page looks stuck: pdf.js advances its render on `requestAnimationFrame`, which browsers
do not fire in a hidden or background tab. A viewer left in a background tab shows a blank page until the tab is brought
to the front, and then paints. That is pdf.js's behavior rather than this component's.

The discovery exchange is its own view, and needs no tab:

```text
http://localhost:5173/app/projects/sample-litigation/portal/#discovery
```

The interrogatories served *on* the client, and the responses being drafted for them, are the fourth section in the
strip:

```text
http://localhost:5173/app/projects/sample-litigation/portal/#interrogatories
```

The witness preparation deck — the flashcards the client studies before he is deposed — is the fifth:

```text
http://localhost:5173/app/projects/sample-litigation/portal/#trial-prep
```

The motion for partial summary judgment — the matter's first court filing, and the one document here set on pleading
paper — is the sixth:

```text
http://localhost:5173/app/projects/sample-litigation/portal/#motion
```

## Develop

```bash
pnpm check      # what a contributor should run before pushing
```

The dev server serves under the real mount path, not `/`, because the base is baked in and a dev loop that disagrees
with production about where the app lives is a dev loop that hides base bugs.

[navigator-ux's GitHub Release](https://github.com/neon-law-source-code/navigator-ux/releases) is where the library
comes from: it is not published to npm at all, and that is why `pnpm install` needs no registry account, no token, and
no `.npmrc`. The URL in `package.json` pins one exact version, so upgrading is an edit to that URL rather than a range
that widens on its own, and `pnpm-lock.yaml` records the tarball's sha512 — a clean clone resolves the same bytes rather
than whatever the URL serves that day.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server, under the mount path. |
| `pnpm build` | `tsc --noEmit`, then the production bundle into `dist/`. |
| `pnpm lint` | oxlint. |
| `pnpm typecheck` | `tsc --noEmit` on its own. |
| `pnpm test` | vitest. **Needs a build first** — the bundle gate asserts on real output rather than skipping. |
| `pnpm check` | lint, typecheck, build, test, in that order. |
| `pnpm validate:templates` | `navigator validate templates` — the notation rule set, over `templates/`. |
| `pnpm render:documents` | Re-render each notation template to `public/documents/`. Needs the Navigator CLI. |
| `pnpm render:pleadings` | Re-compile each Typst pleading to `public/documents/`. Needs `typst`, and nothing else. |

Navigator builds this repository the same way. `navigator dev sample-project` clones it into a temporary directory, runs
`pnpm install --frozen-lockfile` and `pnpm build`, and stages the resulting `dist/` under `.devx/sample-project/dist`;
the next `web` boot publishes every file in it to the applications bucket, entry document last.

## What it is made of

```text
index.html                  the Vite template — no inline script, ever
src/main.tsx                the entry: the stylesheet, imported once, and the mount
src/index.css               Tailwind, plus the theme every component reads, aliased from navigator-ux
src/App.tsx                 the shell, the fragment router, and the overview
src/IntroductionPage.tsx    Count II — eight tabs
src/DiscoveryPage.tsx       the interrogatories and the responses, split by who signed them
src/ResponsesPage.tsx       the set served on us, and the drafts waiting to be sworn
src/TrialPrepPage.tsx       the flashcard deck, and the simulated cross-examination
src/MotionPage.tsx          the motion: the limitations arithmetic, and what it does not ask for
src/CaseLibraryPage.tsx     real citations that are not Count II authorities
src/RelationshipGraph.tsx   the force-directed party/evidence web
src/PdfViewer.tsx           the document viewer: canvas, text layer, find bar
src/pdf.ts                  the pdf.js seam — worker wiring, opening, text extraction
src/art.tsx                 original inline SVG illustrations
src/inline.tsx              two marks of inline Markdown, for prose held as data
src/components/ui/*         shadcn-style components, owned here
src/lib/utils.ts            `cn()` — clsx plus tailwind-merge
src/matter.ts               the fixture data for the trespass count
src/soulContract.ts         the fixture data for Count II, including the graph
src/people.ts               who may read the matter, and who the matter is about
src/glossary.ts             Navigator's vocabulary, scoped to this bundle
src/research.ts             the authorities — real law, verified before it was written down
src/caseLibrary.ts          real citations outside Count II's scope — not fixture, not authority
src/discovery.ts            the interrogatory exchange, and the rules it is measured against
src/responses.ts            the set served on us, the drafts under it, and the derived deadline
src/trialPrep.ts            the prep cards, the ground rules, and the mock examination
src/documents.ts            the rendered PDFs and the templates behind them
src/motion.ts               the motion, and the limitations arithmetic it derives rather than states
src/mount.ts                links derived from the base rather than written out
templates/neon_law/*.md     notation templates; the source of three of the PDFs
pleadings/pleading-paper.typ the 28-line grid, the rules, and the caption box
pleadings/*.typ             Typst pleadings; the source of the fourth PDF
scripts/render-documents.sh `navigator template render`, once per template
scripts/render-pleadings.sh `typst compile`, once per pleading
```

### Styling

Semantic CSS variables in `src/index.css`, with every component styled against the semantic name rather than a color.
Nothing in `src/components/ui` names a hue, so the teal accent is that one file — and that file now names no hue either:
each variable aliases the `--nav-*` token navigator-ux publishes for the same job, so the brand lives upstream and a
re-toned release arrives on the next `pnpm install`. It is also what keeps the documents tab coherent, where library
components render beside components from `src/components/ui`.

Dark mode comes with the tokens. navigator-ux redefines its own under `prefers-color-scheme: dark`, so an alias resolves
to the dark value inside that query and this repository carries no second palette. There is no theme state to hold and
no flash of the wrong palette — and no class hook: Tailwind's `dark:` variant is pointed at the same media query,
because the `.dark` class it defaults to is something nothing here sets.

The components live here rather than arriving from a package, which is what shadcn is: you own the source, so a
component that needs to behave differently gets edited instead of wrapped.

The graph is the one place that reads variables directly through `var()` in SVG presentation attributes. Utility classes
cannot reach `fill` and `stroke` on arbitrary SVG children, and hardcoding hex there would make it the only thing in the
app that ignores the theme.

### Documents

No PDF under `public/documents/` is hand-authored, and there are two renderers rather than one. Three of the four are
rendered by `navigator template render` from a notation template in `templates/neon_law/`; the fourth is the motion,
compiled from Typst, and *The motion is typeset, not templated* below is why it is not a notation template like the
others.

The notation ones come from Markdown carrying a questionnaire and a workflow in its frontmatter. The renderer validates
against the same rule set as `navigator validate` and refuses a template with any violation, so a PDF that exists is a
template that passed.

There are three: the engagement letter that opens the representation, the notice of rescission served on the defendant,
and the affidavit of the witness whose notebook the count turns on. The engagement letter is the one that declares a
**render profile** — `output: letter` in its frontmatter — so it arrives on Neon Law letterhead while the other two
render as plain pages. That key is the one place a template says what the finished document should look like, which is
why `MatterDocument.format` carries it to the card rather than letting the component guess from the title.

They are **committed rather than generated during `vite build`**: this bundle has to build on a machine that has never
installed the Navigator CLI, and CI should not need a Rust toolchain to ship a React app. Re-run `pnpm render:documents`
whenever a template changes. `src/test/bundle.test.ts` asserts all four PDFs reach `dist/`, since nothing in the Vite
build would notice them going missing.

`pnpm validate:templates` is the check that keeps the templates renderable, and for the same reason it is **not in CI**
— it needs the Navigator CLI, and a React build should not wait on a Rust toolchain. So run it locally whenever a
template changes. The notation rule set is versioned in Navigator rather than here, which means a template can stop
validating without anything in this repository changing: that is exactly what happened to the `staff_review` workflow
state these templates used to carry, before `N106` began requiring the `lawyer_review` gate that every one of them now
names.

### The viewer is ours

The documents tab reads its PDFs in a viewer this repository owns — `src/PdfViewer.tsx` — rather than in the browser's
built-in one or in the `PdfViewer` that navigator-ux ships. The library's is a leaf component by its own contract: it
takes a `src` and a `label` and renders a page. That is the right shape for a library and the wrong one for this tab,
where the viewer has to find a phrase across every page of a document, hold a zoom while the reader switches documents,
and degrade to a plain link when it cannot start. Owning it means those behaviors are editable rather than wrapped.

What it does not own is the parsing. `pdfjs-dist` does that, in a worker, and the component is the chrome around it:
paint the page to a canvas, lay pdf.js's transparent text runs over it so the page can be selected and read aloud, and
keep the two in step through every zoom and page turn. Three things about that are load- bearing enough to be worth
knowing before editing it:

- **The worker is same-origin, and hashed.** `src/pdf.ts` imports it with Vite's `?url` suffix, so the build emits it as
  an asset under the mount. Left unset, pdf.js reaches for a CDN, `script-src 'self'` blocks it, and the reader gets a
  spinner that never resolves — which is why `bundle.test.ts` asserts the emitted worker and the URL that reaches it.
- **pdf.js is loaded on demand.** The import inside `loadPdfjs()` is dynamic, which splits the parser into its own
  chunk: a reader who never opens this tab never downloads it. It is nearly half the JavaScript in the build, so a
  static import anywhere in `src/pdf.ts` would quietly cost every other page. That is a test too.
- **One paint per canvas.** pdf.js locks a canvas for the duration of a render and throws if a second starts on it, and
  it releases that lock when a cancelled render *settles* rather than when `cancel()` returns. So a new paint cancels
  its predecessor and then waits for it. Skip the wait and the symptom is not an error — it is a page that paints and
  then never gets its text layer.

The find bar counts hits in the text pdf.js reports for each page, and highlights them by wrapping runs in the rendered
text layer. Those two can disagree: a match straddling two positioned runs is counted and turns the page, but arrives
unmarked. Counting from the page text rather than from the runs is what keeps the tally honest in that case.

### The people, and the glossary

Two data files answer questions the graph cannot.

`src/people.ts` holds two rosters that look alike and mean entirely different things. One is the **Navigator Persons** —
rows that can sign in, each with a system-wide tier and a participation row on this Project. The other is the **cast in
the pleaded facts**, the Cruller and Prine households. Dermot Cruller is the plaintiff and has no account; Cleo Client
has an account and is not the plaintiff. Keeping those two facts side by side is the point of the file: participation is
a property of a Person–Project Role row, a party is a fact in a pleading, and Navigator never lets the second grant the
first. The Navigator Persons are the five the development seed writes, spelled the way it spells them — including the
Admin who deliberately gets no participation row and therefore cannot reach this matter at all.

`src/glossary.ts` is the vocabulary, scoped. Navigator keeps **one** canonical glossary, in its own repository, and this
file does not compete with it: each entry paraphrases what Navigator means by a word, says what that word is *here* —
which file, which path, which fixture row — and links to the canonical definition, which governs if the two ever
disagree. It exists because the same word means a pleading to a lawyer and a table to this codebase. Matter and Project
are one row. Person is a login, not a party. Letter is a piece of mail in the schema and a render profile in a
template's frontmatter. A contributor who has not been told that reads every file in this repository slightly wrong.

### The authorities are real

Everything about the matter is invented. The citations on the research tab are not: each was retrieved from Midpage and
checked against the opinion or statute text before it was written down, and every quote in `src/research.ts` is
verbatim. `Authority.verified` exists in the type so the page can say so on the face of each card — a demo that blurs
real law into fixture data teaches a reader to trust a citation because it looked like one.

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
questions, answers, objections, dates, and opposing counsel are invented, and `Rule.verified` in `src/discovery.ts`
marks the quotes that are not — verbatim from the Nevada Rules of Civil Procedure. Opposing counsel is invented
deliberately. A sample matter that casts a real firm as the adversary in a simulated soul-conveyance dispute is a sample
matter with a problem.

`src/discovery.ts` checks its own story at import: a duplicated number, an answer filed under a response that claims to
be objection-only, or an objection citing a rule the module does not carry all throw where a test sees them. Each of
those renders perfectly well while being wrong, which is the failure mode worth a guard.

### Nothing on the interrogatories tab has been served

`#interrogatories` is the other direction of the same fight: Defendant's first set to Dermot Cruller, and the responses
being drafted for it. It is a separate view from `#discovery` because it renders a document at a different point in its
life. Theirs is finished — served, answered, signed — and the only open question is whether it is sufficient. Ours is
not. Nothing on that page has been served, and no answer on it is sworn until the client swears to it, so every draft
block is labeled as a draft on its face rather than in a footnote. A client who reads a draft answer as a filed one has
been misled by us, which is the same failure the two-voices layout on the discovery page exists to prevent.

Three things about `src/responses.ts` are worth knowing before editing it:

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
`src/test/trial-prep.test.tsx` asserts the absence in both directions, because it is exactly the property a well-meaning
redesign removes first.

Three things about `src/trialPrep.ts`:

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
Typst source in `pleadings/`, compiled by `pnpm render:pleadings`, and the reason is pleading paper.

Pleading paper is a typesetting problem before it is a drafting one: 28 numbered lines down the left margin, a double
rule beside them, a single rule at the right, and body text whose every baseline has to land on one of the 28 numbers —
on every page, through every heading, and across a caption box. A notation template cannot ask for that. It declares a
**render profile** in its frontmatter — `output: letter` or the default plain page — and the renderer owns the furniture
from there. That is the right trade for a letter or an affidavit and the wrong one here, and inventing a `pleading`
profile in this repository would be inventing it in the wrong repository, because the profiles are Navigator's.

So the split is by tool, and `scripts/render-pleadings.sh` is separate from `scripts/render-documents.sh` for the same
reason: that one needs the Navigator CLI and a Rust toolchain, this one needs `typst` and nothing else. A contributor
who edits the motion does not have to install Navigator to re-render it. Both outputs are committed rather than built by
Vite, and `src/test/bundle.test.ts` asserts the motion reaches `dist/` separately from the three notation PDFs — nothing
in `vite build` knows Typst exists, so nothing in `vite build` would notice it going missing.

`pnpm validate:templates` runs `navigator validate templates` over the whole of `templates/`, which is why `pleadings/`
is a top-level directory rather than `templates/typst/`: a `.typ` file in there is a file the notation rule set has an
opinion about and should not.

Three things about `pleadings/pleading-paper.typ`:

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

`src/motion.ts` is the one data module whose subject is a *calculation*, and it is written that way on purpose.

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

`src/motion.ts` also carries the matter's first docket number, because nothing before it needed one — a notation
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
SPDX notice, and [`src/test/license.test.ts`](./src/test/license.test.ts) asserts all of it: the license text against
its exact length, the notice on every source file, and the notice in each file the build publishes.

Section 13 is the clause that distinguishes the AGPL from the plain GPL, and it is not incidental for a browser portal
that Navigator serves over a network: deploy a **modified** version for other people to use and you owe those users the
corresponding source of what you deployed, not the source of this repository. Running an unmodified copy, forking it
privately, and building it locally trigger nothing.

That grant covers the work the Foundation owns. It does not relicense the third-party libraries this application draws
on, which keep their own terms and their own copyright holders:

| License | Library |
| --- | --- |
| AGPL-3.0-only | `@neon-law-foundation/navigator-ux` |
| MIT | `react`, `react-dom`, the `@radix-ui/react-*` primitives, `clsx`, `tailwind-merge`, and `tailwindcss` |
| ISC | `lucide-react`, `d3-array`, `d3-force`, `d3-scale`, `d3-shape` |
| Apache-2.0 | `class-variance-authority`, `pdfjs-dist` |
| SIL OFL 1.1 | Source Serif 4 — the two woff2 files navigator-ux vendors, which this build emits under the mount |

`tailwindcss` is a build-time dependency rather than a shipped library: it is compiled into the emitted stylesheet.

A copyleft license here and permissive licenses underneath are not in conflict: copyleft flows downstream to what
includes this work, never upstream to what this work includes. navigator-ux is the exception that proves the rule — it
is AGPL itself, which is the same license this repository already carries.

```text
SPDX-License-Identifier: AGPL-3.0-or-later
```
