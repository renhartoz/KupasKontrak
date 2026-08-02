import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'


interface PrivateRouteProps {
  requiredTier?: 'b2c_esensial' | 'b2b_profesional'
}

export function PrivateRoute({ requiredTier }: PrivateRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        {/* Skeleton Sidebar (Hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border bg-card p-6 gap-6 shrink-0">
          <div className="w-40 h-8 bg-muted rounded-md animate-pulse"></div>
          <div className="w-full h-10 bg-muted rounded-md animate-pulse mt-2"></div>
          <div className="space-y-4 mt-4">
            <div className="w-32 h-5 bg-muted rounded animate-pulse"></div>
            <div className="w-3/4 h-5 bg-muted rounded animate-pulse"></div>
            <div className="w-5/6 h-5 bg-muted rounded animate-pulse"></div>
            <div className="w-3/4 h-5 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="mt-auto pt-4 border-t border-border space-y-4">
            <div className="w-24 h-5 bg-muted rounded animate-pulse"></div>
            <div className="w-full h-12 bg-muted rounded-md animate-pulse"></div>
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Skeleton Topbar */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8 shrink-0">
            <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse md:hidden"></div>
            <div className="hidden md:flex gap-4">
              <div className="w-20 h-6 bg-muted rounded animate-pulse"></div>
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
            </div>
          </header>
          
          {/* Skeleton Main Body */}
          <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            <div className="w-1/3 h-10 bg-muted rounded-md animate-pulse"></div>
            <div className="w-2/3 h-4 bg-muted rounded animate-pulse"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="h-48 md:col-span-2 bg-muted rounded-xl animate-pulse"></div>
              <div className="h-48 md:col-span-1 bg-muted rounded-xl animate-pulse"></div>
            </div>
            
            <div className="h-64 w-full bg-muted rounded-xl animate-pulse mt-6"></div>
          </main>

          {/* Skeleton BottomNav (Mobile only) */}
          <div className="md:hidden h-16 border-t border-border bg-card flex items-center justify-around px-4">
             <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
             <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
             <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
             <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredTier && user.tier !== requiredTier && user.tier !== 'b2b_profesional') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
