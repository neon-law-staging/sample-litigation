// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function ToggleGroup({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn('inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1', className)}
      {...props}
    />
  )
}

export function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors',
        'hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm',
        '[&_svg]:size-3.5 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  )
}
