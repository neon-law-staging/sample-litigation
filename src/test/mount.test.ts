// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest'

import { MOUNT, portalPath } from '../mount'

describe('links derived from the mount', () => {
  it('keeps the trailing slash the base is joined onto', () => {
    expect(MOUNT.endsWith('/')).toBe(true)
  })

  it('resolves the portal root to the mount itself', () => {
    expect(portalPath()).toBe(MOUNT)
    expect(portalPath('')).toBe(MOUNT)
  })

  it('joins a bundle path onto the mount', () => {
    expect(portalPath('documents')).toBe(`${MOUNT}documents`)
  })

  it('does not produce a double slash from a leading one', () => {
    expect(portalPath('/documents')).toBe(`${MOUNT}documents`)
    expect(portalPath('//documents')).toBe(`${MOUNT}documents`)
  })
})
