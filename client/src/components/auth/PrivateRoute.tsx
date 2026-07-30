import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface PrivateRouteProps {
  requiredTier?: 'b2c_esensial' | 'b2b_profesional'
}

export function PrivateRoute({ requiredTier }: PrivateRouteProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredTier && user.tier !== requiredTier && user.tier !== 'b2b_profesional') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
