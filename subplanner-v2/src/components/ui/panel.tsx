import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/cn'

interface PanelSurfaceProps extends ComponentPropsWithoutRef<'section'> {
  emphasis?: 'board' | 'tool'
}

export function PanelSurface({
  className,
  emphasis = 'tool',
  ...props
}: PanelSurfaceProps) {
  return (
    <section
      className={cn(emphasis === 'board' ? 'surface-board' : 'surface-panel', className)}
      {...props}
    />
  )
}
