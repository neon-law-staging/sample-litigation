#!/usr/bin/env bash
#
# Copyright (C) 2026 Shook Law PLLC.
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Compile every Typst pleading in this repository to the PDF the portal serves.
#
#   pnpm render:pleadings
#
# This is the sibling of `render-documents.sh`, and the two are separate scripts
# because they need different tools. That one needs the Navigator CLI, which
# renders notation templates; this one needs `typst` and nothing else. Keeping
# them apart means a contributor who edits the motion re-renders only the
# motion. Both run as `postbuild`, and both take what they need from
# `scripts/toolchain.sh` when it is not already installed.
#
# Why the pleadings are not notation templates
# --------------------------------------------
# A notation template declares a render profile — `output: letter` or the default
# plain page — and the renderer owns the page furniture from there. That is the
# right trade for a letter or an affidavit and the wrong one for pleading paper,
# which is 28 numbered lines, three vertical rules, and a caption box whose
# height has to be a whole number of those lines. There is no notation profile
# for that, and inventing one in this repository would be inventing it in the
# wrong repository — the profiles are Navigator's.
#
# So the pleadings are Typst source, held in `pleadings/`, and this script is the
# whole of the build. The PDF it produces is **generated during the build rather
# than committed**: the repository gate refuses a rendered PDF anywhere in this
# tree except `dist/`, which is also the only directory `vite build` owns. Run
# this whenever a `.typ` file changes, or just run `pnpm build`.
#
# `pleadings/` is a top-level directory of the application rather than
# `templates/typst/` because a Project's `templates/` is flat and holds notation
# blueprints — a `.typ` file in there is a file the notation rule set has an
# opinion about and should not.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=portal/scripts/toolchain.sh
. "$(dirname "$0")/toolchain.sh"

ensure_typst
mkdir -p dist/documents

# The typeface is Typst's own bundled Libertinus Serif, named in
# `pleadings/pleading-paper.typ` rather than passed here. That is deliberate: a
# system font would render differently on the next contributor's machine, and a
# document that changes when somebody else rebuilds it is a document nobody can
# review. `scripts/toolchain.sh` pins the compiler for the same reason.
typst compile \
  --root . \
  pleadings/motion-summary-judgment.typ \
  dist/documents/motion-for-summary-judgment.pdf

echo "rendered $(ls -1 pleadings/*.typ | grep -cv 'pleading-paper.typ') pleading(s) to dist/documents/"
