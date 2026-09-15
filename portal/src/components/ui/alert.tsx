// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/5 text-foreground [&>svg]:text-primary',
        info: 'border-primary/25 bg-primary/5 text-foreground [&>svg]:text-primary',
        warning: 'border-warning/40 bg-warning/10 text-foreground [&>svg]:text-warning',
        destructive:
          'border-destructive/30 bg-destructive/5 text-foreground [&>svg]:text-destructive',
        success: 'border-success/30 bg-success/5 text-foreground [&>svg]:text-success',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div role="note" className={cn(alertVariants({ variant }), className)} {...props} />
}

export function AlertTitle({ className, ...props }: ComponentProps<'h5'>) {
  return <h5 className={cn('mb-1 font-semibold leading-none', className)} {...props} />
}

export function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('[&_p]:leading-relaxed', className)} {...props} />
}
