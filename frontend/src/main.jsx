/**
 * main.jsx
 * 
 * Application entry point
 * - React Query provider
 * - Router provider
 * - Context providers
 * - Global styles
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@context/AuthContext'
import { StoreProvider } from '@context/StoreContext'
import { UIProvider } from '@context/UIContext'
import App from './App'
import '@styles/global.css'

// Create query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
    mutations: {
      retry: 0,
    },
  },
})

// Render application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <UIProvider>
          <AuthProvider>
            <StoreProvider>
              <App />
            </StoreProvider>
          </AuthProvider>
        </UIProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
