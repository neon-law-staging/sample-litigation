#!/usr/bin/env python3
"""Fail the build if the shipped bundle reaches off our own origin.

A Project portal is served by Navigator at one mount and talks to one backend:
Navigator's own API, under the same origin. Nothing it ships may name another
host — not a CDN for a script or a font, not an analytics beacon, not a
third-party stylesheet. Two reasons, and the second is the one that bites:

1.  A client portal carries privileged work product. Every off-origin request
    leaks a referrer, an IP, and a timing signal about a matter to somebody
    else's logs, and it does so from the client's browser, where we cannot see
    it happen.
2.  A CDN reference is a supply-chain hole that a code review will not catch.
    The bundle passes review, the CDN serves something else next Tuesday, and
    nothing in this repository changed.

So the rule is enforced against the *built output*, not the source. Source can
be audited by eye; a dependency five levels down that appends a beacon URL
cannot. This reads what actually ships.

Identical in every Project repository. The two allowlists below hold what is
true of every portal we build; anything true of one portal's dependencies —
pdf.js and its namespace identifiers being the standing case — is declared in
that repository's own `navigator.yaml`, under `allowed_hosts` and
`allowed_prefixes`, with the claim written next to it.

An allowlist entry is a claim that the browser never issues a request for it,
and that claim has to be checkable by reading the line it appears on. Nothing
goes in one because it is probably fine.

Run it locally the same way CI does, after a build:

    pnpm build
    python3 .github/no-external-references.py
"""

from __future__ import annotations

import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import navigator  # noqa: E402

DIST = navigator.ROOT / "dist"

# Scanned for host references. `.map` is deliberately absent: source maps are
# not shipped, and if one ever is, the layout gate is the wrong place to say so.
SCANNED_SUFFIXES = {".js", ".mjs", ".cjs", ".css", ".html"}

# An absolute or protocol-relative URL. The scheme is optional so that
# `//evil.example/x.js` — which a browser resolves against the page's own
# scheme and fetches quite happily — is caught alongside the obvious form.
URL = re.compile(r"""(?:https?:)?//(?P<host>[a-zA-Z0-9._-]+)(?P<path>[^\s"'`)\\]*)""")

# Hosts every portal may name, because every portal is built the same way.
ALLOWED_HOSTS = {
    # XML namespace identifiers. `xmlns="http://www.w3.org/2000/svg"` is an
    # opaque string the parser compares for equality; no fetch is ever made,
    # and React emits these for every inline SVG. Blocking them would mean
    # blocking inline SVG, which is the alternative to an icon font from a CDN.
    "www.w3.org": "XML namespace identifiers — compared as strings, never fetched",
}

# URL prefixes every portal may name, for cases where the host itself is not
# blanket-allowed. A prefix pins the scheme and the path, so allowing one string
# does not allow everything else the same host could serve.
ALLOWED_PREFIXES = {
    # React's production build stringifies this prefix into its error message
    # so a minified error can be decoded by a human reading the console. It is
    # concatenated into a message, never navigated to and never fetched.
    "https://react.dev/errors/": "React minified-error explainer, in a console string",
}

# A host has to contain a letter or a digit.
#
# The pattern above is deliberately permissive about what a host may look like,
# which means a run of `/` and `.` inside a binary lookup table reads as a
# protocol-relative URL whose host is `.` — a decompressor's table is the case
# that found this. That is not a hostname under any resolver: a label is a
# letter, digit, or hyphen, so a "host" made only of dots addresses nothing and
# can never be fetched. Requiring one alphanumeric character rejects it while
# matching every real hostname, including an IP address and a single-label
# intranet name.
HOST_HAS_A_LABEL = re.compile(r"[a-zA-Z0-9]")

# Embedded base64 blobs are removed before the host scan.
#
# A base64 body is not URL text and is never compared as one. `//` occurs inside
# it by arithmetic — the alphabet contains `/` — so the pattern above finds a
# "host" in what is really a fragment of an embedded binary: an inlined font,
# an icon, a probe handed to `atob`. The pseudo-host it produces is a function
# of the bytes, so no allowlist entry could name it honestly or survive an
# upgrade of the library.
#
# Deleting these rather than allowlisting them is the claim worth making, and it
# is checkable on its own terms: **a run of 64 or more characters drawn only
# from the base64 alphabet cannot be a URL.** The alphabet has no `:`, no `.`,
# and no `-`, so such a run can hold neither a scheme nor a hostname — the only
# thing in it the pattern can match is a `//` that addresses nothing. Every
# character outside such a run is still scanned, and a shorter run still is too,
# so this cannot swallow a real reference.
BASE64_BLOB = re.compile(r"[A-Za-z0-9+/]{64,}={0,2}")

errors: list[str] = []


def scanned_files() -> list[pathlib.Path]:
    return sorted(p for p in DIST.rglob("*") if p.is_file() and p.suffix in SCANNED_SUFFIXES)


def check_hosts(path: pathlib.Path, text: str, hosts: dict[str, str], prefixes: dict[str, str]) -> None:
    """No reference to a host that is not ours."""
    # Replaced with the same number of characters, so a reported offset still
    # points where it did and the surrounding context still reads correctly.
    text = BASE64_BLOB.sub(lambda m: "." * len(m.group(0)), text)
    for match in URL.finditer(text):
        host = match.group("host")
        if host in hosts or not HOST_HAS_A_LABEL.search(host):
            continue
        full = match.group(0)
        if any(full.startswith(prefix) for prefix in prefixes):
            continue
        # Report the surrounding characters: in a minified bundle a line number
        # is one enormous line, so context is the only thing that locates it.
        start = max(match.start() - 60, 0)
        context = text[start : match.end() + 60].replace("\n", " ")
        errors.append(
            f"{path}: off-origin reference to `{host}` — {full[:120]}\n"
            f"    …{context}…\n"
            "    A portal reads only Navigator's API under its own origin. If this is a "
            "dependency's doing, pin or patch it; if it is genuinely not a request, add it "
            "to `allowed_hosts` or `allowed_prefixes` in navigator.yaml with the reason."
        )


def check_minified(path: pathlib.Path, text: str) -> None:
    """JavaScript ships minified.

    Not a size rule — an unminified chunk means a build ran with a different
    config than the one CI checked, so nothing else this script asserts can be
    trusted to describe what a client receives.
    """
    if path.suffix not in {".js", ".mjs", ".cjs"} or not text:
        return
    lines = text.splitlines() or [""]
    longest = max(len(line) for line in lines)
    # A minified chunk is a handful of very long lines. A source-shaped file is
    # thousands of short indented ones; 200 sits well clear of both.
    if longest < 200 and len(lines) > 50:
        errors.append(
            f"{path}: looks unminified ({len(lines)} lines, longest {longest} chars). "
            "The gate describes what a client receives, so it must read the real build."
        )


def check_no_external_sourcemap(path: pathlib.Path, text: str) -> None:
    """A source map comment may not point off-origin."""
    for match in re.finditer(r"sourceMappingURL=(\S+)", text):
        target = match.group(1)
        if target.startswith("http") or target.startswith("//"):
            errors.append(f"{path}: sourceMappingURL points off-origin: {target}")


def main() -> int:
    try:
        config = navigator.load()
    except navigator.ConfigError as error:
        print(f"::error::{error}")
        return 1

    if not DIST.is_dir():
        print(f"::error::{DIST} does not exist; run `pnpm build` first.")
        return 1

    files = scanned_files()
    if not files:
        print(f"::error::{DIST} holds no {'/'.join(sorted(SCANNED_SUFFIXES))} files to check.")
        return 1

    hosts = {**ALLOWED_HOSTS, **config.allowed_hosts}
    prefixes = {**ALLOWED_PREFIXES, **config.allowed_prefixes}

    for path in files:
        text = path.read_text(encoding="utf-8", errors="replace")
        check_hosts(path, text, hosts, prefixes)
        check_minified(path, text)
        check_no_external_sourcemap(path, text)

    if errors:
        for error in errors:
            print(f"::error::{error}")
        print(f"\n{len(errors)} external-reference violation(s).")
        return 1

    print(f"no external references: {len(files)} built file(s) reference no host but our own.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
