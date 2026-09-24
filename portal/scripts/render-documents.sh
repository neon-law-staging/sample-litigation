#!/usr/bin/env bash
#
# Copyright (C) 2026 Shook Law PLLC.
# SPDX-License-Identifier: Apache-2.0
#
# Render the five notation documents the portal serves.
#
#   pnpm render:documents
#
# This runs as `postbuild`, so `pnpm build` and `pnpm test` both produce them
# and nothing has to be committed. `scripts/toolchain.sh` fetches the Navigator
# CLI if it is not already on `PATH` at the version `navigator.yaml` pins.
#
# Where the templates come from
# -----------------------------
# Navigator's shared catalog, read at the pinned release tag — not from this
# repository. These five are jurisdiction-wide Neon Law notations, and a Project
# that carries a copy shadows the shared `code` and persists a matter-scoped
# version of it. The Project references them by code instead; `src/documents.ts`
# records which code each PDF came from.
#
# Where they are written
# ----------------------
# `dist/documents/`, which is the one place in this tree the repository gate
# permits a rendered PDF. `public/documents/` used to hold them and no longer
# exists: the gate follows the bytes, not the path, and refused them there.
# Because `vite build` empties `dist/`, this script runs after it rather than
# before.
#
# `navigator notation pdf` validates against the same notation rule set as
# `navigator validate` and refuses a template carrying any violation, so a PDF
# that appears is a template that passed.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=portal/scripts/toolchain.sh
. "$(dirname "$0")/toolchain.sh"

ensure_navigator
mkdir -p dist/documents

# The answers below are the fixture's dates. A real matter supplies these from
# questionnaire responses rather than from a shell script.
CLIENT="Dermot A. Cruller"
ADVERSE="Wendell Prine"
LAWYER="Lawrence Lawyer"
ISSUANCE="6 February 2026"
OFFER="1 April 2025"
COMPLETION="14 April 2026"
DISCOVERY="15 April 2026"
ENGAGED="20 April 2026"
NOTICE="2 May 2026"
ANSWERED="31 August 2026"
FORUM="JAMS, seated in Las Vegas, Nevada"
SCOPE="Representing the client in the arbitration of his claims against Wendell \
Prine arising from the doughnut offered over the hedge on 1 April 2025 — \
trespass to land, and rescission of the alleged instrument conveying the \
client's soul — and in the Eighth Judicial District Court action already on \
file to the extent any claim remains before that court."

navigator notation pdf "$(catalog_template summons_nevada)" \
  --out dist/documents/summons-wendell-prine.pdf \
  --answer person__client="$CLIENT" \
  --answer custom_datetime__issuance_date="$ISSUANCE"

navigator notation pdf "$(catalog_template rescission_notice_nevada)" \
  --out dist/documents/notice-of-rescission.pdf \
  --answer person__client="$CLIENT" \
  --answer custom_datetime__offer_date="$OFFER" \
  --answer custom_datetime__completion_date="$COMPLETION" \
  --answer custom_datetime__discovery_date="$DISCOVERY" \
  --answer custom_datetime__notice_date="$NOTICE"

navigator notation pdf "$(catalog_template engagement_letter_nevada)" \
  --out dist/documents/engagement-letter-dermot-cruller.pdf \
  --answer person__client="$CLIENT" \
  --answer person__adverse_party="$ADVERSE" \
  --answer person__lawyer_dri="$LAWYER" \
  --answer custom_datetime__engagement_start_date="$ENGAGED" \
  --answer custom_text__engagement_scope="$SCOPE" \
  --answer custom_single_choice__arbitration_forum="$FORUM" \
  --answer custom_single_choice__governing_law="Nevada"

navigator notation pdf "$(catalog_template witness_affidavit_nevada)" \
  --out dist/documents/affidavit-odile-cruller.pdf \
  --answer person__client="$CLIENT" \
  --answer custom_datetime__offer_date="$OFFER" \
  --answer custom_datetime__completion_date="$COMPLETION" \
  --answer custom_datetime__discovery_date="$DISCOVERY"

navigator notation pdf "$(catalog_template answer_to_counterclaim_nevada)" \
  --out dist/documents/answer-to-counterclaim-dermot-cruller.pdf \
  --answer person__client="$CLIENT" \
  --answer custom_datetime__answer_date="$ANSWERED"

echo "rendered $(ls -1 dist/documents/*.pdf | wc -l | tr -d ' ') document(s) to dist/documents/"
