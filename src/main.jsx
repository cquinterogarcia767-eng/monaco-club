import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { router }      from '@/router'
import { queryClient } from '@/lib/queryClient'
import AuthProvider    from '@/features/auth/AuthProvider'
import '@/styles/globals.css'

// Limpiar Service Workers viejos que causan cuelgues
// Forzar limpieza de Service Workers viejos
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      reg.unregister().then(() => {
        if (registrations.length > 0) {
          window.location.reload()
        }
      })
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1E1E1E',
              color: '#F5F5F5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
            }
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)