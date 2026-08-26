#!/usr/bin/env python3
"""Guard the identity that arms auto-merge.

`ci.yml`'s `enable-automerge` job turns on GitHub auto-merge for a green pull
request. WHICH CREDENTIAL IT USES IS NOT COSMETIC: GitHub's workflow-recursion
guard creates no workflow runs for a push attributed to `GITHUB_TOKEN`, and
auto-merge merges as whoever armed it. A merge armed under the run's own token
therefore lands on `main` and starts no workflow at all — not a skipped run, not
a red one: none. `main` moves with nothing having validated it, and no check
anywhere goes red to say so.

That is not hypothetical. `navigator` lost a release to it (its PR #95), and one
of the private Project repositories lost a publish to it twice (its PRs #9 and
#10), which left production serving a stale bundle until it was recovered by
hand. That repository is not named here: a Project code is a client identifier
and does not belong in this codebase. See ENG-262 for the affected portals,
which names them by positional label.

These repositories now carry a `publish.yml` that triggers on `push` to `main`,
so the bug costs a publish here as well as the `ci` validation of the push — the
same failure, the same silence, and now the same consequence as the incident
above. This paragraph used to say there was no `publish.yml`; that stopped being
true when the portal gained one, which is exactly the kind of drift this guard
exists to make loud rather than quiet.

The App is `neon-law-staging-merge-queue` (app id 4683165), owned by
`neon-law-staging` and installed on all of its repositories, so a repository
created later needs no install step. It holds exactly `contents: write` and
`pull_requests: write`, and deliberately no `workflows`: a pull request touching
`.github/workflows/**` therefore cannot be armed by it and is merged by hand —
including the one that introduced this file.

This file is the stdlib port of `navigator`'s `cli/tests/automerge_identity.rs`,
which cannot be reused because these repositories have no Rust workspace. Its
runbook is `navigator`'s `docs/gitops.md` under "Auto-merge identity".

The absence of a fallback is the whole assertion. The shape that caused
navigator's incident was

    GH_TOKEN: ${{ steps.app-token.outputs.token || github.token }}

with the mint step gated on the App secret being present — so an ABSENT secret
skipped the mint and fell through to the losing identity. Fail-open, and
invisible. A missing App must instead skip arming and leave the pull request
visibly waiting for a human; a present but broken App must fail the mint and arm
nothing. Both are fail-closed, and neither can lose a run quietly.

Run by the `ci` job, which is the required status check, so this cannot be
bypassed without editing the required check itself. Stdlib only: CI here
installs no packages before the gate, so there is no YAML parser to lean on and
the job block is extracted by indentation instead.
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"

JOB = "enable-automerge"

# `github.token` and `secrets.GITHUB_TOKEN` are the same credential under two
# spellings. A fallback reintroduced with either would lose the next run the
# same way, so both are forbidden anywhere in the job.
FORBIDDEN = ("github.token", "secrets.GITHUB_TOKEN")

# What must be present, so this never passes by the job having been deleted or
# renamed out from under it.
REQUIRED = (
    "actions/create-github-app-token",
    "secrets.AUTOMERGE_APP_ID",
    "secrets.AUTOMERGE_APP_PRIVATE_KEY",
    "steps.app-token.outputs.token",
)


def fail(message: str) -> None:
    """Report to Actions and to a human reading a local run."""
    print(f"::error::{message}")
    print(message, file=sys.stderr)


def job_block(text: str) -> str:
    """The `enable-automerge:` job, comments stripped.

    Comments are removed because the prose above and in the workflow itself
    necessarily names the credential it forbids. Only configuration counts —
    an `env:`, a `with:`, or an inline expression in a `run:`.
    """
    lines = text.splitlines()
    start = None
    for index, line in enumerate(lines):
        if re.match(rf"^  {re.escape(JOB)}:\s*$", line):
            start = index
            break
    if start is None:
        raise LookupError(
            f"`{JOB}` job not found in {WORKFLOW.relative_to(ROOT)}. If it was renamed, "
            "point this guard at the new name in the same commit — a guard that cannot "
            "find its subject passes vacuously forever."
        )

    body = []
    for line in lines[start + 1 :]:
        # A non-blank line indented two spaces or less starts the next job.
        if line.strip() and not line.startswith("    "):
            break
        body.append(line)

    stripped = []
    for line in body:
        # Naive, and adequate: no `run:` line in this job contains a `#` that is
        # not a comment. A shell comment is still a comment. The lookbehind is
        # what keeps `${GITHUB_SERVER_URL#https://}` intact.
        without_comment = re.sub(r"(?<!\S)#.*$", "", line)
        if without_comment.strip():
            stripped.append(without_comment)
    return "\n".join(stripped)


def main() -> int:
    try:
        text = WORKFLOW.read_text(encoding="utf-8")
    except OSError as error:
        fail(f"read {WORKFLOW}: {error}")
        return 1

    try:
        job = job_block(text)
    except LookupError as error:
        fail(str(error))
        return 1

    problems = []
    for spelling in FORBIDDEN:
        if spelling in job:
            problems.append(
                f"`{JOB}` must not hand `{spelling}` to any step: GitHub creates no "
                "workflow runs for a push attributed to it, so a merge armed under it "
                "validates nothing and reports nothing. Arm with the "
                "`neon-law-staging-merge-queue` App or arm nothing."
            )

    for needle in REQUIRED:
        if needle not in job:
            problems.append(
                f"`{JOB}` no longer references `{needle}`. Arming must go through the "
                "App token; if this job was rewritten, rewrite this guard with it."
            )

    if problems:
        for problem in problems:
            fail(problem)
        print(f"\n{len(problems)} auto-merge identity violation(s).")
        return 1

    print(
        f"auto-merge identity: `{JOB}` arms as the neon-law-staging-merge-queue App, "
        "with no fallback to the workflow token."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
