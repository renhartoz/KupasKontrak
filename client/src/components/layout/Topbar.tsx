import { Search, Bell, Settings, LogOut, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export function Topbar() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur h-16 shrink-0 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile Logo */}
      <Link to="/" className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-playfair font-bold text-xl rounded-sm">
          K
        </div>
      </Link>

      {/* Desktop Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search documents..." 
            className="pl-9 h-9 bg-muted/30 border-border text-sm w-full focus-visible:ring-primary rounded-md"
          />
        </div>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-md">
          <Bell className="w-5 h-5" />
        </Button>
        
        {/* Mobile Profile Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </button>
      </div>

      {/* Mobile Top Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-border shadow-lg p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground truncate">{user?.username || 'Pengguna'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      )}
    </header>
  )
}
