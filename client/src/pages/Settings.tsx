import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export function Settings() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-playfair text-primary font-bold mb-2 tracking-tight">Pengaturan Profil</h1>
        <p className="text-sm font-inter text-muted-foreground">
          Kelola informasi akun dan preferensi berlangganan Anda.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-2 p-6 border-border shadow-sm rounded-xl">
          <h2 className="text-sm font-space text-muted-foreground font-bold uppercase tracking-widest mb-6">Informasi Akun</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-space text-muted-foreground uppercase tracking-widest font-semibold mb-1">Username</p>
                <p className="text-base font-inter font-bold text-foreground">{user?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-b border-border pb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-space text-muted-foreground uppercase tracking-widest font-semibold mb-1">Email</p>
                <p className="text-base font-inter font-bold text-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-space text-muted-foreground uppercase tracking-widest font-semibold mb-1">Terdaftar Sejak</p>
                <p className="text-base font-inter font-bold text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Berlangganan Aktif'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tier Card */}
        <Card className="md:col-span-1 p-6 border-border shadow-sm rounded-xl bg-primary/5 border-primary/20">
          <h2 className="text-sm font-space text-primary font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Paket Aktif
          </h2>
          
          <div className="text-center py-6">
            <p className="text-2xl font-playfair font-bold text-primary mb-2 capitalize">
              {user?.tier?.replace('_', ' ') || 'Esensial'}
            </p>
            <p className="text-sm font-inter text-muted-foreground">
              Paket Anda saat ini mengatur batasan pemindaian.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
