#!/usr/bin/env python3
"""Read `navigator.yaml` — the one file in which this repository names itself.

Every Project repository carries an identical gate, an identical publish
workflow, and identical checked-in gate scripts. The three facts that genuinely
differ between repositories live here instead, in one declarative file a
reviewer can read in ten seconds:

    host      the deployment that serves this Project
    project   the Project code, which is the mount and the bucket prefix

Everything downstream is derived from those two. The mount is
`/app/projects/<project>/portal/` — `portal/vite.config.ts` builds the bundle at
it, `portal/src/**/mount.test.ts` asserts it, the gate re-derives it and checks
the built `index.html` against it, and Navigator serves it there. The
applications bucket is a function of `host` alone, through `DEPLOYMENTS` below,
so no workflow and no repository variable names a bucket.

This replaces deriving the code from the checkout directory. That derivation was
free of a manifest but not free of a cost: a clone into a differently named
directory silently built a different base, and a Project whose code is not its
repository name could not be expressed at all. A declared code is checked
against Navigator's own contract by the gate, which is the same protection with
neither of those holes.

The optional keys are accepted divergences, and each one is a decision that
needs its reason written beside it in the YAML:

    exempt_roots       extra root entries this repository may carry
    exempt_paths       individual paths exempt from the component and
                       extension rules
    allowed_hosts      hosts the built bundle may name, host: reason
    allowed_prefixes   URL prefixes the built bundle may name, prefix: reason

Read from Python by `conventions.py` and `no-external-references.py`; read from
the workflows through this file's own command line:

    python3 .github/navigator.py --check
    python3 .github/navigator.py project
    python3 .github/navigator.py applications-bucket
"""

from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONFIG = ROOT / "navigator.yaml"

# Every deployment that can serve a Project portal, and the private applications
# bucket it streams one out of. The rows mirror `deployments/<name>/config.toml`
# in `navigator-deploy`: `CANONICAL_HOST` on the left,
# `NAVIGATOR_APPLICATIONS_BUCKET` on the right.
#
# A closed table, deliberately. It is what makes `host: www.neonlaw.com` in a
# repository mean production and nothing else — a typo, a retired hostname, or a
# host nobody has provisioned fails the gate here rather than publishing a
# client portal into a bucket that does not exist. Adding a deployment is adding
# a row, in the same commit that adds it to `navigator-deploy`.
DEPLOYMENTS = {
    "www.neonlaw.com": "neon-law-prod-applications",
    "staging.neonlaw.com": "neon-law-stg-applications",
}

# The Project code is a URL path segment, a bucket prefix, and a Navigator
# identifier at once, so it is a lowercase slug and nothing else. No uppercase
# (bucket prefixes are compared byte for byte), no underscore, no leading,
# trailing, or doubled hyphen.
PROJECT_CODE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

# The shape of every key this file understands. A key outside it is an error
# rather than a value silently ignored: a misspelled `exempt_root` that quietly
# did nothing would show up as a red gate nobody could explain.
FIELDS = {
    "host": "scalar",
    "project": "scalar",
    "exempt_roots": "list",
    "exempt_paths": "list",
    "allowed_hosts": "map",
    "allowed_prefixes": "map",
}

REQUIRED = ("host", "project")


class ConfigError(Exception):
    """`navigator.yaml` is missing, malformed, or says something impossible."""


def _strip_comment(line: str) -> str:
    """Drop a trailing `# …` comment, honouring quotes.

    A hash only starts a comment at the start of the line or after whitespace,
    which is YAML's own rule and the reason `exempt_roots: ["*.md"]` survives a
    value containing one.
    """
    out: list[str] = []
    quote: str | None = None
    for index, character in enumerate(line):
        if quote:
            out.append(character)
            if character == quote:
                quote = None
        elif character in "\"'":
            quote = character
            out.append(character)
        elif character == "#" and (index == 0 or line[index - 1] in " \t"):
            break
        else:
            out.append(character)
    return "".join(out).rstrip()


def _scalar(value: str) -> str:
    """Unquote a scalar. Quoting is optional and carries no other meaning."""
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def _parse(text: str) -> dict[str, object]:
    """The subset of YAML this file is written in.

    Top-level scalars, and two-space-indented list items or `key: value` pairs
    beneath a bare key. Deliberately not a YAML library: PyYAML is not in the
    standard library, a runner that happens to have it today is not a contract,
    and `pip install` in a gate is a network dependency on the one job that has
    to be able to say no. The grammar below is the whole file format, and
    anything outside it is reported rather than guessed at.
    """
    data: dict[str, object] = {}
    block: str | None = None

    for number, raw in enumerate(text.splitlines(), start=1):
        line = _strip_comment(raw)
        if not line.strip():
            continue

        indent = len(line) - len(line.lstrip(" "))
        stripped = line.strip()

        if indent == 0:
            if ":" not in stripped:
                raise ConfigError(f"{CONFIG.name}:{number}: `{stripped}` is not `key: value`")
            key, _, value = stripped.partition(":")
            key, value = key.strip(), value.strip()
            if key not in FIELDS:
                known = ", ".join(sorted(FIELDS))
                raise ConfigError(f"{CONFIG.name}:{number}: unknown key `{key}`; expected one of {known}")
            if key in data:
                raise ConfigError(f"{CONFIG.name}:{number}: `{key}` is declared twice")
            if value in {"", "[]", "{}"}:
                data[key] = [] if FIELDS[key] == "list" else {} if FIELDS[key] == "map" else ""
                block = key if value == "" else None
            else:
                if FIELDS[key] != "scalar":
                    raise ConfigError(f"{CONFIG.name}:{number}: `{key}` takes a block, not an inline value")
                data[key] = _scalar(value)
                block = None
            continue

        if block is None:
            raise ConfigError(f"{CONFIG.name}:{number}: `{stripped}` is indented under no key")

        shape = FIELDS[block]
        if shape == "list":
            if not stripped.startswith("- "):
                raise ConfigError(f"{CONFIG.name}:{number}: `{block}` is a list; write `- {stripped}`")
            data[block].append(_scalar(stripped[2:].strip()))  # type: ignore[union-attr]
        elif shape == "map":
            # Split on the first `: `, not the first `:`, which is YAML's own rule
            # and the only reading under which a URL can be a key. `partition(":")`
            # turned `https://foo.bar: reason` into the key `https` — and because
            # the only consumer tests `full.startswith(prefix)`, a bare scheme
            # matched every http and https reference in the bundle. The gate went
            # quiet rather than red, which is the worst way for a gate to fail.
            # ENG-262: one Project portal shipped in that state, and is named
            # there by positional label rather than by Project code.
            key, separator, value = stripped.partition(": ")
            if not separator:
                raise ConfigError(f"{CONFIG.name}:{number}: `{block}` is a map; write `key: reason`")
            data[block][_scalar(key.strip())] = _scalar(value.strip())  # type: ignore[index]
        else:
            raise ConfigError(f"{CONFIG.name}:{number}: `{block}` is a scalar and takes no block")

    return data


class Navigator:
    """This repository's `navigator.yaml`, parsed and checked."""

    def __init__(self, data: dict[str, object]) -> None:
        self.host: str = data.get("host", "")  # type: ignore[assignment]
        self.project: str = data.get("project", "")  # type: ignore[assignment]
        self.exempt_roots: list[str] = data.get("exempt_roots", [])  # type: ignore[assignment]
        self.exempt_paths: list[str] = data.get("exempt_paths", [])  # type: ignore[assignment]
        self.allowed_hosts: dict[str, str] = data.get("allowed_hosts", {})  # type: ignore[assignment]
        self.allowed_prefixes: dict[str, str] = data.get("allowed_prefixes", {})  # type: ignore[assignment]

    @property
    def mount(self) -> str:
        """Where Navigator serves this portal.

        The trailing slash is load-bearing twice: Vite joins asset URLs directly
        onto it, and Navigator redirects the bare mount to this form. The extra
        `portal` segment is not decoration either — mounting at
        `/app/projects/<code>` would shadow Navigator's own matter show page at
        `/app/projects/{id}`.
        """
        return f"/app/projects/{self.project}/portal/"

    @property
    def prefix(self) -> str:
        """This Project's object prefix inside the shared applications bucket."""
        return f"{self.project}/portal/"

    @property
    def applications_bucket(self) -> str:
        return DEPLOYMENTS[self.host]

    @property
    def exempt(self) -> bool:
        """Whether this repository claims any accepted divergence.

        Navigator's own `validate` action has no exemption mechanism, so the gate
        runs it only where the answer here is no. A repository that declares one
        is held by the checked-in stand-in instead, which reads the same
        `navigator.yaml` and therefore knows what was accepted and why.
        """
        return bool(self.exempt_roots or self.exempt_paths)


def load() -> Navigator:
    """Read and validate `navigator.yaml`, or raise `ConfigError` saying why."""
    if not CONFIG.is_file():
        raise ConfigError(
            f"{CONFIG.name} does not exist. Every Project repository declares its host and "
            "its Project code in one, at the repository root."
        )

    config = Navigator(_parse(CONFIG.read_text(encoding="utf-8")))

    missing = [key for key in REQUIRED if not getattr(config, key)]
    if missing:
        raise ConfigError(f"{CONFIG.name}: no {' and no '.join(f'`{key}`' for key in missing)}")

    if config.host not in DEPLOYMENTS:
        known = ", ".join(sorted(DEPLOYMENTS))
        raise ConfigError(
            f"{CONFIG.name}: `{config.host}` is not a Navigator deployment host. "
            f"Known hosts are {known}; add a row to DEPLOYMENTS in .github/navigator.py "
            "in the same commit that adds the deployment to navigator-deploy."
        )

    if not PROJECT_CODE.match(config.project):
        raise ConfigError(
            f"{CONFIG.name}: `{config.project}` is not a Project code. A code is a lowercase "
            "slug — it becomes a URL path segment and a bucket prefix, both compared byte for byte."
        )

    return config


def main(argv: list[str]) -> int:
    try:
        config = load()
    except ConfigError as error:
        print(f"::error::{error}")
        return 1

    fields = {
        "host": config.host,
        "project": config.project,
        "mount": config.mount,
        "prefix": config.prefix,
        "applications-bucket": config.applications_bucket,
        "exempt": "true" if config.exempt else "false",
    }

    if not argv or argv[0] == "--check":
        width = max(len(name) for name in fields)
        print(f"navigator.yaml: {config.project} on {config.host}")
        for name, value in fields.items():
            print(f"  {name:<{width}}  {value}")
        return 0

    if argv[0] not in fields:
        print(f"::error::unknown field `{argv[0]}`; expected one of {', '.join(fields)}")
        return 1

    print(fields[argv[0]])
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
