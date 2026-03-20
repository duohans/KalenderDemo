import { motion, useReducedMotion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'

import { selectNeedCardDisplayModel } from '../../domain/schedule/selectors.ts'
import type { NeedCard, Substitute } from '../../domain/schedule/types.ts'
import {
  getOverlayDragAnimation,
  getOverlayRestAnimation,
  plannerPickupSpring,
  plannerReceiveSpring,
  type DragVector,
} from '../motion/plannerMotion.ts'
import { useSchedule } from '../schedule/useSchedule.ts'
import { AssigneeBadge } from './AssigneeBadge.tsx'
import { NeedCardVisual } from './NeedCardVisual.tsx'

type DragOverlayCardProps =
  | {
      card: NeedCard
      dragVector: DragVector
      size?: { width: number; height: number } | null
      substitute?: never
    }
  | {
      substitute: Substitute
      dragVector: DragVector
      size?: { width: number; height: number } | null
      card?: never
    }

export function DragOverlayCard({ card, substitute, dragVector, size }: DragOverlayCardProps) {
  const reduceMotion = useReducedMotion() ?? false
  const { state } = useSchedule()
  const [isLifted, setIsLifted] = useState(() => reduceMotion)

  useEffect(() => {
    if (reduceMotion) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      setIsLifted(true)
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [reduceMotion])

  if (card) {
    const displayModel = selectNeedCardDisplayModel(state, card.id)

    return (
      <motion.div
        initial={getOverlayRestAnimation('need-card', reduceMotion)}
        animate={getOverlayDragAnimation('need-card', dragVector, reduceMotion)}
        transition={plannerPickupSpring}
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
          className={isLifted ? 'need-card--overlay-lifted' : undefined}
          markerSlot={
            <div className="need-card__markers">
              <AssigneeBadge
                person={displayModel?.effectiveAssignee ?? null}
                mode={displayModel?.assignmentMode ?? 'unassigned'}
                density="compact"
              />
            </div>
          }
        />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={getOverlayRestAnimation('substitute', reduceMotion)}
      animate={getOverlayDragAnimation('substitute', dragVector, reduceMotion)}
      transition={plannerReceiveSpring}
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
    </motion.div>
  )
}
