import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Index from './pages/Index'
import AppDescription from './pages/AppDescription'
import AppBuilder from './pages/AppBuilder'
import MyApps from './pages/MyApps'
import Credits from './pages/Credits'
import NotFound from './pages/NotFound'
import Landing from './pages/Landing'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CreditsProvider } from './contexts/CreditsContext'

const queryClient = new QueryClient()

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <CreditsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename='/nexusai'>
            <Routes>
              <Route path='/' element={<Landing />} />
              <Route path='/start' element={<Index />} />
              <Route
                path='/describe'
                element={
                  <ProtectedRoute>
                    <AppDescription />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/build'
                element={
                  <ProtectedRoute>
                    <AppBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/my-apps'
                element={
                  <ProtectedRoute>
                    <MyApps />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/credits'
                element={
                  <ProtectedRoute>
                    <Credits />
                  </ProtectedRoute>
                }
              />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CreditsProvider>
    </QueryClientProvider>
  </HelmetProvider>
)

export default App
