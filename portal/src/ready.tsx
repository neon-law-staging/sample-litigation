// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Navigator's mount signal.
 *
 * The element carrying `#sample-litigation-portal-ready` is what Navigator's browser
 * walkthrough waits for, so it has to be rendered by React — a static marker in
 * `index.html` would report "ready" for a bundle that threw on mount.
 *
 * It lives in its own module because the portal now has more than one view and
 * each renders its own `CaseHead`. An `id` must be unique in a document, so the
 * rule is: exactly one view renders at a time, and every view spends this same
 * kicker. Two copies of the string in two files would eventually become two
 * different strings.
 */
export const READY_KICKER = <span id="sample-litigation-portal-ready">Client portal · live</span>
