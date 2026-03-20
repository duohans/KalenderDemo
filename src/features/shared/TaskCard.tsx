import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion, useReducedMotion } from 'framer-motion'
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
import {
  usePlannerDispatch,
  usePlannerSelection,
  usePlannerSelectionActions,
  usePlannerState,
} from '../../store/plannerStore.ts'
import { cx } from '../../lib/cx.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  getReceiveAnimation,
  getRejectAnimation,
  getTargetActivationAnimation,
  plannerHoverSpring,
  plannerLayoutSpring,
  plannerPulseTransition,
  plannerRejectTransition,
} from '../motion/plannerMotion.ts'
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
  const state = usePlannerState((plannerState) => plannerState)
  const dispatch = usePlannerDispatch()
  const selection = usePlannerSelection()
  const { openSelection } = usePlannerSelectionActions()
  const reduceMotion = useReducedMotion() ?? false
  const { rejectedDrag, recentEvent, dropHandoff, pushMotionEvent } =
    usePlannerDragFeedback()
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

  const effectiveAssignee = displayModel?.effectiveAssignee ?? null
  const isNeedCardDragActive = activeDrag?.type === 'need-card'
  const isRejected =
    rejectedDrag?.item.type === 'need-card' && rejectedDrag.item.cardId === card.id
  const isRecentlyAssignedExplicit =
    recentEvent?.type === 'assignSubstituteToNeedCard' && recentEvent.cardId === card.id
  const isRecentlyInheritedAssignment =
    recentEvent?.type === 'assignSubstituteToRow' &&
    card.placement === 'scheduled' &&
    card.rowId === recentEvent.rowId &&
    assignmentMode === 'inherited'
  const isRecentlyClearedExplicit =
    recentEvent?.type === 'clearNeedCardExplicitAssignee' && recentEvent.cardId === card.id
  const isOverridePreview = canAcceptSubstitute && isOver
  const isDropHandoffTarget =
    dropHandoff?.cardId === card.id &&
    ((dropHandoff.type === 'moveNeedCardToCell' &&
      card.placement === 'scheduled' &&
      variant === 'grid') ||
      (dropHandoff.type === 'moveNeedCardToUnscheduled' &&
        card.placement === 'unscheduled' &&
        variant === 'panel'))

  const articleAnimation = isRejected
    ? getRejectAnimation('need-card', reduceMotion)
    : isRecentlyAssignedExplicit
      ? getReceiveAnimation('card', true, reduceMotion)
      : getTargetActivationAnimation(
          'need-card',
          {
            ready: canAcceptSubstitute,
            active: isOverridePreview,
          },
          reduceMotion,
        )

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
      className="need-card-host h-full min-h-0"
    >
      <motion.div
        aria-haspopup="dialog"
        layout
        initial={false}
        animate={articleAnimation}
        transition={
          isRejected
            ? plannerRejectTransition
            : isRecentlyAssignedExplicit
              ? plannerPulseTransition
              : plannerLayoutSpring
        }
        whileHover={isDragging || reduceMotion ? undefined : { scale: 1.014, y: -1 }}
        whileTap={isDragging || reduceMotion ? undefined : { scale: 0.994 }}
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
        className="h-full min-h-0"
        {...listeners}
        {...attributes}
      >
        <NeedCardVisual
          card={card}
          displayModel={displayModel}
          variant={variant}
          className={cx(
            isDragging && 'need-card--drag-source-hidden',
            isDropHandoffTarget && 'need-card--handoff-hidden',
            canAcceptSubstitute && 'drop-target-ready',
            canAcceptSubstitute && isOver && 'drop-target-valid',
            isSelected && 'selection-active',
          )}
          markerSlot={
            <motion.div
              className={cx(
                'need-card__markers',
                isOverridePreview && 'need-card__markers--preview',
              )}
              initial={false}
              animate={
                isNeedCardDragActive
                  ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
                  : isOverridePreview
                    ? {
                        opacity: 1,
                        scale: reduceMotion ? 1.02 : 1.08,
                        x: reduceMotion ? 0 : 1,
                        y: reduceMotion ? 0 : -1,
                        rotate: 0,
                      }
                    : isRecentlyAssignedExplicit ||
                        isRecentlyInheritedAssignment ||
                        isRecentlyClearedExplicit
                      ? getReceiveAnimation('badge', true, reduceMotion)
                      : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
              }
              transition={
                isNeedCardDragActive
                  ? { duration: 0.12, ease: 'easeOut' }
                  : isRecentlyAssignedExplicit ||
                      isRecentlyInheritedAssignment ||
                      isRecentlyClearedExplicit
                    ? plannerPulseTransition
                    : isOverridePreview
                      ? plannerHoverSpring
                      : plannerLayoutSpring
              }
            >
              <AssigneeBadge
                person={effectiveAssignee}
                mode={assignmentMode}
                density="compact"
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
            </motion.div>
          }
        />
      </motion.div>
    </div>
  )
}
