import { UserPlus } from 'lucide-react'
import type { CSSProperties } from 'react'

import { selectNeedCardDisplayModel } from '../../domain/schedule/selectors.ts'
import type { NeedCard, Substitute } from '../../domain/schedule/types.ts'
import { useScheduleState } from '../schedule/useSchedule.ts'
import { AssigneeBadge } from './AssigneeBadge.tsx'
import { NeedCardVisual } from './NeedCardVisual.tsx'

type DragOverlayCardProps =
  | {
      card: NeedCard
      size?: { width: number; height: number } | null
      substitute?: never
    }
  | {
      substitute: Substitute
      size?: { width: number; height: number } | null
      card?: never
    }

export function DragOverlayCard({ card, substitute, size }: DragOverlayCardProps) {
  const state = useScheduleState((plannerState) => plannerState)

  if (card) {
    const displayModel = selectNeedCardDisplayModel(state, card.id)

    return (
      <div
        className="drag-overlay-card drag-overlay-card--card"
        style={{
          width: size?.width,
          height: size?.height,
        }}
      >
        <NeedCardVisual
          card={card}
          displayModel={displayModel}
          variant="overlay"
          markerSlot={
            <div className="need-card__markers">
              <AssigneeBadge
                person={displayModel?.statusAssignee ?? null}
                mode={displayModel?.assignmentMode ?? 'unassigned'}
                tone={displayModel?.statusTone}
                density="status"
                labelOverride={displayModel?.statusLabel}
                detailOverride={displayModel?.statusDetail}
              />
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div
      className="drag-overlay-card drag-overlay-card--substitute"
      style={
        {
          width: size?.width,
          height: size?.height,
          ['--badge-accent' as string]: substitute.accentColor,
        } as CSSProperties
      }
    >
      <span className="substitute-card__avatar">{substitute.avatarInitials}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[1rem] leading-none">{substitute.name}</span>
      </span>
      <span className="drag-overlay-card__icon" aria-hidden="true">
        <UserPlus size={18} strokeWidth={2.25} />
      </span>
    </div>
  )
}
