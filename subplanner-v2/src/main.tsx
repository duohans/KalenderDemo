import { StrictMode } from 'react'

import { RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'

import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import '@/styles/index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
