/**
 * @license
 * sample-litigation — the reference project application for Navigator:
 * a client portal for the fixture matter Cruller v. Prine.
 *
 * Copyright (C) 2026 Shook Law PLLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * SPDX-License-Identifier: Apache-2.0
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
import '@neon-law-source-code/navigator-ux/styles.css'

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
