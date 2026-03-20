import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { LayoutGrid, UserCheck, UserPlus, X } from 'lucide-react'
import type { CSSProperties, KeyboardEvent } from 'react'

import { canDropOnTarget, type PlannerDragItem } from '../../domain/schedule/dnd.ts'
import { selectRowDisplayModel } from '../../domain/schedule/selectors.ts'
import { cx } from '../../lib/cx.ts'
import type { PlannerSelection } from '../layout/plannerSelection.ts'
import { usePlannerDragFeedback } from '../motion/PlannerDragFeedbackContext.tsx'
import {
  getTargetActivationAnimation,
  plannerLayoutSpring,
  plannerReceiveSpring,
  plannerTargetSpring,
} from '../motion/plannerMotion.ts'
import { useSchedule } from '../schedule/useSchedule.ts'

type RowHeaderDropZoneProps = {
  rowId: string
  activeDrag: PlannerDragItem | null
  isSelected: boolean
  onClearRowResponsible: (rowId: string) => void
  onOpenDetails: (selection: PlannerSelection) => void
}

export function RowHeaderDropZone({
  rowId,
  activeDrag,
  isSelected,
  onClearRowResponsible,
  onOpenDetails,
}: RowHeaderDropZoneProps) {
  const { state } = useSchedule()
  const reduceMotion = useReducedMotion() ?? false
  const { recentEvent } = usePlannerDragFeedback()

  const { isOver, setNodeRef } = useDroppable({
    id: `row-header:${rowId}`,
    data: {
      type: 'row-header',
      rowId,
    },
  })

  const displayModel = selectRowDisplayModel(state, rowId)

  if (!displayModel) {
    return null
  }

  const { responsible, teachers, title } = displayModel
  const visibleTeachers = teachers.slice(0, 2)
  const hiddenTeacherCount = Math.max(0, teachers.length - visibleTeachers.length)
  const canAcceptSubstitute =
    activeDrag?.type === 'substitute' &&
    canDropOnTarget(state, activeDrag, { type: 'row-header', rowId })
  const dropHintLabel = canAcceptSubstitute && isOver ? 'Slipp vikar her' : 'Tildel vikar'
  const DropHintIcon = canAcceptSubstitute && isOver ? UserCheck : UserPlus
  const isReceivingResponsible =
    recentEvent?.type === 'assignSubstituteToRow' && recentEvent.rowId === rowId
  const isClearingResponsible =
    recentEvent?.type === 'clearRowResponsible' && recentEvent.rowId === rowId

  const openDetails = () => {
    onOpenDetails({ kind: 'row', rowId })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    openDetails()
  }

  return (
    <motion.div
      layout
      ref={setNodeRef}
      animate={getTargetActivationAnimation(
        'row',
        {
          ready: canAcceptSubstitute,
          active: canAcceptSubstitute && isOver,
        },
        reduceMotion,
      )}
      transition={plannerTargetSpring}
      className={cx(
        'row-header-dropzone',
        responsible && 'row-header-dropzone--owned',
        canAcceptSubstitute && 'drop-target-ready',
        canAcceptSubstitute && isOver && 'drop-target-valid',
        isSelected && 'selection-active',
      )}
      style={{ ['--row-accent' as string]: displayModel.rowAccent } as CSSProperties}
      aria-label={`Tildel vikar til ${title.full}`}
    >
      {displayModel.canClearResponsible ? (
        <button
          type="button"
          className="row-header__corner-clear"
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onClearRowResponsible(rowId)
          }}
          aria-label="Fjern radansvarlig"
        >
          <X size={14} strokeWidth={2.25} aria-hidden="true" />
        </button>
      ) : null}
      <motion.div
        layout
        role="button"
        tabIndex={0}
        className="row-header-button"
        onClick={openDetails}
        onKeyDown={handleKeyDown}
        aria-haspopup="dialog"
        aria-expanded={isSelected}
        aria-label={`Åpne detaljer for ${title.full}`}
        transition={plannerLayoutSpring}
      >
        <div className="row-header__main">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={responsible?.id ?? 'empty'}
              layout
              initial={
                isReceivingResponsible
                  ? {
                      opacity: 0.78,
                      scale: reduceMotion ? 1.02 : 1.14,
                      x: reduceMotion ? 0 : 8,
                      y: reduceMotion ? 0 : -8,
                      rotate: reduceMotion ? 0 : -4,
                    }
                  : { opacity: 0, scale: 0.92 }
              }
              animate={
                canAcceptSubstitute && isOver
                  ? {
                      scale: reduceMotion ? 1.01 : 1.06,
                      x: reduceMotion ? 0 : 2,
                      y: reduceMotion ? 0 : -2,
                      rotate: 0,
                      opacity: 1,
                    }
                  : isClearingResponsible
                    ? { opacity: 0.7, scale: 0.92, y: 2 }
                    : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.88, y: 8, rotate: 4 }
              }
              transition={
                isReceivingResponsible || isClearingResponsible
                  ? plannerReceiveSpring
                  : plannerLayoutSpring
              }
              className="row-header__avatar-shell"
            >
              {responsible ? (
                <span className="row-header__avatar" title={responsible.name}>
                  {responsible.avatarInitials}
                </span>
              ) : (
                <span className="row-header__avatar row-header__avatar--ghost">
                  <UserPlus aria-hidden="true" size={16} strokeWidth={2.25} />
                </span>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="min-w-0 flex-1">
            <h3 className="row-header__title planner-heading" title={title.full}>
              {title.compact}
            </h3>
          </div>
        </div>

        <div className="row-header__footer">
          <div className="teacher-pill-list" aria-hidden="true">
            {visibleTeachers.map((teacher) => (
              <span
                key={teacher.id}
                className="teacher-pill"
                title={teacher.name}
              >
                <span
                  className="teacher-pill__avatar"
                  style={{ backgroundColor: teacher.accentColor }}
                >
                  {teacher.avatarInitials}
                </span>
                <span className="teacher-pill__label">{teacher.name.split(' ')[0]}</span>
              </span>
            ))}
            {hiddenTeacherCount > 0 ? (
              <span className="teacher-pill teacher-pill--more">+{hiddenTeacherCount}</span>
            ) : null}
            {teachers.length === 0 ? (
              <span className="teacher-pill teacher-pill--empty">
                <LayoutGrid aria-hidden="true" size={12} strokeWidth={2.25} />
              </span>
            ) : null}
          </div>

          <div className="row-header__actions">
            <motion.span
              className={cx(
                'row-drop-hint',
                responsible && 'row-drop-hint--owned',
                canAcceptSubstitute && 'row-drop-hint--ready',
                canAcceptSubstitute && isOver && 'row-drop-hint--active',
              )}
              title={dropHintLabel}
              aria-label={dropHintLabel}
              animate={
                canAcceptSubstitute && isOver
                  ? {
                      scale: reduceMotion ? 1.03 : 1.08,
                      x: 0,
                      y: reduceMotion ? 0 : -1,
                      rotate: 0,
                      opacity: 1,
                    }
                  : { scale: 1, x: 0, y: 0, rotate: 0, opacity: 1 }
              }
              transition={plannerTargetSpring}
            >
              <DropHintIcon aria-hidden="true" size={14} strokeWidth={2.25} />
            </motion.span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
