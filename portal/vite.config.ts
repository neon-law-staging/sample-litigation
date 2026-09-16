// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createReadStream, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
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

/** The Project root holds the licence the portal's source-level test reads. */
const PROJECT_ROOT = fileURLToPath(new URL('..', import.meta.url))

/**
 * The license notice carried into the published bundle.
 *
 * Kept to the identifier and the source pointer rather than the full notice:
 * `LICENSE` in the repository is the terms, and a reader who has the SPDX tag
 * and a way to reach the source can get to them.
 */
const LICENSE_BANNER = `/*!
 * Cruller v. Prine — Client Portal.
 * Copyright (C) 2026 Shook Law PLLC.
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

/** Where the render script writes, and the only place the gate allows a PDF. */
const DOCUMENTS = fileURLToPath(new URL('./dist/documents/', import.meta.url))

/**
 * The staging directory a document pointer addresses. `navigator site pull` fills
 * it from the committed pointers; its bytes are gitignored and never reach `dist/`,
 * so the dev server reads them here or not at all.
 */
const STAGING = fileURLToPath(new URL('../documents/', import.meta.url))

/** The first root holding `name`, or null — checked for containment, not trusted. */
function servedDocument(name: string): string | null {
  for (const root of [DOCUMENTS, STAGING]) {
    const file = normalize(join(root, name))
    if (!file.startsWith(root)) continue
    try {
      if (statSync(file).isFile()) return file
    } catch {
      continue
    }
  }
  return null
}

/**
 * Serve the rendered documents on the dev server.
 *
 * In a built bundle these are ordinary files under `dist/documents/`, reached
 * by the same mounted URL as every other asset. There is nothing for Vite's
 * static handler to serve in development, though: they are not in `public/`,
 * because the repository gate refuses a rendered PDF anywhere in this tree
 * except `dist/`. `pnpm dev` renders them through `predev` and this middleware
 * answers those URLs from the directory the build writes, so development and
 * the bundle read one render rather than two.
 *
 * Restricted to `.pdf`, and the joined path is checked to still be inside the
 * directory afterwards: a dev server that will serve `../../..` on request is a
 * dev server that will serve a contributor's home directory.
 */
function renderedDocuments(): Plugin {
  return {
    name: 'portal-rendered-documents',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(`${MOUNT}documents`, (request, response, next) => {
        const name = decodeURIComponent((request.url ?? '').split('?')[0] ?? '')
        if (!name.endsWith('.pdf')) return next()

        const file = servedDocument(name)
        if (file === null) return next()

        response.setHeader('Content-Type', 'application/pdf')
        createReadStream(file).pipe(response)
      })
    },
  }
}

export default defineConfig({
  base: MOUNT,
  plugins: [react(), tailwindcss(), licenseBanner(), renderedDocuments()],
  server: {
    fs: {
      allow: [PROJECT_ROOT],
    },
  },
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
