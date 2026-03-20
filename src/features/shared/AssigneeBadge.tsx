import { ArrowDownLeft, Minus, Pin, X } from 'lucide-react'
import type { AssignmentMode, Substitute } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'

type AssigneeBadgeProps = {
  person: Substitute | null
  mode: AssignmentMode
  density?: 'compact' | 'detail'
  showName?: boolean
  showLabel?: boolean
  compactLabel?: string
  labelOverride?: string
  onClear?: () => void
  clearLabel?: string
}

const labelByMode: Record<AssignmentMode, string> = {
  explicit: 'Direkte',
  inherited: 'Via rad',
  unassigned: 'Uten vikar',
}

const iconByMode = {
  explicit: Pin,
  inherited: ArrowDownLeft,
  unassigned: Minus,
} as const

export function AssigneeBadge({
  person,
  mode,
  density = 'detail',
  showName = false,
  showLabel = false,
  compactLabel,
  labelOverride,
  onClear,
  clearLabel,
}: AssigneeBadgeProps) {
  const label = labelOverride ?? labelByMode[mode]
  const isCompact = density === 'compact'
  const ModeIcon = iconByMode[mode]
  const visibleLabel = isCompact && compactLabel ? compactLabel : label

  return (
    <div
      className={cx(
        'assignee-badge',
        `assignee-badge--${mode}`,
        isCompact ? 'assignee-badge--compact' : 'assignee-badge--detail',
        showName && 'assignee-badge--with-name',
      )}
      style={{ ['--badge-accent' as string]: person?.accentColor ?? '#d1d5db' }}
      aria-label={person ? `${label}: ${person.name}` : label}
    >
      <span className="assignee-badge__avatar-shell">
        <span
          className={cx(
            'assignee-badge__avatar',
            !person && 'assignee-badge__avatar--empty',
          )}
        >
          {person ? person.avatarInitials : <Minus size={13} strokeWidth={2.25} />}
        </span>
        <span aria-hidden="true" className="assignee-badge__state-mark">
          <ModeIcon size={12} strokeWidth={2.25} />
        </span>
        {isCompact && onClear ? (
          <button
            type="button"
            className="assignee-badge__compact-clear"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onClear()
            }}
            aria-label={clearLabel ?? 'Fjern direkte tildeling'}
          >
            <X size={12} strokeWidth={2.25} />
          </button>
        ) : null}
      </span>
      {!isCompact || showName || showLabel ? (
        <span className="min-w-0 leading-none">
          {!isCompact || showLabel ? (
            <span className="assignee-badge__label">{visibleLabel}</span>
          ) : null}
          {person && (!isCompact || showName) ? (
            <span className="assignee-badge__name" title={person.name}>
              {person.name}
            </span>
          ) : null}
        </span>
      ) : null}
      {!isCompact && onClear ? (
        <button
          type="button"
          className="badge-clear"
          onClick={onClear}
          aria-label={clearLabel ?? 'Fjern direkte tildeling'}
        >
          <X size={14} strokeWidth={2.25} aria-hidden="true" />
          Fjern
        </button>
      ) : null}
    </div>
  )
}
