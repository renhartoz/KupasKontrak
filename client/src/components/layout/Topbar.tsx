import { Search, Bell, Settings, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

export function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/documents/')
      const docs = res.data.results ? res.data.results : res.data
      return docs.slice(0, 3)
    },
    refetchInterval: 5000
  })

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur h-16 shrink-0 flex items-center justify-between px-4 lg:px-8">
      {/* Mobile Logo */}
      <Link to="/" className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-instrument text-2xl rounded-sm">
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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-md relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4" align="end">
            <div className="p-4 border-b border-border">
              <h4 className="font-instrument text-lg text-primary">Notifikasi</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Belum ada aktivitas.</div>
              ) : (
                notifications.map((doc: any) => (
                  <div 
                    key={doc.id} 
                    className="p-4 border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => {
                      if (doc.status === 'done') navigate(`/results/${doc.id}`)
                      else if (doc.status === 'failed') navigate('/dashboard')
                      else navigate(`/editor/${doc.id}`)
                    }}
                  >
                    <p className="text-sm font-bold font-inter line-clamp-1">{doc.original_filename}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-space">
                      Status: {doc.status === 'done' ? 'Selesai' : (doc.status === 'failed' ? 'Gagal' : 'Memproses')}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-border bg-muted/20">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate('/dashboard')}>
                Lihat Semua Dokumen
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
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
