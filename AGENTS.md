# Working in sample-litigation

This is one Project's repository. It holds two kinds of source and nothing else.

- `templates/` — notation blueprints, one `templates/<code>.md` per notation.
- `apps/<app>/` — React + Vite applications, each discovered from its direct `package.json`.

Filename stems use the Project code (hyphens become `_`) then `__name`; `code:` matches.

Navigator imports each template and records the commit SHA as provenance.

Build each app for `/app/projects/sample-litigation/<app>/`; the `apps/` source grouping is not a URL segment.

Derive every in-app path from `import.meta.env.BASE_URL` rather than writing an absolute path by hand.

A Vite base rewrites module and asset URLs and never an `href` in source.

A root `portal/` is also accepted while repositories move that workspace to `apps/portal/`.

## Project codes are client identifiers

A Project code names a matter and its repository. It identifies a client, so it is client data.

The one legitimate use here is this repository naming itself, as in `navigator.yaml`, its paths, and its portal mount.

Do not copy a Project code from another repository into this codebase.

Do not put it into a commit message, code comment, branch name, or pull-request body.

A precedent citation is still a breach; cite the governing issue by its bare identifier instead.

Read matter data through Navigator's `/api` read surfaces and write through its one REST command boundary.

Do not add a second backend.

Do not put a legal file, a client upload, an answer, a generated document, or a secret in this repository.

## Navigator CLI feedback

When Navigator's CLI is missing or wrong, open a Linear issue on the Lawyers team rather than documenting a CLI
workaround here.

The `stay-in-repo` skill under `.claude/skills/` — synced into this checkout by `navigator site projects repository
sync-skills` — is the scope rule to read before reaching outside this tree. One thing it does not cover, because it is
specific to this bundle rather than shared across every Project repository: **another checkout of Navigator itself.**
The route this bundle mounts under belongs to Navigator, and `README.md` records what the contract is. Read the README
rather than a copy of `portal/src/project_portal.rs` that happens to be on this machine — it may be a different revision
than the one serving this bundle, and a contract read from the wrong revision is worse than one read from documentation.

## Everything here is fixture data

*Cruller v. Prine* is a simulated matter. No client data belongs in this repository, ever — not in a template, not in a
test, not as an example in a comment. This is a worked example a contributor reads and clones, so anything committed
here is something somebody will copy.

The one exception is a real, public-domain legal authority — a published court opinion or an enacted statute, of the
kind `src/research.ts` already cites and marks `verified: true`. Its full text may be committed here, verbatim and
clearly marked as real rather than fixture, because it discloses nothing about any matter and a government work carries
no copyright to violate. That exception covers only the authority's own text — any matter-specific analysis of it stays
fixture — and it does not touch the separate rule that a client portal build may not link off-origin (see
`.github/no-external-references.py`); a committed opinion is served same-origin like everything else in the bundle.

## Before calling work done

`pnpm --dir portal check` — lint, typecheck, build, and tests, in that order.

The build is part of it because several tests assert against what `pnpm build` actually emitted rather than against the
source.

`README.md` is the orientation: what mounts where, why the base path is load-bearing, what the ready-hook contract is,
and how the documents are rendered. It is long because those are the things that break a bundle silently. Read it before
changing anything structural, and update it when the answer it gives stops being true.

## Notation lint

`pnpm --dir portal check` covers the TypeScript. The Markdown and YAML answer to the Neon Law Navigator rule set; the
Navigator CLI is the only thing that reads them:

```bash
brew install neon-law-source-code/navigator/navigator   # macOS, and tap-qualified on purpose
pnpm validate                                          # navigator validate, over the whole tree
```

Install it tap-qualified. An unqualified `brew install navigator` resolves to a Homebrew cask for a trackpad utility of
the same name, which installs cleanly and then has no `validate` subcommand. `brew upgrade` keeps it current, and
`navigator --version` says which rule set you are holding this repository to.

CI does not use Homebrew. The `notation` job in `.github/workflows/ci.yml` runs on `ubuntu-latest` and unpacks the Linux
tarball from a pinned public Navigator release into `$HOME/.local/bin`: one static binary, no tap, no account, no sudo.
The pin is deliberate, so that a rule added upstream arrives when somebody bumps that line rather than turning a green
branch red overnight. `notation` is one of the three jobs the required `ci` check waits on, so a finding blocks the
merge — and the pinned version is worth keeping in step with the formula above, since the two together are what "it
passed on my machine" means here.

`pnpm validate` is deliberately not part of `pnpm --dir portal check`.

`check` needs only what `pnpm --dir portal install` brings, so a contributor who has not installed the CLI is not
blocked by it. Run both before pushing.

`validate` takes no file list, and there is no list to keep current. It walks the tree itself and finds every Markdown,
event, and YAML file under it, so a document is covered the moment it exists rather than the moment somebody remembers
to register it. Each Markdown file it also classifies as it reads: prose gets the structural rules (`M*`) and the
line-width rules (`S*`), and a file whose frontmatter makes it a notation — a `code:`, a `questionnaire:`, a `workflow:`
— additionally gets the notation rules (`N*`). Vendored trees such as `node_modules/` are skipped, but `.gitignore` is
not consulted, so a generated file that sits in the tree is linted like any other.

A finding prints as `path:line RULE: message`, and an error exits non-zero where a warning is only reported.

`navigator validate --fix` applies in place the fixes that are safe by construction — whitespace, ATX heading spacing,
blockquote spacing — and then re-validates. The rest are diagnostic only: the `N*` notation rules, duplicate headings
(M024), trailing heading punctuation (M026). Those it names and leaves for a human, which is the right split; a notation
state machine is not something a formatter should rewrite.

Every document here is filled greedily to 120 columns, because that is what the width rules ask for: **S101** rejects a
line over 120, and **S102** rejects a line that stopped short of 120 with a word still to come. Match that when you edit
rather than rewrapping a paragraph to 80 or 100 columns.

Four things about writing prose that passes, none of them obvious from the message the rule prints:

- **Some spans cannot be broken across lines.** A link, because CommonMark forbids a line break inside a destination; an
  inline code span, because a break leaves whitespace at its edge (M038); an emphasis span, because the rules are
  line-scoped and a span crossing a line reads as unbalanced (M037). So a ~100-character link that lands at the start of
  a line reports S102 permanently — reword the sentence until the link sits inside a line, or make it the first thing in
  its paragraph.
- **Reference-style links are not the way out of that.** A definition line carrying a bare URL reports M034.
- **A literal too long to shorten belongs in a fenced block.** S101 does not reach inside a fence, so a CSP header or a
  long command goes in one — with a language tag, which is what M040 wants.
- **Italics inside a list item bulleted with an asterisk report M037.** The bullet's own asterisk is counted as an
  inline marker. A dash bullet has no such problem, and M004 holds a file to whichever character its first bullet used.

The classification matters more here than in a repository of plain documentation. This Project's own notations live in a
flat `templates/`, one `templates/<code>.md` per blueprint, and `navigator validate` is the only thing in the tree that
reads their `questionnaire:` and `workflow:` state machines at all — `pnpm --dir portal check` never opens them, and
`pnpm --dir portal validate:templates` is the same check narrowed to that folder. It reports one N112 warning per
template: each `lawyer_review` step reaches automation that is not built yet. That is the rule doing its job rather than
noise to silence — a transition naming something nothing implements is exactly what a reader of this repository would
otherwise copy.

The five Nevada notations this matter's documents are rendered from are **not** here. They are jurisdiction-wide Neon
Law forms in Navigator's shared catalog, and this Project references each by its `code` rather than carrying a copy: a
copy shadows the shared code and persists a matter-scoped version of global reference data. Retain the established codes
— a rename is a different template, not a refactor. `README.md` has the whole of it.

## Getting a change merged

Changes reach `main` through a pull request — the branch rule on `main` refuses a direct push. Squash is the only merge
method enabled, so a branch lands as a single commit and is deleted for you afterwards.

Turn auto-merge on when you open the PR, rather than coming back to merge it by hand:

```bash
gh pr merge --squash --auto
```

The one required check is `ci`: the gate job at the end of `.github/workflows/ci.yml`, which waits on `lint` and
`verify` and reports their combined result as a single status. Auto-merge holds the pull request until that gate is
green and merges it the moment it is, so a red gate parks the branch instead of landing it.

`main` also requires signed commits. This is worth knowing because of how it fails: an unsigned commit leaves the pull
request permanently unmergeable no matter how green `ci` goes, since it is the branch rule that refuses it and not the
check.

Do not open a pull request with nothing in it. An empty or make-work commit to satisfy some other process is exactly the
kind of thing a reader of this repository will copy.

## Merging

A green gate arms GitHub auto-merge on its own: the `enable-automerge` job in `.github/workflows/ci.yml` squash-merges
the pull request once `ci` passes and review threads are resolved. To hold a pull request that is ready, convert it to
draft rather than disabling auto-merge — a push re-arms it.

It arms as the `neon-law-staging-merge-queue` App and never as `GITHUB_TOKEN`, and that distinction is load-bearing
rather than cosmetic. GitHub creates no workflow runs for a push attributed to `GITHUB_TOKEN`, and auto-merge merges as
whoever armed it, so a merge armed with the run's own token lands on `main` and starts nothing — not a skipped run, not
a red one: none. Nothing goes red, because nothing runs. `.github/automerge-identity.py` runs inside `ci` and fails the
gate if that fallback is ever reintroduced.

If the App secrets are absent the job arms nothing and the pull request visibly waits for a human, which is the safe
direction to fail. Merge by hand in that case.

## Why `navigator.yaml` allows each off-origin string

Rule Y011 forbids comments in `navigator.yaml`, so the reason each allowlist entry is not a request is recorded here, in
the repository contract, rather than beside the entry. The wording below is carried over from the manifest as it stood
before the 26.9.15-rc.2 migration. An entry added later records its reason here and in the pull request that adds it.

### Off-origin strings the bundle may name

**`https://foo.bar`** — pdf.js URL-parse base — a syntactic anchor, never fetched

Both are the *base* argument to a `URL` constructor — a syntactic anchor that lets an attacker-supplied relative
reference inside a PDF resolve so it can be inspected, and in `example.com`'s case so a hash-only change can be
detected. The result is read and discarded. A PDF whose links resolved against them would be a bug in the viewer rather
than a fetch.

**`http://example.com`** — pdf.js URL-parse base for hash-only detection, never fetched

**`http://www.apache.org/licenses/LICENSE-2.0`** — Apache-2.0 notice in a comment banner

The Apache-2.0 licence URL, inside a preserved comment banner in the worker. It is attribution the licence requires be
kept, in a comment the engine never evaluates. Stripping it to satisfy the gate would be removing a licence notice,
which is the one edit here that would actually be wrong.

**`http://www.xfa.org/schema/`** — XFA package namespace identifiers — compared, never fetched

XFA package and Adobe namespace identifiers. An XFA document declares its packages by namespace URI and the worker
recognises them with `e === "…"` and `e.startsWith("…")`; read the line any match sits on and it is a string comparison
every time. A PDF able to make the worker fetch a namespace would be a vulnerability rather than a feature.

**`http://ns.adobe.com/`** — Adobe XDP, XFDF, and XMP namespace identifiers — compared, never fetched

**`https://github.com/neon-law-staging/`** — AGPL source pointer in a comment banner

The AGPL source pointer, inside the preserved `/*!` banner on every emitted chunk and stylesheet. The licence requires
the notice be kept and the engine never evaluates a comment. Stripping it to satisfy the gate would be removing a
licence notice, which is the one edit here that would actually be wrong.

**`https://github.com/neon-law-source-code/`** — Navigator repository and docs links — `href`, clicked, never fetched

Navigator's own repository and its `docs/` pages — the "what is a notation?" links in the glossary and the source link
in the footer. `href` targets a reader clicks, never fetched by the portal. This is a separate entry from the banner
above because the two live in different orgs: the sample projects moved to `neon-law-staging` and Navigator itself to
`neon-law-source-code`, so one prefix can no longer stand for both.

**`https://www.leg.state.nv.us/CourtRules/`** — NRCP citation targets — `href`, clicked, never fetched

Authority links a reader clicks, not requests the portal makes. The matter cites NRCP 33 and four Nevada cases, and
citing law without linking to it is not an option this practice takes. They are `href` targets in fixture data for
`Cruller v. Prine`, so no real client's work product is behind them. Whether a *real* client portal may carry an off-
origin authority link — a click sends the portal URL as a `Referer` — is a policy question this repository cannot
settle; see the Linear issue.

**`https://app.midpage.ai/`** — case and statute citation targets — `href`, clicked, never fetched

**`https://www.courtlistener.com/`** — case citation targets — `href`, clicked, never fetched

**`https://codemirror.net/`** — CodeMirror attribution link in the notation editor

Attribution for the editor component, rendered as a link in the UI.

### Hosts the bundle may name

**`.test`** — regex-literal boundary before `.test(` — an empty first label, never fetched

Not a host: the closing `/` of a regex literal whose last atom is an escaped slash, followed by `.test(`. CodeMirror's
JSX indent rules are full of `/^\s*<\//.test(…)`, and the scanner reads the `//` as protocol-relative. A hostname's
first label cannot be empty, so a "host" beginning with a dot resolves nowhere and can never be fetched — the same
reasoning the scanner already applies in `HOST_HAS_A_LABEL` to a run of dots. Recorded here rather than patched into the
scanner so this repository holds the identical gate script every other Project holds.
