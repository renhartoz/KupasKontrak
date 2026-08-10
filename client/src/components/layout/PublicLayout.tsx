import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Home, ShieldCheck, BookOpen, CreditCard } from 'lucide-react'

export function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Beranda', path: '/', icon: Home },
    { name: 'Keamanan', path: '/security', icon: ShieldCheck },
    { name: 'Dokumentasi', path: '/docs', icon: BookOpen },
    { name: 'Harga', path: '/solutions', icon: CreditCard },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background font-inter selection:bg-primary/20 selection:text-primary pb-16 md:pb-0">
      {/* Header */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border py-3 shadow-sm' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/KupasKontrak.png" 
              alt="KupasKontrak Logo" 
              className="w-8 h-8 object-contain transition-transform group-hover:scale-105" 
            />
            <span className="font-instrument text-2xl text-primary font-medium tracking-tight">KupasKontrak</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  (location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-space uppercase tracking-widest transition-all hover:shadow-md">
              Coba Gratis
            </Link>
          </div>

          {/* Mobile Login Button */}
          <Link to="/login" className="md:hidden bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md text-xs font-space uppercase tracking-widest transition-all">
            Masuk
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pt-[72px]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-12 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/KupasKontrak.png" alt="Logo" className="w-6 h-6 grayscale opacity-70" />
                <span className="font-instrument text-xl text-foreground opacity-80">KupasKontrak</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Melindungi pekerja informal dan freelancer dari eksploitasi hukum. AI Audit Kontrak berbasis prinsip perlindungan hak asasi dan UU Ketenagakerjaan.
              </p>
            </div>
            <div>
              <h4 className="font-instrument text-lg mb-4 text-foreground">Menu</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary transition-colors">Beranda</Link></li>
                <li><Link to="/security" className="hover:text-primary transition-colors">Keamanan</Link></li>
                <li><Link to="/docs" className="hover:text-primary transition-colors">Dokumentasi</Link></li>
                <li><Link to="/solutions" className="hover:text-primary transition-colors">Harga</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-instrument text-lg mb-4 text-foreground">Bantuan</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:aaron.hartono@binus.ac.id?subject=Perihal%20KupasKontrak" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Hubungi Kami</a></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">Daftar Akun</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} KupasKontrak. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur border-t border-border flex items-center justify-around z-50 px-2 pb-safe">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
          const Icon = link.icon
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20 text-primary' : ''}`} />
              <span className="text-[10px] font-medium font-inter">{link.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
