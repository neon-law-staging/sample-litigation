// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-or-later

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
// vitest/config re-exports defineConfig with the `test` block typed.
import { defineConfig, type Plugin } from 'vitest/config'

/**
 * Where Navigator mounts this bundle, baked in at build time.
 *
 * `portal` is a literal segment of Navigator's route, not an application name
 * it looks up — see `portal/src/project_portal.rs` in the Navigator repository.
 * Vite joins every asset URL onto this base, so a bundle built with a different
 * one 404s on every asset the moment it is published. It is the single most
 * load-bearing line in this repository, which is why it is a named constant
 * with a comment rather than an inline string.
 *
 * The trailing slash is required: Navigator redirects the bare mount to the
 * slash form precisely because the base is joined directly onto it.
 */
const MOUNT = '/app/projects/sample-litigation/portal/'

/**
 * The license notice carried into the published bundle.
 *
 * Kept to the identifier and the source pointer rather than the full notice:
 * `LICENSE` in the repository is the terms, and a reader who has the SPDX tag
 * and a way to reach the source can get to them.
 */
const LICENSE_BANNER = `/*!
 * Cruller v. Prine — Client Portal.
 * Copyright (C) 2026 Neon Law Foundation.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Source: https://github.com/neon-law-staging/sample-litigation
 */`

/**
 * Prepend that notice to every emitted JavaScript chunk and stylesheet.
 *
 * `build.rollupOptions.output.banner` is the obvious place for this and does
 * nothing here: Vite 8 generates and minifies with Oxc, which drops the comment
 * on its way out. `generateBundle` sees the output after code generation, so a
 * notice added there is the notice that lands on disk.
 *
 * The stylesheet used to carry its own `/*!` legal comment in `src/index.css`
 * and rely on the CSS minifier keeping it. That stopped being true the day
 * navigator-ux's stylesheet was imported ahead of it: lightningcss keeps a
 * legal comment at the top of what it emits, and `index.css` was no longer at
 * the top. Nothing failed loudly — the notice simply left the build. Emitting
 * it here instead makes it independent of which stylesheet happens to be first.
 *
 * `index.html` needs no equivalent; it is not minified, so the comment written
 * into the template is the comment that ships.
 */
function licenseBanner(): Plugin {
  return {
    name: 'portal-license-banner',
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          file.code = `${LICENSE_BANNER}\n${file.code}`
          continue
        }

        // Assets are stylesheets, fonts, and the pdf.js worker. Only the
        // stylesheets are ours to annotate: the worker is Apache-2.0 pdf.js and
        // the fonts are OFL, and stamping this repository's notice onto either
        // would be a false claim rather than a formality.
        if (!file.fileName.endsWith('.css') || typeof file.source !== 'string') continue
        file.source = `${LICENSE_BANNER}\n${file.source}`
      }
    },
  }
}

export default defineConfig({
  base: MOUNT,
  plugins: [react(), tailwindcss(), licenseBanner()],
  resolve: {
    // `@/…` for `src/…`, which is the import style every shadcn component
    // ships with. Keeping it means a component pasted from the registry drops
    // in unedited.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Hashed asset names are what let Navigator serve every asset
    // `immutable` for a year while `index.html` stays `no-store`. Vite's
    // default output already does this; nothing here inlines a script,
    // because the portal serve CSP is `script-src 'self'`.
    sourcemap: false,
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Vitest's default answers every stylesheet import with an empty string,
    // including a `?raw` one. `license.test.ts` reads the emitted stylesheet to
    // check the notice survived minification, and cannot do that against ''.
    css: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
