import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { MainLayout } from './components/layout/MainLayout'
import { PublicLayout } from './components/layout/PublicLayout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { ContractGallery } from './pages/ContractGallery'
import { ContractEditor } from './pages/ContractEditor'
import { RiskScanner } from './pages/RiskScanner'
import { RiskResults } from './pages/RiskResults'
import { Pricing } from './pages/Pricing'
import { Settings } from './pages/Settings'

// Public Pages
import { LandingHome } from './pages/public/LandingHome'
import { LandingSecurity } from './pages/public/LandingSecurity'
import { LandingDocs } from './pages/public/LandingDocs'
import { LandingPricing } from './pages/public/LandingPricing'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingHome />} />
              <Route path="/security" element={<LandingSecurity />} />
              <Route path="/docs" element={<LandingDocs />} />
              <Route path="/solutions" element={<LandingPricing />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/gallery" element={<ContractGallery />} />
                <Route path="/editor/:id" element={<ContractEditor />} />
                <Route path="/results/:id" element={<RiskResults />} />
                <Route path="/scanner" element={<RiskScanner />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
