import { createRoute } from '@tanstack/react-router'

import { PlannerScreen } from '@/features/planner/components/planner-screen'
import { rootRoute } from '@/routes/root'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: PlannerScreen,
})
