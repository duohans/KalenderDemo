import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CheckCheck, Redo2, ShieldAlert, Undo2, Users2 } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import {
  getPlannerDragItem,
  getPlannerDropTarget,
  plannerCollisionDetection,
  resolveDrop,
  type PlannerDragItem,
} from '../../domain/schedule/dnd.ts'
import { selectPlannerSummary } from '../../domain/schedule/selectors.ts'
import type { PlannerAction } from '../../domain/schedule/types.ts'
import {
  actionToDropHandoff,
  PlannerDragFeedbackProvider,
  type PlannerMotionEvent,
  type RejectedDrag,
} from '../motion/PlannerDragFeedbackContext.tsx'
import { useDragFeedbackTimers } from '../motion/useDragFeedbackTimers.ts'
import {
  getPlannerDropAnimation,
} from '../motion/plannerMotion.ts'
import {
  useSchedule,
  useScheduleHistoryActions,
  useScheduleSelectionActions,
} from '../schedule/useSchedule.ts'
import { CalendarGrid } from '../calendar/CalendarGrid.tsx'
import { PeoplePanel } from '../people/PeoplePanel.tsx'
import { DragOverlayCard } from '../shared/DragOverlayCard.tsx'
import { TasksPanel } from '../tasks/TasksPanel.tsx'
import { PlannerDetailSheet } from './PlannerDetailSheet.tsx'

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName

  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

function describeMotionEvent(event: PlannerMotionEvent | null) {
  if (!event) {
    return ''
  }

  switch (event.type) {
    case 'assignSubstituteToNeedCard':
      return 'Direkte vikartildeling lagret.'
    case 'assignSubstituteToRow':
      return 'Radansvar oppdatert.'
    case 'clearNeedCardExplicitAssignee':
      return 'Direkte vikartildeling fjernet.'
    case 'clearRowResponsible':
      return 'Radansvar fjernet.'
    case 'moveNeedCardToCell':
      return `Kort flyttet til ${event.timeBlockId}.`
    case 'moveNeedCardToUnscheduled':
      return 'Kort sendt tilbake til Uplanlagt.'
    default:
      return ''
  }
}

function describeRejectedDrag(rejectedDrag: RejectedDrag | null) {
  if (!rejectedDrag) {
    return ''
  }

  return rejectedDrag.item.type === 'need-card'
    ? 'Kortet kan ikke slippes der.'
    : 'Vikaren kan ikke slippes der.'
}

export function PlannerPage() {
  const { state, dispatch } = useSchedule()
  const { closeSelection } = useScheduleSelectionActions()
  const { canRedo, canUndo, redo, undo } = useScheduleHistoryActions()
  const [activeDrag, setActiveDrag] = useState<PlannerDragItem | null>(null)
  const [dragVector, setDragVector] = useState({ x: 0, y: 0 })
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)
  const [dropAnimationKind, setDropAnimationKind] = useState<'valid' | 'invalid'>('valid')
  const [manualAnnouncement, setManualAnnouncement] = useState('')
  const reduceMotion = useReducedMotion() ?? false
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )
  const {
    clearDropHandoff,
    dropHandoff,
    pushDropHandoff,
    pushMotionEvent,
    pushRejectedDrag,
    recentEvent,
    rejectedDrag,
  } = useDragFeedbackTimers({ reduceMotion })
  const shortcutModifier =
    typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'
  const plannerSummary = selectPlannerSummary(state)
  const coveragePercent = Math.round(plannerSummary.coverageRate * 100)
  const dayLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('nb-NO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())

    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const metaOrCtrl = event.metaKey || event.ctrlKey

      if (!metaOrCtrl || event.key.toLowerCase() !== 'z') {
        return
      }

      event.preventDefault()

      if (event.shiftKey) {
        if (!canRedo) {
          return
        }

        redo()
        setManualAnnouncement('Gjorde om siste endring.')
        return
      }

      if (!canUndo) {
        return
      }

      undo()
      setManualAnnouncement('Angret siste endring.')
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canRedo, canUndo, redo, undo])

  const handleAction = (action: PlannerAction) => {
    pushMotionEvent(action)
    dispatch(action)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const initialRect = event.active.rect.current.initial

    closeSelection()
    setActiveDrag(getPlannerDragItem(event.active))
    setDragVector({ x: 0, y: 0 })
    setOverlaySize(
      initialRect ? { width: initialRect.width, height: initialRect.height } : null,
    )
    setDropAnimationKind('valid')
    clearDropHandoff()
  }

  const handleDragMove = (event: DragMoveEvent) => {
    setDragVector(event.delta)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const dragItem = getPlannerDragItem(event.active)
    const action = resolveDrop(
      state,
      dragItem,
      getPlannerDropTarget(event.over),
    )

    if (action) {
      setDropAnimationKind('valid')
      const dropHandoffEvent = actionToDropHandoff(action)

      if (dropHandoffEvent) {
        pushDropHandoff(dropHandoffEvent)
      }

      handleAction(action)
    } else if (dragItem) {
      setDropAnimationKind('invalid')
      clearDropHandoff()
      pushRejectedDrag(dragItem)
    }

    setActiveDrag(null)
    setDragVector({ x: 0, y: 0 })
  }

  const overlayCard =
    activeDrag?.type === 'need-card' ? state.needCards[activeDrag.cardId] : undefined
  const overlaySubstitute =
    activeDrag?.type === 'substitute'
      ? state.substitutes[activeDrag.substituteId]
      : undefined
  const announcement =
    describeMotionEvent(recentEvent) || describeRejectedDrag(rejectedDrag) || manualAnnouncement

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={plannerCollisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        if (activeDrag) {
          setDropAnimationKind('invalid')
          clearDropHandoff()
          pushRejectedDrag(activeDrag)
        }

        setActiveDrag(null)
        setDragVector({ x: 0, y: 0 })
      }}
    >
      <PlannerDragFeedbackProvider
        value={{
          dragVector,
          dropHandoff,
          recentEvent,
          rejectedDrag,
          pushMotionEvent,
        }}
      >
        <main className="planner-shell min-h-screen px-2 py-1.5 md:px-3 md:py-2 xl:px-3 xl:py-2.5">
          <header className="planner-shell__hero">
            <div className="planner-shell__stats" aria-label="Planstatus">
              <span className="planner-chip">
                <ShieldAlert size={15} strokeWidth={2.1} aria-hidden="true" />
                {plannerSummary.unassignedCards} udekket
              </span>
              <span className="planner-chip">
                <CheckCheck size={15} strokeWidth={2.1} aria-hidden="true" />
                {coveragePercent}% dekning
              </span>
              <span className="planner-chip">
                <Users2 size={15} strokeWidth={2.1} aria-hidden="true" />
                {plannerSummary.substituteCount} vikarer
              </span>
            </div>
            <div className="planner-shell__actions">
              <button
                type="button"
                className="action-button action-button--secondary"
                disabled={!canUndo}
                onClick={() => {
                  undo()
                  setManualAnnouncement('Angret siste endring.')
                }}
              >
                <Undo2 size={16} strokeWidth={2.25} aria-hidden="true" />
                Angre
              </button>
              <button
                type="button"
                className="action-button action-button--secondary"
                disabled={!canRedo}
                onClick={() => {
                  redo()
                  setManualAnnouncement('Gjorde om siste endring.')
                }}
              >
                <Redo2 size={16} strokeWidth={2.25} aria-hidden="true" />
                Gjør om
              </button>
              <div className="planner-shortcut" aria-hidden="true">
                <kbd>{shortcutModifier}</kbd>
                <span>+</span>
                <kbd>Z</kbd>
              </div>
            </div>
          </header>

          <div className="planner-shell__grid">
            <TasksPanel activeDrag={activeDrag} />
            <CalendarGrid activeDrag={activeDrag} dayLabel={dayLabel} />
            <PeoplePanel activeDrag={activeDrag} />
          </div>

          <PlannerDetailSheet />
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </main>

        <DragOverlay
          adjustScale={false}
          zIndex={60}
          dropAnimation={getPlannerDropAnimation(dropAnimationKind, reduceMotion)}
        >
          {overlayCard ? (
            <DragOverlayCard
              card={overlayCard}
              dragVector={dragVector}
              size={overlaySize}
            />
          ) : null}
          {overlaySubstitute ? (
            <DragOverlayCard
              substitute={overlaySubstitute}
              dragVector={dragVector}
              size={overlaySize}
            />
          ) : null}
        </DragOverlay>
      </PlannerDragFeedbackProvider>
    </DndContext>
  )
}
