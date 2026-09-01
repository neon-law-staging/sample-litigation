/**
 * @license
 * navigator-sample-project — the reference project application for Navigator:
 * a client portal for the fixture matter Cruller v. Prine.
 *
 * Copyright (C) 2026 Shook Law PLLC.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// navigator-ux's stylesheet, which carries its tokens, its component rules, and
// the two Source Serif 4 woff2 files it vendors. It has to arrive first: the
// portal's theme aliases the library's `--nav-*` tokens rather than restating
// them, so this import is where those values come from, and its component rules
// are the ones `index.css` is entitled to override.
//
// Like `index.css`, it fetches nothing at runtime. The fonts are relative URLs
// inside the package, so Vite emits them as assets under the mount and they are
// served same-origin — which is what keeps the CSP with no off-origin sources.
import '@neon-law-foundation/navigator-ux/styles.css'

// The portal's own stylesheet, imported exactly once, at the entry. It carries
// the Tailwind build and the theme variables every component in
// `src/components/ui` reads, plus the text-layer rules `PdfViewer` depends on.
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

/*
 * The entry point.
 *
 * No theme provider: dark mode follows the operating system, through the media
 * query navigator-ux's own tokens are defined under, so there is no state to
 * hold and no flash of the wrong palette before hydration.
 *
 * No session provider either, deliberately. Navigator streams this bundle from
 * its own origin, and the session check and participation gate have already run
 * before the first byte arrives. This portal renders nothing that varies by who
 * is looking, so a session fetch would add a request and no behavior.
 */

const root = document.getElementById('root')
if (!root) throw new Error('portal: #root is missing from index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
