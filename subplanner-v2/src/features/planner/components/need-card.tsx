import { X } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import type { PlannerCardViewModel } from '@/features/planner/selectors/planner-selectors'
import { cn } from '@/lib/cn'

interface NeedCardProps {
  cardView: PlannerCardViewModel
  onClearExplicitAssignee: (cardId: string) => void
}

const assignmentClasses = {
  explicit:
    'border-clay-300 bg-white shadow-[0_18px_34px_-24px_rgba(183,120,94,0.55)] ring-1 ring-clay-200/70',
  row: 'border-sage-300 bg-white shadow-[0_18px_34px_-24px_rgba(105,137,79,0.4)]',
  unassigned: 'border-dashed border-stone-300 bg-stone-50/92',
} as const

export function NeedCard({ cardView, onClearExplicitAssignee }: NeedCardProps) {
  const { card, assignmentMode, effectiveAssignee, explicitAssignee, sourceTeacher } = cardView

  return (
    <article
      data-testid={`need-card-${card.id}`}
      data-drop-role="card"
      className={cn(
        'relative flex h-full flex-col justify-between overflow-hidden rounded-[1.35rem] border px-3 py-3',
        assignmentClasses[assignmentMode],
      )}
      style={card.color ? { backgroundColor: `${card.color}33` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-ink-800">{card.title}</p>
          {cardView.showTeacherChip && sourceTeacher ? (
            <span className="mt-2 inline-flex max-w-full items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-600">
              {sourceTeacher.firstName}
            </span>
          ) : null}
        </div>

        {assignmentMode === 'explicit' && explicitAssignee ? (
          <button
            type="button"
            title="Fjern kortoverstyring"
            aria-label="Fjern kortoverstyring"
            onClick={() => onClearExplicitAssignee(card.id)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/85 text-stone-400 transition hover:text-stone-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          {effectiveAssignee ? (
            <Avatar
              initials={effectiveAssignee.initials}
              label={effectiveAssignee.name}
              color={effectiveAssignee.avatarColor}
              size="sm"
              className={assignmentMode === 'explicit' ? 'ring-2 ring-white' : undefined}
            />
          ) : (
            <div className="h-3 w-3 rounded-full bg-stone-300" />
          )}
          <p className="text-xs font-medium text-stone-500">
            {assignmentMode === 'explicit'
              ? 'Kort'
              : assignmentMode === 'row'
                ? 'Rad'
                : 'Udekket'}
          </p>
        </div>
      </div>
    </article>
  )
}
