import { ArrowDownLeft, Minus, Pin, TriangleAlert, X } from 'lucide-react'
import type { AssignmentMode, Substitute } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'

type AssigneeBadgeProps = {
  person: Substitute | null
  mode: AssignmentMode
  tone?: AssignmentMode | 'conflict'
  density?: 'compact' | 'detail' | 'status'
  showName?: boolean
  showLabel?: boolean
  compactLabel?: string
  labelOverride?: string
  detailOverride?: string
  onClear?: () => void
  clearLabel?: string
}

const labelByTone: Record<AssignmentMode | 'conflict', string> = {
  explicit: 'Direkte',
  inherited: 'Via rad',
  unassigned: 'Uten vikar',
  conflict: 'Konflikt',
}

const iconByMode = {
  explicit: Pin,
  inherited: ArrowDownLeft,
  unassigned: Minus,
  conflict: TriangleAlert,
} as const

export function AssigneeBadge({
  person,
  mode,
  tone,
  density = 'detail',
  showName = false,
  showLabel = false,
  compactLabel,
  labelOverride,
  detailOverride,
  onClear,
  clearLabel,
}: AssigneeBadgeProps) {
  const resolvedTone = tone ?? mode
  const label = labelOverride ?? labelByTone[resolvedTone]
  const detail =
    detailOverride ??
    person?.name ??
    (resolvedTone === 'conflict'
      ? 'Konflikt oppdaget'
      : resolvedTone === 'unassigned'
        ? 'Ingen vikar valgt'
        : '')
  const isCompact = density === 'compact'
  const isStatus = density === 'status'
  const ModeIcon = iconByMode[resolvedTone]
  const visibleLabel = isCompact && compactLabel ? compactLabel : label

  return (
    <div
      className={cx(
        'assignee-badge',
        `assignee-badge--${resolvedTone}`,
        isCompact
          ? 'assignee-badge--compact'
          : isStatus
            ? 'assignee-badge--status'
            : 'assignee-badge--detail',
        showName && !isStatus && 'assignee-badge--with-name',
      )}
      style={{ ['--badge-accent' as string]: person?.accentColor ?? '#d1d5db' }}
      aria-label={detail ? `${label}: ${detail}` : label}
    >
      <span className="assignee-badge__avatar-shell">
        <span
          className={cx(
            'assignee-badge__avatar',
            !person && 'assignee-badge__avatar--empty',
            isStatus && 'assignee-badge__avatar--status',
          )}
        >
          {person ? (
            person.avatarInitials
          ) : (
            <ModeIcon size={isStatus ? 15 : 13} strokeWidth={2.25} />
          )}
        </span>
        {!isStatus ? (
          <span aria-hidden="true" className="assignee-badge__state-mark">
            <ModeIcon size={12} strokeWidth={2.25} />
          </span>
        ) : null}
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
      {isStatus ? (
        <span className="assignee-badge__copy min-w-0">
          {showLabel ? <span className="assignee-badge__label">{label}</span> : null}
          {detail ? <span className="assignee-badge__detail">{detail}</span> : null}
        </span>
      ) : !isCompact || showName || showLabel ? (
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
      {isStatus && onClear ? (
        <button
          type="button"
          className="assignee-badge__status-clear"
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
          <X size={14} strokeWidth={2.25} />
        </button>
      ) : null}
      {!isStatus && !isCompact && onClear ? (
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
