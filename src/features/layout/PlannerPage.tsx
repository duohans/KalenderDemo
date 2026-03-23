import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CheckCheck, Redo2, ShieldAlert, Undo2, Users2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  getPlannerDragItem,
  getPlannerDropTarget,
  plannerCollisionDetection,
  resolveDrop,
  type PlannerDragItem,
} from '../../domain/schedule/dnd.ts'
import { WEEKDAYS } from '../../domain/schedule/constants.ts'
import { selectPlannerSummary } from '../../domain/schedule/selectors.ts'
import type { PlannerAction, WeekdayId } from '../../domain/schedule/types.ts'
import { cx } from '../../lib/cx.ts'
import {
  PlannerDragFeedbackProvider,
  type PlannerMotionEvent,
  type RejectedDrag,
} from '../motion/PlannerDragFeedbackContext.tsx'
import { useDragFeedbackTimers } from '../motion/useDragFeedbackTimers.ts'
import {
  useSchedule,
  useScheduleHistoryActions,
  useScheduleSelectionActions,
} from '../schedule/useSchedule.ts'
import { CalendarGrid } from '../calendar/CalendarGrid.tsx'
import { PeoplePanel } from '../people/PeoplePanel.tsx'
import { DragOverlayCard } from '../shared/DragOverlayCard.tsx'
import { TasksPanel } from '../tasks/TasksPanel.tsx'
import { WeekView } from '../week/WeekView.tsx'
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
    case 'createRow':
      return event.cardId ? 'Ny rad opprettet og kort plassert.' : 'Ny rad opprettet.'
    case 'removeRow':
      return 'Rad fjernet.'
    case 'updateNeedCardAllocatedTimeBlock':
      return `Opprinnelig tidspunkt oppdatert til ${event.timeBlockId}.`
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
  const { closeSelection, openSelection } = useScheduleSelectionActions()
  const { canRedo, canUndo, redo, undo } = useScheduleHistoryActions()
  const [activeDrag, setActiveDrag] = useState<PlannerDragItem | null>(null)
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null)
  const [manualAnnouncement, setManualAnnouncement] = useState('')
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [selectedDayId, setSelectedDayId] = useState<WeekdayId>('monday')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  )
  const {
    pushMotionEvent,
    pushRejectedDrag,
    recentEvent,
    rejectedDrag,
  } = useDragFeedbackTimers()
  const shortcutModifier =
    typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'
  const plannerSummary = selectPlannerSummary(state, viewMode === 'day' ? selectedDayId : undefined)
  const coveragePercent = Math.round(plannerSummary.coverageRate * 100)
  const dayLabel = useMemo(
    () => WEEKDAYS.find((day) => day.id === selectedDayId)?.label ?? 'Mandag',
    [selectedDayId],
  )

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

  const openDayView = (dayId: WeekdayId) => {
    closeSelection()
    setSelectedDayId(dayId)
    setViewMode('day')
  }

  const openNeedCardFromWeekView = (dayId: WeekdayId, cardId: string) => {
    setSelectedDayId(dayId)
    openSelection({ kind: 'need-card', cardId })
  }

  const openNeedCardInDayView = (cardId: string) => {
    const card = state.needCards[cardId]

    if (!card) {
      return
    }

    setSelectedDayId(card.dayId)
    setViewMode('day')
  }

  const handleDragStart = (event: DragStartEvent) => {
    const initialRect = event.active.rect.current.initial

    closeSelection()
    setActiveDrag(getPlannerDragItem(event.active))
    setOverlaySize(
      initialRect ? { width: initialRect.width, height: initialRect.height } : null,
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const dragItem = getPlannerDragItem(event.active)
    const action = resolveDrop(
      state,
      dragItem,
      getPlannerDropTarget(event.over),
    )

    if (action) {
      handleAction(action)
    } else if (dragItem) {
      pushRejectedDrag(dragItem)
    }

    setActiveDrag(null)
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
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        if (activeDrag) {
          pushRejectedDrag(activeDrag)
        }

        setActiveDrag(null)
      }}
    >
      <PlannerDragFeedbackProvider
        value={{
          pushMotionEvent,
        }}
      >
        <main className="planner-shell min-h-screen px-1 py-1 md:px-1.5 md:py-1.5 xl:px-2 xl:py-2">
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
              <div className="planner-view-toggle" role="tablist" aria-label="Visning">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'day'}
                  className={cx(
                    'planner-view-toggle__button',
                    viewMode === 'day' && 'planner-view-toggle__button--active',
                  )}
                  onClick={() => setViewMode('day')}
                >
                  Dag
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'week'}
                  className={cx(
                    'planner-view-toggle__button',
                    viewMode === 'week' && 'planner-view-toggle__button--active',
                  )}
                  onClick={() => {
                    closeSelection()
                    setViewMode('week')
                  }}
                >
                  Uke
                </button>
              </div>
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

          <div
            className={cx(
              'planner-shell__grid',
              viewMode === 'week' && 'planner-shell__grid--week',
            )}
          >
            {viewMode === 'day' ? (
              <>
                <TasksPanel activeDrag={activeDrag} selectedDayId={selectedDayId} />
                <CalendarGrid
                  activeDrag={activeDrag}
                  dayLabel={dayLabel}
                  selectedDayId={selectedDayId}
                />
                <PeoplePanel activeDrag={activeDrag} selectedDayId={selectedDayId} />
              </>
            ) : (
              <WeekView
                selectedDayId={selectedDayId}
                onOpenDay={(dayId) => openDayView(dayId)}
                onOpenCard={openNeedCardFromWeekView}
              />
            )}
          </div>

          <PlannerDetailSheet
            viewMode={viewMode}
            onOpenNeedCardInDayView={openNeedCardInDayView}
          />
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </main>

        <DragOverlay
          adjustScale={false}
          zIndex={60}
          dropAnimation={null}
        >
          {overlayCard ? (
            <DragOverlayCard
              card={overlayCard}
              size={overlaySize}
            />
          ) : null}
          {overlaySubstitute ? (
            <DragOverlayCard
              substitute={overlaySubstitute}
              size={overlaySize}
            />
          ) : null}
        </DragOverlay>
      </PlannerDragFeedbackProvider>
    </DndContext>
  )
}
