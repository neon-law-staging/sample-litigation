#!/usr/bin/env bash
#
# Copyright (C) 2026 Shook Law PLLC.
# SPDX-License-Identifier: AGPL-3.0-or-later
#
# Render every notation template in this repository to the PDF the portal
# serves.
#
# The PDFs under `public/documents/` are build artefacts, but they are
# committed rather than produced during `vite build`: the bundle has to build on
# a machine that has never installed the Navigator CLI, and CI should not need a
# Rust toolchain to ship a React app. Re-run this whenever a template changes.
#
#   pnpm render:documents
#
# `navigator template render` validates against the same notation rule set as
# `navigator validate` and refuses a template carrying any violation, so a PDF
# that appears is a template that passed.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/documents

# The answers below are the fixture's dates. A real matter supplies these from
# questionnaire responses rather than from a shell script.
CLIENT="Dermot A. Cruller"
ADVERSE="Wendell Prine"
LAWYER="Lawrence Lawyer"
OFFER="1 April 2025"
COMPLETION="14 April 2026"
DISCOVERY="15 April 2026"
ENGAGED="20 April 2026"
NOTICE="2 May 2026"
FORUM="JAMS, seated in Las Vegas, Nevada"
SCOPE="Representing the client in the arbitration of his claims against Wendell \
Prine arising from the doughnut offered over the hedge on 1 April 2025 — \
trespass to land, and rescission of the alleged instrument conveying the \
client's soul — and in the Eighth Judicial District Court action already on \
file to the extent any claim remains before that court."

navigator template render templates/neon_law/nevada.md \
  --out public/documents/notice-of-rescission.pdf \
  --answer person__client="$CLIENT" \
  --answer custom_datetime__offer_date="$OFFER" \
  --answer custom_datetime__completion_date="$COMPLETION" \
  --answer custom_datetime__discovery_date="$DISCOVERY" \
  --answer custom_datetime__notice_date="$NOTICE"

navigator template render templates/neon_law/nevada_engagement_letter.md \
  --out public/documents/engagement-letter-dermot-cruller.pdf \
  --answer person__client="$CLIENT" \
  --answer person__adverse_party="$ADVERSE" \
  --answer person__lawyer_dri="$LAWYER" \
  --answer custom_datetime__engagement_start_date="$ENGAGED" \
  --answer custom_text__engagement_scope="$SCOPE" \
  --answer custom_single_choice__arbitration_forum="$FORUM" \
  --answer custom_single_choice__governing_law="Nevada"

navigator template render templates/neon_law/nevada_affidavit.md \
  --out public/documents/affidavit-odile-cruller.pdf \
  --answer person__client="$CLIENT" \
  --answer custom_datetime__offer_date="$OFFER" \
  --answer custom_datetime__completion_date="$COMPLETION" \
  --answer custom_datetime__discovery_date="$DISCOVERY"

echo "rendered $(ls -1 public/documents/*.pdf | wc -l | tr -d ' ') document(s) to public/documents/"
