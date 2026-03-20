import { useCallback, useEffect, useRef, useState } from 'react'

import type { PlannerDragItem } from '../../domain/schedule/dnd.ts'
import type {
  PlannerDropHandoff,
  PlannerDropHandoffBase,
  PlannerMotionEvent,
  PlannerMotionEventBase,
  RejectedDrag,
} from './PlannerDragFeedbackContext.tsx'
import { getPlannerDropHandoffDuration } from './plannerMotion.ts'

type UseDragFeedbackTimersOptions = {
  reduceMotion: boolean
}

export function useDragFeedbackTimers({ reduceMotion }: UseDragFeedbackTimersOptions) {
  const [dropHandoff, setDropHandoff] = useState<PlannerDropHandoff | null>(null)
  const [recentEvent, setRecentEvent] = useState<PlannerMotionEvent | null>(null)
  const [rejectedDrag, setRejectedDrag] = useState<RejectedDrag | null>(null)
  const feedbackSequenceRef = useRef(0)
  const dropHandoffTimerRef = useRef<number | null>(null)
  const recentEventTimerRef = useRef<number | null>(null)
  const rejectedDragTimerRef = useRef<number | null>(null)

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

  const clearDropHandoff = useCallback(() => {
    if (dropHandoffTimerRef.current !== null) {
      window.clearTimeout(dropHandoffTimerRef.current)
      dropHandoffTimerRef.current = null
    }

    setDropHandoff(null)
  }, [])

  const pushDropHandoff = useCallback(
    (event: PlannerDropHandoffBase) => {
      const key = ++feedbackSequenceRef.current

      if (dropHandoffTimerRef.current !== null) {
        window.clearTimeout(dropHandoffTimerRef.current)
      }

      setDropHandoff({ ...event, key })
      dropHandoffTimerRef.current = window.setTimeout(() => {
        setDropHandoff((current) => (current?.key === key ? null : current))
        dropHandoffTimerRef.current = null
      }, getPlannerDropHandoffDuration(reduceMotion))
    },
    [reduceMotion],
  )

  const pushMotionEvent = useCallback(
    (event: PlannerMotionEventBase) => {
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
    },
    [reduceMotion],
  )

  const pushRejectedDrag = useCallback(
    (item: PlannerDragItem) => {
      const key = ++feedbackSequenceRef.current

      if (rejectedDragTimerRef.current !== null) {
        window.clearTimeout(rejectedDragTimerRef.current)
      }

      setRejectedDrag({ item, key })
      rejectedDragTimerRef.current = window.setTimeout(() => {
        setRejectedDrag((current) => (current?.key === key ? null : current))
        rejectedDragTimerRef.current = null
      }, reduceMotion ? 120 : 360)
    },
    [reduceMotion],
  )

  return {
    clearDropHandoff,
    dropHandoff,
    pushDropHandoff,
    pushMotionEvent,
    pushRejectedDrag,
    recentEvent,
    rejectedDrag,
  }
}
