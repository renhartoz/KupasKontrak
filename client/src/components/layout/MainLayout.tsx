import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'

export function MainLayout() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-8 md:py-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
