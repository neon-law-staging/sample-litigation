# Working in this repository

## Stay inside this repository

Everything needed to build, run, test, and understand this bundle is in this repository. Read and edit only what is
inside it. Do not go looking through the rest of the machine — not the home directory, not sibling checkouts, not other
Navigator repositories, not the system temp directory.

That includes the places it is tempting to reach for:

* **Another checkout of Navigator itself.** The route this bundle mounts under belongs to Navigator, and `README.md`
  records what the contract is. Read the README rather than a copy of `portal/src/project_portal.rs` that happens to be
  on this machine — it may be a different revision than the one serving this bundle, and a contract read from the wrong
  revision is worse than one read from documentation.
* **A sibling sample project.** The other sample bundles solve the same problem differently on purpose. Copying from one
  of them by hand imports a decision without importing the reason for it.
* **Anything under `~/`.** No credential, no `.npmrc`, no global config is needed here: `pnpm install` runs with no
  registry account and no token, which is the point of installing navigator-ux from a public GitHub Release.

`node_modules/` **is** inside the repository and is fair game — it is where the published navigator-ux tokens, types,
and stylesheet actually live, and reading them is how you check what the library provides rather than guessing at it.

If a task genuinely cannot be done without something outside this tree, say so and ask. Do not go find it.

Scratch files belong outside the repository, in the session's scratchpad. A temporary script left in the working tree
becomes somebody's confusing diff.

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

`pnpm check` — lint, typecheck, build, and tests, in that order. The build is part of it because several tests assert
against what `pnpm build` actually emitted rather than against the source.

`README.md` is the orientation: what mounts where, why the base path is load-bearing, what the ready-hook contract is,
and how the documents are rendered. It is long because those are the things that break a bundle silently. Read it before
changing anything structural, and update it when the answer it gives stops being true.

## Notation lint

`pnpm check` covers the TypeScript. The Markdown and the YAML answer to the Neon Law Navigator rule set instead, and the
only thing that reads them is the Navigator CLI:

```bash
brew install neon-law-foundation/navigator/navigator   # macOS, and tap-qualified on purpose
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

`pnpm validate` is deliberately not part of `pnpm check`: `check` needs only what `pnpm install` brings, so a
contributor who has not installed the CLI is not blocked by it. Run both before pushing.

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

* **Some spans cannot be broken across lines.** A link, because CommonMark forbids a line break inside a destination; an
  inline code span, because a break leaves whitespace at its edge (M038); an emphasis span, because the rules are
  line-scoped and a span crossing a line reads as unbalanced (M037). So a ~100-character link that lands at the start of
  a line reports S102 permanently — reword the sentence until the link sits inside a line, or make it the first thing in
  its paragraph.
* **Reference-style links are not the way out of that.** A definition line carrying a bare URL reports M034.
* **A literal too long to shorten belongs in a fenced block.** S101 does not reach inside a fence, so a CSP header or a
  long command goes in one — with a language tag, which is what M040 wants.
* **Italics inside a list item bulleted with an asterisk report M037.** The bullet's own asterisk is counted as an
  inline marker. A dash bullet has no such problem, and M004 holds a file to whichever character its first bullet used.

The classification matters more here than in a repository of plain documentation. `templates/neon_law/` holds three
notations, and `navigator validate` is the only thing in the tree that reads their `questionnaire:` and `workflow:`
state machines at all — `pnpm check` never opens them, and `pnpm validate:templates` is the same check narrowed to that
folder. It currently reports three N112 warnings there, one per template, each a `lawyer_review` step the workflow can
reach whose automation is not built yet. That is the rule doing its job rather than noise to silence: a transition
naming something nothing implements is exactly what a reader of this repository would otherwise copy.

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
