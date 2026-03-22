import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, type KeyboardEvent } from 'react'

import {
  canDropOnTarget,
  createNeedCardDragItem,
  type PlannerDragItem,
} from '../../domain/schedule/dnd.ts'
import {
  selectNeedCardDisplayModel,
} from '../../domain/schedule/selectors.ts'
import type { NeedCard } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  useScheduleDispatch,
  useScheduleSelection,
  useScheduleSelectionActions,
  useScheduleState,
} from '../schedule/useSchedule.ts'
import { AssigneeBadge } from './AssigneeBadge.tsx'
import { NeedCardVisual } from './NeedCardVisual.tsx'

type TaskCardProps = {
  card: NeedCard
  activeDrag: PlannerDragItem | null
  variant?: 'grid' | 'panel' | 'overlay' | 'detail'
}

export function TaskCard({
  card,
  activeDrag,
  variant = 'grid',
}: TaskCardProps) {
  const state = useScheduleState((plannerState) => plannerState)
  const dispatch = useScheduleDispatch()
  const selection = useScheduleSelection()
  const { openSelection } = useScheduleSelectionActions()
  const { pushMotionEvent } = usePlannerDragFeedback()
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const suppressClickRef = useRef(false)
  const cleanupPointerListenersRef = useRef<(() => void) | null>(null)

  const displayModel = selectNeedCardDisplayModel(state, card.id)
  const isSelected = selection?.kind === 'need-card' && selection.cardId === card.id
  const assignmentMode = displayModel?.assignmentMode ?? 'unassigned'

  useEffect(() => {
    return () => {
      cleanupPointerListenersRef.current?.()
    }
  }, [])

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } =
    useDraggable({
      id: `need-card:${card.id}`,
      data: createNeedCardDragItem(card),
    })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `need-card:${card.id}`,
    data: {
      type: 'need-card',
      cardId: card.id,
    },
  })

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDraggableRef(node)
    setDroppableRef(node)
  }

  const canAcceptSubstitute =
    activeDrag?.type === 'substitute' &&
    canDropOnTarget(state, activeDrag, {
      type: 'need-card',
      cardId: card.id,
    })

  const isOverridePreview = canAcceptSubstitute && isOver

  const markDragGesture = (clientX: number, clientY: number) => {
    if (!pointerStartRef.current) {
      return
    }

    const deltaX = Math.abs(clientX - pointerStartRef.current.x)
    const deltaY = Math.abs(clientY - pointerStartRef.current.y)

    if (deltaX > 4 || deltaY > 4) {
      suppressClickRef.current = true
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        touchAction: 'none',
      }}
      className={cx('need-card-host min-h-0', variant === 'grid' && 'need-card-host--grid')}
    >
      <div
        aria-haspopup="dialog"
        onPointerDown={(event) => {
          suppressClickRef.current = false
          pointerStartRef.current = { x: event.clientX, y: event.clientY }

          cleanupPointerListenersRef.current?.()

          const handlePointerMove = (moveEvent: PointerEvent) => {
            markDragGesture(moveEvent.clientX, moveEvent.clientY)
          }

          const handlePointerEnd = () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerEnd)
            window.removeEventListener('pointercancel', handlePointerEnd)
            cleanupPointerListenersRef.current = null
            pointerStartRef.current = null
          }

          cleanupPointerListenersRef.current = () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerEnd)
            window.removeEventListener('pointercancel', handlePointerEnd)
          }

          window.addEventListener('pointermove', handlePointerMove)
          window.addEventListener('pointerup', handlePointerEnd)
          window.addEventListener('pointercancel', handlePointerEnd)
        }}
        onPointerMove={(event) => {
          markDragGesture(event.clientX, event.clientY)
        }}
        onClick={(event) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            event.preventDefault()
            event.stopPropagation()
            return
          }

          openSelection({ kind: 'need-card', cardId: card.id })
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return
          }

          event.preventDefault()
          openSelection({ kind: 'need-card', cardId: card.id })
        }}
        aria-label={`Kort ${card.title}`}
        className={cx('min-h-0', variant === 'grid' && 'need-card-frame--grid')}
        {...listeners}
        {...attributes}
      >
        <NeedCardVisual
          card={card}
          displayModel={displayModel}
          variant={variant}
          className={cx(
            isDragging && 'need-card--drag-source-hidden',
            canAcceptSubstitute && 'drop-target-ready',
            canAcceptSubstitute && isOver && 'drop-target-valid',
            isSelected && 'selection-active',
          )}
          markerSlot={
            <div
              className={cx(
                'need-card__markers',
                isOverridePreview && 'need-card__markers--preview',
              )}
            >
              <AssigneeBadge
                person={displayModel?.statusAssignee ?? null}
                mode={assignmentMode}
                tone={displayModel?.statusTone}
                density="status"
                labelOverride={displayModel?.statusLabel}
                detailOverride={displayModel?.statusDetail}
                onClear={
                  assignmentMode === 'explicit'
                    ? () => {
                        pushMotionEvent({
                          type: 'clearNeedCardExplicitAssignee',
                          cardId: card.id,
                        })
                        dispatch({
                          type: 'clearNeedCardExplicitAssignee',
                          cardId: card.id,
                        })
                      }
                    : undefined
                }
                clearLabel="Fjern direkte tildeling"
              />
            </div>
          }
        />
      </div>
    </div>
  )
}
