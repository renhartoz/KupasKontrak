import { LayoutDashboard, FileEdit, ShieldAlert, CreditCard, Settings, LogOut, Upload } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Editor', path: '/editor', icon: FileEdit },
    { name: 'Scanner', path: '/scanner', icon: ShieldAlert },
    { name: 'Pricing', path: '/pricing', icon: CreditCard },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border bg-card/95 backdrop-blur shrink-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-instrument text-2xl rounded-sm">
            K
          </div>
          <span className="font-instrument text-2xl text-foreground tracking-tight">
            KupasKontrak
          </span>
        </Link>
      </div>

      <div className="px-4 mb-6">
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-10 gap-2">
          <Upload className="w-4 h-4" />
          Upload Contract
        </Button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = location.pathname.startsWith(link.path)
          const Icon = link.icon
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{user?.username || 'Pengguna'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
