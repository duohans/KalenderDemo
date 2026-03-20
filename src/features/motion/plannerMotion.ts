import {
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { TargetAndTransition, Transition } from 'framer-motion'

export type DragVector = {
  x: number
  y: number
}

type TargetActivationKind = 'row' | 'need-card' | 'cell'
type RejectKind = 'need-card' | 'substitute'
type ReceiveKind = 'row' | 'card' | 'badge'
type OverlayKind = 'need-card' | 'substitute'
export type PlannerDropAnimationKind = 'valid' | 'invalid'

type TargetActivationState = {
  ready: boolean
  active: boolean
  invalid?: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function overlayRotation(vector: DragVector, maxRotation: number) {
  return clamp(vector.x * 0.035 + vector.y * 0.012, -maxRotation, maxRotation)
}

export const plannerLayoutSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.78,
}

export const plannerHoverSpring: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 36,
  mass: 0.62,
}

export const plannerTargetSpring: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.66,
}

export const plannerReceiveSpring: Transition = {
  type: 'spring',
  stiffness: 560,
  damping: 31,
  mass: 0.62,
}

export const plannerPulseTransition: Transition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
  times: [0, 0.58, 1],
}

export const plannerRejectTransition: Transition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1],
  times: [0, 0.24, 0.56, 0.82, 1],
}

export function getOverlayDragAnimation(
  kind: OverlayKind,
  vector: DragVector,
  reduceMotion: boolean,
): TargetAndTransition {
  if (reduceMotion) {
    return {
      scale: kind === 'substitute' ? 1.03 : 1.015,
      x: 0,
      y: kind === 'substitute' ? -6 : -4,
      rotate: 0,
    }
  }

  return {
    scale: kind === 'substitute' ? 1.06 : 1.032,
    x: clamp(vector.x * 0.025, -7, 7),
    y: kind === 'substitute' ? -10 : -7,
    rotate: overlayRotation(vector, kind === 'substitute' ? 5.5 : 3.4),
  }
}

export function getTargetActivationAnimation(
  kind: TargetActivationKind,
  state: TargetActivationState,
  reduceMotion: boolean,
): TargetAndTransition {
  if (reduceMotion) {
    if (state.active) {
      return { scale: 1.01, x: 0, y: 0 }
    }

    return { scale: 1, x: 0, y: 0 }
  }

  if (state.invalid) {
    return {
      scale: 0.994,
      x: kind === 'cell' ? -1.5 : 0,
      y: 0,
    }
  }

  if (state.active) {
    return {
      scale: kind === 'row' ? 1.018 : kind === 'need-card' ? 1.024 : 1.02,
      x: kind === 'row' ? 1.6 : 0,
      y: kind === 'row' ? -2.5 : -1.5,
    }
  }

  if (state.ready) {
    return {
      scale: kind === 'row' ? 1.008 : 1.012,
      x: 0,
      y: -0.8,
    }
  }

  return {
    scale: 1,
    x: 0,
    y: 0,
  }
}

export function getReceiveAnimation(
  kind: ReceiveKind,
  isActive: boolean,
  reduceMotion: boolean,
): TargetAndTransition {
  if (!isActive) {
    return { scale: 1, x: 0, y: 0, opacity: 1, rotate: 0 }
  }

  if (reduceMotion) {
    return { scale: 1.01, x: 0, y: 0, opacity: 1, rotate: 0 }
  }

  if (kind === 'row') {
    return {
      scale: [1, 1.06, 1],
      x: [0, 1.5, 0],
      y: [0, -4, 0],
      opacity: [0.82, 1, 1],
      rotate: [0, -1.8, 0],
    }
  }

  if (kind === 'badge') {
    return {
      scale: [0.84, 1.12, 1],
      x: [8, 0, 0],
      y: [-4, 0, 0],
      opacity: [0.7, 1, 1],
      rotate: [-4, 0, 0],
    }
  }

  return {
    scale: [0.96, 1.03, 1],
    x: [0, 0, 0],
    y: [4, -2, 0],
    opacity: [0.8, 1, 1],
    rotate: [0.6, 0, 0],
  }
}

export function getRejectAnimation(
  kind: RejectKind,
  reduceMotion: boolean,
): TargetAndTransition {
  if (reduceMotion) {
    return {
      scale: [1, 0.995, 1],
      x: [0, -2, 0],
      y: 0,
      rotate: 0,
    }
  }

  return {
    scale: kind === 'substitute' ? [1, 1.02, 0.996, 1] : [1, 1.012, 0.996, 1],
    x: kind === 'substitute' ? [0, -8, 6, -2, 0] : [0, -6, 4, -2, 0],
    y: [0, -1, 0, 0, 0],
    rotate:
      kind === 'substitute' ? [0, -1.4, 0.8, -0.3, 0] : [0, -1, 0.6, -0.2, 0],
  }
}

export function getSourceGhostAnimation(
  isDragging: boolean,
  reduceMotion: boolean,
): TargetAndTransition {
  if (!isDragging) {
    return {
      opacity: 0,
      scale: 0.98,
    }
  }

  if (reduceMotion) {
    return {
      opacity: 1,
      scale: 1,
    }
  }

  return {
    opacity: 1,
    scale: 1,
  }
}

export function getPlannerDropAnimationDuration(
  kind: PlannerDropAnimationKind,
  reduceMotion: boolean,
) {
  if (kind === 'invalid') {
    return reduceMotion ? 160 : 210
  }

  return reduceMotion ? 200 : 340
}

export function getPlannerDropHandoffDuration(reduceMotion: boolean) {
  return getPlannerDropAnimationDuration('valid', reduceMotion)
}

export function getPlannerDropAnimation(
  kind: PlannerDropAnimationKind,
  reduceMotion: boolean,
): DropAnimation {
  const sideEffects = defaultDropAnimationSideEffects({
    className: {
      active: 'planner-drop-source-settling',
      dragOverlay: 'planner-drop-overlay-settling',
    },
  })

  if (kind === 'invalid') {
    return {
      duration: getPlannerDropAnimationDuration(kind, reduceMotion),
      easing: 'cubic-bezier(0.2, 0.92, 0.28, 1)',
      sideEffects,
    }
  }

  return {
    duration: getPlannerDropAnimationDuration(kind, reduceMotion),
    easing: 'cubic-bezier(0.18, 0.88, 0.24, 1)',
    sideEffects,
    keyframes({ transform }) {
      const finalTransform = CSS.Transform.toString(transform.final)
      const initialTransform = CSS.Transform.toString(transform.initial)

      return [
        {
          opacity: 1,
          offset: 0,
          transform: initialTransform,
        },
        {
          opacity: 1,
          offset: 1,
          transform: finalTransform,
        },
      ]
    },
  }
}
