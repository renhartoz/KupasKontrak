import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { PrivateRoute } from './components/auth/PrivateRoute'
import { MainLayout } from './components/layout/MainLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ContractEditor } from './pages/ContractEditor'
import { RiskScanner } from './pages/RiskScanner'
import { RiskResults } from './pages/RiskResults'
import { Pricing } from './pages/Pricing'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/editor/:id" element={<ContractEditor />} />
                <Route path="/results/:id" element={<RiskResults />} />
                <Route path="/scanner" element={<RiskScanner />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/settings" element={<div className="p-8"><h1 className="text-headline-lg font-playfair">Settings</h1></div>} />
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
