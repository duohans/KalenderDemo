import { createRouter } from '@tanstack/react-router'

import { queryClient } from '@/app/query-client'
import { indexRoute } from '@/routes/index'
import { rootRoute } from '@/routes/root'

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
