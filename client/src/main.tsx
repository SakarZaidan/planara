import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardLayout from './components/layout/DashboardLayout'
import StudioOverviewPage from './pages/StudioOverviewPage'
import SynthesisStudioPage from './pages/SynthesisStudioPage'
import LibraryPage from './pages/LibraryPage'
import SettingsPage from './pages/SettingsPage'
import CatalogPage from './pages/CatalogPage'
import CanvasPage from './pages/CanvasPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/studio" element={<DashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<StudioOverviewPage />} />
            <Route path="synthesize" element={<SynthesisStudioPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="canvas" element={<CanvasPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
