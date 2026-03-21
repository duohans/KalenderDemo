import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import type { RouterContext } from '@/app/router-context'

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundView,
})

function RootLayout() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  )
}

function NotFoundView() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white/90 px-8 py-10 text-center shadow-[0_18px_50px_-32px_rgba(75,56,34,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
          Route not found
        </p>
        <h1 className="mt-3 font-display text-3xl text-stone-900">Planner missing</h1>
        <p className="mt-2 max-w-sm text-sm text-stone-600">
          The requested view does not exist in this foundation build.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full border border-stone-300 bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-50 transition hover:bg-stone-800"
        >
          Return to board
        </Link>
      </div>
    </div>
  )
}
