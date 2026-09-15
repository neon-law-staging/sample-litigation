// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names, letting the last conflicting Tailwind utility win.
 *
 * `clsx` flattens the conditional forms; `twMerge` resolves the conflicts.
 * Without the second half, a `className="p-8"` passed into a component whose
 * base is `p-4` produces `p-4 p-8`, and which one applies is down to the order
 * the rules happen to land in the stylesheet rather than anything the caller
 * asked for.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
