import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Keamanan', path: '/security' },
    { name: 'Dokumentasi', path: '/docs' },
    { name: 'Harga', path: '/solutions' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background font-inter selection:bg-primary/20 selection:text-primary">
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
                  location.pathname === link.path ? 'text-primary' : 'text-muted-foreground'
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

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-foreground p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-background border-b border-border shadow-lg py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`text-base font-medium py-2 px-4 rounded-md transition-colors ${
                  location.pathname === link.path ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="h-px bg-border my-2"></div>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="w-full text-center py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors">
                Masuk
              </Link>
              <Link to="/register" className="w-full text-center bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md text-sm font-space uppercase tracking-widest transition-colors">
                Coba Gratis
              </Link>
            </div>
          </div>
        )}
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
    </div>
  )
}
