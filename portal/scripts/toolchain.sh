#!/usr/bin/env bash
#
# Copyright (C) 2026 Shook Law PLLC.
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Put the renderer the portal's documents need on `PATH`: the Navigator CLI, at
# the exact version `navigator.yaml` pins.
#
# This file is sourced, never run:
#
#   . "$(dirname "$0")/toolchain.sh"
#   ensure_navigator
#
# Why this exists
# ---------------
# The PDFs under `dist/documents/` used to be committed, because the bundle had
# to build on a machine that had never installed the tool. The repository gate
# now refuses a rendered PDF anywhere in the tree, so they are produced during
# the build instead — which means the build has to be able to get the renderer.
#
# The reusable `project-gate.yml` this repository is pinned to does install the
# Navigator CLI, but only *after* it has run `typecheck`, `test`, and `build`,
# and a caller pinned to an immutable release tag cannot reorder that job. So
# the application workspace fetches what it needs itself, from the same pinned
# release the workflow would have used.
#
# It is a cache, not an install: an already-present tool of the right version is
# used as-is, and nothing is written inside this repository. A contributor who
# has `navigator` from the Homebrew tap downloads nothing.
set -euo pipefail

# Outside the checkout on purpose. A downloaded binary inside the tree is a file
# the repository gate, the linters, and somebody's `git status` all have to be
# taught to ignore.
TOOLCHAIN_DIR="${NAVIGATOR_TOOLCHAIN_DIR:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/navigator-portal-toolchain}"

# The Navigator release these documents are rendered from is the one the
# manifest pins, read rather than repeated: a renderer newer than the gate would
# produce output the gate never checked.
navigator_version() {
    local manifest="${1}"
    local version
    version="$(sed -n 's/^version:[[:space:]]*//p' "${manifest}" | head -n 1 | tr -d '[:space:]')"
    if [ -z "${version}" ]; then
        echo "toolchain: no version: in ${manifest}" >&2
        return 1
    fi
    printf '%s\n' "${version}"
}

platform_kernel() {
    case "$(uname -s)" in
        Darwin) printf 'macos\n' ;;
        Linux) printf 'linux\n' ;;
        *)
            echo "toolchain: unsupported platform $(uname -s)" >&2
            return 1
            ;;
    esac
}

# GitHub serves a release asset and a file at a ref from the `github.com` host
# and redirects onward, so every URL below stays under the one prefix this
# repository already names. `--location` follows the redirect; `--fail` turns an
# HTML error page into a non-zero exit rather than a corrupt archive.
fetch() {
    curl --fail --silent --show-error --location --retry 3 "${1}" --output "${2}"
}

ensure_navigator() {
    local manifest="${1:-../navigator.yaml}"
    local version
    version="$(navigator_version "${manifest}")"

    if command -v navigator >/dev/null 2>&1 && [ "$(navigator --version 2>/dev/null)" = "navigator ${version}" ]; then
        return 0
    fi

    local dir="${TOOLCHAIN_DIR}/navigator-${version}"
    if [ ! -x "${dir}/navigator" ]; then
        local asset archive tmp
        asset="navigator-${version}-$(platform_kernel).tar.gz"
        tmp="$(mktemp -d)"
        archive="${tmp}/${asset}"
        echo "toolchain: fetching navigator ${version}"
        fetch "https://github.com/neon-law-source-code/navigator/releases/download/${version}/${asset}" "${archive}"
        tar -xzf "${archive}" -C "${tmp}" navigator
        mkdir -p "${dir}"
        install -m 0755 "${tmp}/navigator" "${dir}/navigator"
        rm -rf "${tmp}"
    fi

    PATH="${dir}:${PATH}"
    export PATH
}


# The five notation documents are rendered from Navigator's shared catalog
# rather than from a copy in this repository. The Project references those
# templates by `code`; carrying a copy here would shadow the shared code and
# persist a Project-scoped version of it, which is the inversion LAW-7 settled
# against. So the render reads them at the pinned release tag, which is the same
# revision the deployment resolves the code against.
#
# Writes the file's path on stdout.
catalog_template() {
    local name="${1}"
    local manifest="${2:-../navigator.yaml}"
    local version dir
    version="$(navigator_version "${manifest}")"
    dir="${TOOLCHAIN_DIR}/catalog-${version}"

    if [ ! -f "${dir}/${name}.md" ]; then
        mkdir -p "${dir}"
        fetch \
          "https://github.com/neon-law-source-code/navigator/raw/${version}/templates/notations/neon_law/shared/${name}.md" \
          "${dir}/${name}.md"
    fi

    printf '%s\n' "${dir}/${name}.md"
}
