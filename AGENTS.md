# Working in sample-litigation

This is a `navigator` project, use the `navigator` CLI to work here.

## Everything here is fixture data

*Cruller v. Prine* is a simulated matter. This is a worked example a contributor reads and clones, so anything committed
here is something somebody will copy: no client data in a template, in a test, or as an example in a comment, ever.

The one exception is a real, public-domain legal authority — a published court opinion or an enacted statute, of the
kind `portal/src/research.ts` and `portal/src/caseLibrary.ts` already cite and mark `verified: true`. Its full text may
be committed verbatim and clearly marked as real rather than fixture, because it discloses nothing about any matter and
a government work carries no copyright. That covers the authority's own text only; matter-specific analysis of it stays
fixture, and the off-origin rule below still applies.

## The five Nevada notations are not here

They are jurisdiction-wide Neon Law forms in Navigator's shared catalog, and this Project references each by its `code`
rather than carrying a copy: a copy shadows the shared code and persists a matter-scoped version of global reference
data. Retain the established codes — a rename is a different template, not a refactor. Each is rendered through
`navigator notations render` by `portal/scripts/render-documents.sh`, and `README.md` has the whole of it.

## Documents are pointers, not bytes

`navigator site sync` uploads staged `documents/` bytes through Navigator and retains a `.pdf.yml` pointer beside each
one; `navigator site pull` refills that staging directory from the committed pointers. The bytes are never committed —
`.gitignore` covers them, and the gate refuses a PDF anywhere outside `dist/` regardless, because it follows the bytes
rather than the path.

The object key is the pointer's own path below `documents/`, so a folder in the key is a folder on disk and there is no
`key:` field to set. A pointer carries `kind`, `visibility`, `current_version`, and `previous_version`; a version
carries `version`, `asset_id`, `created_at`, `sha256`, and `size_bytes`. `--kind` is a closed list, and `--visibility`
defaults to `internal`, so a document the portal is meant to show has to say `client`.

`navigator project gate` and `navigator site document verify` both check pointers offline, and `verify --ci --host`
checks them against the live asset record over GitHub Actions OIDC. CI needs no bucket credential for this, which is
also why the check is not a second backend.

One thing is broken today: `navigator site sync` refuses this repository's manifest, wanting `project:` as a string
where `navigator.yaml` carries a map. `navigator project gate` accepts the map. That is a CLI defect, so it belongs in a
Linear issue on the Lawyers team rather than in a workaround here.

## Before calling work done

```bash
pnpm --dir portal check   # lint, typecheck, build, tests, in that order
navigator project gate    # Markdown, YAML, the manifest, and built origin references, over the whole tree
```

The build is part of `check` because several tests assert against what `pnpm build` actually emitted rather than against
the source. `validate` is deliberately not part of `check`, so a contributor who has not installed the CLI is not
blocked by it. Run both before pushing.

Install the CLI tap-qualified, on purpose:

```bash
brew install neon-law-source-code/navigator/navigator
```

An unqualified `brew install navigator` resolves to a Homebrew cask for a trackpad utility of the same name, which
installs cleanly and then has no `project` subcommand. CI uses no Homebrew; it installs the pinned release the workflows
call.

Running `navigator project gate` walks this repository the way CI's structural pass does: templates, applications, and
the manifest. It does not lint, typecheck, build, or test the portal, which is what the `check` script is for.

## Notation lint

`validate` takes no file list and there is no list to keep current: it walks the tree itself, so a document is covered
the moment it exists. Vendored trees such as `node_modules/` are skipped, but `.gitignore` is not consulted, so a
generated file sitting in the tree is linted like any other.

Each Markdown file is classified as it is read. Prose gets the structural rules (`M*`) and the line-width rules (`S*`);
a file whose frontmatter makes it a notation — a `code:`, a `questionnaire:`, a `workflow:` — additionally gets the
notation rules (`N*`). A finding prints as `path:line RULE: message`, and an error exits non-zero where a warning is
only reported.

`navigator project gate` applies in place the fixes that are safe by construction — whitespace, ATX heading spacing,
blockquote spacing — and then re-checks; `--ci`, which is what CI runs, refuses to write and fails instead. The rest are
diagnostic only: the `N*` rules, duplicate headings (M024), trailing heading punctuation (M026). A notation state
machine is not something a formatter should rewrite.

The same check covers `templates/` as part of the tree. It reports one N112 warning per template: each `lawyer_review`
step reaches automation that is not built yet. That is the rule doing its job rather than noise to silence — a
transition naming something nothing implements is exactly what a reader of this repository would otherwise copy.

## Writing prose that passes

Fill every line greedily to 120 columns, which is what the width rules ask for: **S101** rejects a line over 120, and
**S102** rejects a line that stopped short of 120 with a word still to come. Match that when you edit rather than
rewrapping a paragraph to 80 or 100 columns. Four things the rule messages do not say:

- Some spans cannot be broken across lines: a link, because CommonMark forbids a break inside a destination; an inline
  code span, because a break leaves whitespace at its edge (M038); an emphasis span, because the rules are line-scoped
  (M037). So a ~100-character link landing at the start of a line reports S102 permanently — reword until the link sits
  inside a line, or make it the first thing in its paragraph.
- Reference-style links are not the way out of that: a definition line carrying a bare URL reports M034.
- A literal too long to shorten belongs in a fenced block, with a language tag (M040). S101 does not reach inside a
  fence.
- Italics inside a list item bulleted with an asterisk report M037, because the bullet's own asterisk counts as an
  inline marker. A dash bullet has no such problem, and M004 holds a file to whichever character its first bullet used.

## Getting a change merged

- Changes reach `main` through a pull request; the branch rule on `main` refuses a direct push.
- Squash is the only merge method enabled, so a branch lands as a single commit and is deleted for you afterwards.
- The one required check is `ci / ci`, the gate the pinned `project-gate.yml` reports. A red gate parks the branch
  instead of landing it.
- A green gate arms auto-merge on its own: the `enable-automerge` job in `.github/workflows/ci.yml` squash-merges the
  pull request once `ci` passes and review threads are resolved. Arming it yourself with `gh pr merge --squash --auto`
  is harmless but unnecessary.
- It arms as the merge-queue App and never as `GITHUB_TOKEN`: GitHub creates no workflow runs for a push attributed to
  `GITHUB_TOKEN`, and auto-merge merges as whoever armed it, so a merge armed with the run's own token lands on `main`
  and starts nothing at all. If the App secrets are absent the job arms nothing and the pull request visibly waits for a
  human, which is the safe direction to fail; merge by hand in that case.
- To hold a pull request that is ready, convert it to draft rather than disabling auto-merge. The job leaves a draft
  alone, and a push re-arms it.
- `main` also requires signed commits, and that is worth knowing because of how it fails: an unsigned commit leaves the
  pull request permanently unmergeable no matter how green `ci` goes, since it is the branch rule that refuses it and
  not the check.
- Do not open a pull request with nothing in it. An empty or make-work commit to satisfy some other process is exactly
  the kind of thing a reader of this repository will copy.

## Reaching outside this tree

`navigator project repository sync-skills` writes Navigator's canonical agent skills into `.claude/skills/`. The
`stay-in-repo` skill there is the scope rule to read before reaching outside this tree. One thing it does not cover,
because it is specific to this bundle: another checkout of Navigator itself. The route this bundle mounts under belongs
to Navigator, and `README.md` records what the contract is. Read the README rather than a copy of Navigator's source
that happens to be on this machine; it may be a different revision than the one serving this bundle, and a contract read
from the wrong revision is worse than one read from documentation.

When Navigator's CLI is missing or wrong, open a Linear issue on the Lawyers team rather than documenting a CLI
workaround here.
