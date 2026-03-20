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
import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import {
  getPlannerDragItem,
  getPlannerDropTarget,
  plannerCollisionDetection,
  resolveDrop,
  type PlannerDragItem,
} from '../../domain/schedule/dnd.ts'
import {
  actionToDropHandoff,
  actionToMotionEvent,
  type PlannerDropHandoffBase,
  type PlannerDropHandoff,
  PlannerDragFeedbackProvider,
  type PlannerMotionEventBase,
  type PlannerMotionEvent,
  type RejectedDrag,
} from '../motion/PlannerDragFeedbackContext.tsx'
import { useSchedule } from '../schedule/useSchedule.ts'
import { CalendarGrid } from '../calendar/CalendarGrid.tsx'
import type { PlannerSelection } from './plannerSelection.ts'
import {
  getPlannerDropAnimation,
  getPlannerDropHandoffDuration,
} from '../motion/plannerMotion.ts'
import { PeoplePanel } from '../people/PeoplePanel.tsx'
import { DragOverlayCard } from '../shared/DragOverlayCard.tsx'
import { TasksPanel } from '../tasks/TasksPanel.tsx'

export function PlannerPage() {
  const { state, dispatch } = useSchedule()
  const [activeDrag, setActiveDrag] = useState<PlannerDragItem | null>(null)
  const [selection, setSelection] = useState<PlannerSelection | null>(null)
  const [dragVector, setDragVector] = useState({ x: 0, y: 0 })
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)
  const [dropAnimationKind, setDropAnimationKind] = useState<'valid' | 'invalid'>('valid')
  const [dropHandoff, setDropHandoff] = useState<PlannerDropHandoff | null>(null)
  const [recentEvent, setRecentEvent] = useState<PlannerMotionEvent | null>(null)
  const [rejectedDrag, setRejectedDrag] = useState<RejectedDrag | null>(null)
  const feedbackSequenceRef = useRef(0)
  const dropHandoffTimerRef = useRef<number | null>(null)
  const recentEventTimerRef = useRef<number | null>(null)
  const rejectedDragTimerRef = useRef<number | null>(null)
  const reduceMotion = useReducedMotion() ?? false
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )

  useEffect(() => {
    return () => {
      if (dropHandoffTimerRef.current !== null) {
        window.clearTimeout(dropHandoffTimerRef.current)
      }

      if (recentEventTimerRef.current !== null) {
        window.clearTimeout(recentEventTimerRef.current)
      }

      if (rejectedDragTimerRef.current !== null) {
        window.clearTimeout(rejectedDragTimerRef.current)
      }
    }
  }, [])

  const clearDropHandoff = () => {
    if (dropHandoffTimerRef.current !== null) {
      window.clearTimeout(dropHandoffTimerRef.current)
      dropHandoffTimerRef.current = null
    }

    setDropHandoff(null)
  }

  const pushDropHandoff = (event: PlannerDropHandoffBase) => {
    const key = ++feedbackSequenceRef.current

    if (dropHandoffTimerRef.current !== null) {
      window.clearTimeout(dropHandoffTimerRef.current)
    }

    setDropHandoff({ ...event, key })
    dropHandoffTimerRef.current = window.setTimeout(() => {
      setDropHandoff((current) => (current?.key === key ? null : current))
      dropHandoffTimerRef.current = null
    }, getPlannerDropHandoffDuration(reduceMotion))
  }

  const pushMotionEvent = (event: PlannerMotionEventBase) => {
    const key = ++feedbackSequenceRef.current
    const nextEvent: PlannerMotionEvent = { ...event, key }

    if (recentEventTimerRef.current !== null) {
      window.clearTimeout(recentEventTimerRef.current)
    }

    setRecentEvent(nextEvent)
    recentEventTimerRef.current = window.setTimeout(() => {
      setRecentEvent((current) => (current?.key === key ? null : current))
      recentEventTimerRef.current = null
    }, reduceMotion ? 140 : 520)
  }

  const pushRejectedDrag = (item: PlannerDragItem) => {
    const key = ++feedbackSequenceRef.current

    if (rejectedDragTimerRef.current !== null) {
      window.clearTimeout(rejectedDragTimerRef.current)
    }

    setRejectedDrag({ item, key })
    rejectedDragTimerRef.current = window.setTimeout(() => {
      setRejectedDrag((current) => (current?.key === key ? null : current))
      rejectedDragTimerRef.current = null
    }, reduceMotion ? 120 : 360)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const initialRect = event.active.rect.current.initial

    setSelection(null)
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

      dispatch(action)
      const motionEvent = actionToMotionEvent(action)

      if (motionEvent) {
        pushMotionEvent(motionEvent)
      }
    } else if (dragItem) {
      setDropAnimationKind('invalid')
      clearDropHandoff()
      pushRejectedDrag(dragItem)
    }

    setActiveDrag(null)
    setDragVector({ x: 0, y: 0 })
  }

  const handleClearRowResponsible = (rowId: string) => {
    pushMotionEvent({ type: 'clearRowResponsible', rowId })
    dispatch({ type: 'clearRowResponsible', rowId })
  }

  const overlayCard =
    activeDrag?.type === 'need-card' ? state.needCards[activeDrag.cardId] : undefined
  const overlaySubstitute =
    activeDrag?.type === 'substitute'
      ? state.substitutes[activeDrag.substituteId]
      : undefined

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
        <main className="planner-shell min-h-screen px-2 py-2.5 md:px-3 md:py-3.5 xl:px-3 xl:py-4">
          <div className="mx-auto grid w-full max-w-[126rem] gap-2.5 xl:grid-cols-[15.5rem_minmax(0,1fr)_15.5rem]">
            <TasksPanel
              activeDrag={activeDrag}
              selection={selection}
              onOpenSelection={setSelection}
            />
            <CalendarGrid
              activeDrag={activeDrag}
              selection={selection}
              onClearRowResponsible={handleClearRowResponsible}
              onOpenSelection={setSelection}
              onCloseSelection={() => setSelection(null)}
            />
            <PeoplePanel activeDrag={activeDrag} />
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
