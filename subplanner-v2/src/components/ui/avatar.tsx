import type { CSSProperties } from 'react'

import { cn } from '@/lib/cn'

const avatarSizes = {
  sm: 'h-8 w-8 text-[0.7rem]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

interface AvatarProps {
  initials: string
  label: string
  color?: string
  size?: keyof typeof avatarSizes
  className?: string
}

export function Avatar({
  initials,
  label,
  color,
  size = 'md',
  className,
}: AvatarProps) {
  const style = color ? ({ backgroundColor: color } satisfies CSSProperties) : undefined

  return (
    <div
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-white/70 bg-stone-200 font-semibold text-ink-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        avatarSizes[size],
        className,
      )}
      style={style}
    >
      {initials}
    </div>
  )
}
