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
# renders notation templates and brings a Rust toolchain with it; this one needs
# `typst` and nothing else. Keeping them apart means a contributor who edits the
# motion can re-render it without installing Navigator, and a contributor who
# edits a notation template does not need Typst on their machine.
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
# whole of the build. They are **committed rather than generated during
# `vite build`**, for the same reason the notation documents are: the bundle has
# to build on a machine that has never installed Typst, and CI should not need a
# typesetter to ship a React app. Re-run this whenever a `.typ` file changes.
#
# `pleadings/` is a top-level directory rather than `templates/typst/` because
# `pnpm validate:templates` runs `navigator validate templates` over the whole of
# `templates/`, and a `.typ` file in there is a file the notation rule set has an
# opinion about and should not.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/documents

# The typeface is Typst's own bundled Libertinus Serif, named in
# `pleadings/pleading-paper.typ` rather than passed here. That is deliberate: a
# system font would render differently on the next contributor's machine, and a
# committed PDF that changes when somebody else rebuilds it is a committed PDF
# nobody can review.
typst compile \
  --root . \
  pleadings/motion-summary-judgment.typ \
  public/documents/motion-for-summary-judgment.pdf

echo "rendered $(ls -1 pleadings/*.typ | grep -cv 'pleading-paper.typ') pleading(s) to public/documents/"
