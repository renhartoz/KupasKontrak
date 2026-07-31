import { LayoutDashboard, FileEdit, ShieldAlert, CreditCard } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function BottomNav() {
  const location = useLocation()

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Editor', path: '/editor', icon: FileEdit },
    { name: 'Scanner', path: '/scanner', icon: ShieldAlert },
    { name: 'Pricing', path: '/pricing', icon: CreditCard },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around z-50 px-2 pb-safe">
      {navLinks.map((link) => {
        const isActive = location.pathname.startsWith(link.path)
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
  )
}
