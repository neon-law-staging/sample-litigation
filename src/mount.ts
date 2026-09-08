// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Links, derived from the mount rather than written out.
 *
 * Navigator serves this bundle from `/app/projects/sample-litigation/portal/`, and Vite
 * bakes that path in as `import.meta.env.BASE_URL` at build time (see the
 * `base` in `vite.config.ts`). Deriving every in-bundle link from it means the
 * same source builds correctly under a different mount, and — more to the
 * point — that no link in this app can quietly assume the mount and 404 when it
 * moves. A hardcoded `/sample-litigation/...` is the most common way one of these
 * bundles breaks in production, and it breaks silently, because the link only
 * fails when someone clicks it.
 *
 * Links to Navigator's *own* routes are a different thing and stay absolute:
 * `/app/projects` is Navigator's matter list, not a path inside this bundle.
 */

/** The mount, always with its trailing slash. */
export const MOUNT: string = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

/**
 * A path inside this bundle.
 *
 * `portalPath('')` is the portal's own root. A leading slash on the argument is
 * stripped rather than honored, because `portalPath('/documents')` reads like
 * it means "documents under the portal" and joining it naively would produce a
 * double slash — which some proxies collapse and some do not.
 */
export function portalPath(relative = ''): string {
  return `${MOUNT}${relative.replace(/^\/+/, '')}`
}
