import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/api'
import { useState } from 'react'

declare global {
  interface Window {
    snap: any
  }
}

export function Pricing() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    try {
      setLoading(true)
      const res = await api.post('/billing/transaction/', { plan: 'profesional' })
      const token = res.data.token
      
      window.snap.pay(token, {
        onSuccess: async function() {
          try {
            await api.post(`/billing/status/${res.data.order_id}/`)
            window.location.reload()
          } catch (e) {
            window.location.reload()
          }
        },
        onPending: function() {
          setLoading(false)
        },
        onError: function() {
          setLoading(false)
        },
        onClose: function() {
          setLoading(false)
        }
      })
    } catch (error) {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-12 animate-fade-in">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-instrument text-primary mb-4 tracking-tight">Kelola Paket Anda</h1>
        <p className="text-sm font-inter text-muted-foreground leading-relaxed">
          Pilih paket yang paling sesuai dengan kebutuhan perusahaan Anda. Transparan, tanpa biaya tersembunyi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* B2C Esensial Plan */}
        <Card className="p-8 border border-border shadow-sm rounded-xl bg-card flex flex-col">
          <h2 className="text-3xl font-instrument text-foreground mb-2">B2C Esensial</h2>
          <p className="text-sm font-inter text-muted-foreground mb-6">Cocok untuk individu dan bisnis kecil yang baru memulai.</p>
          <div className="mb-8">
            <span className="text-5xl font-instrument">Gratis</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>3 Pemindaian Kontrak / Bulan</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Analisis Risiko Standar</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Dukungan Email Dasar</span>
            </li>
          </ul>
          <Button 
            variant={user?.tier === 'b2c_esensial' ? 'secondary' : 'outline'} 
            disabled={user?.tier === 'b2c_esensial'}
            className="w-full font-space text-xs uppercase tracking-widest h-11"
          >
            {user?.tier === 'b2c_esensial' ? 'Paket Saat Ini' : 'Berlangganan Esensial'}
          </Button>
        </Card>

        {/* B2B Profesional Plan */}
        <Card className="p-8 border-2 border-primary shadow-md rounded-xl bg-primary/5 flex flex-col relative transform lg:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-space font-bold uppercase tracking-widest py-1 px-4 rounded-full">
            Paling Populer
          </div>
          <h2 className="text-3xl font-instrument text-primary mb-2">B2B Profesional</h2>
          <p className="text-sm font-inter text-muted-foreground mb-6">Paket komprehensif untuk tim legal dan perusahaan berkembang.</p>
          <div className="mb-8">
            <span className="text-5xl font-instrument">Rp 49k</span>
            <span className="text-sm font-inter text-muted-foreground">/bulan</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span className="font-medium">Pemindaian Kontrak Tak Terbatas</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Analisis Risiko Mendalam (AI Lanjutan)</span>
            </li>

            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Integrasi Editor Dokumen Premium</span>
            </li>
          </ul>
          <Button 
            disabled={user?.tier === 'b2b_profesional' || loading}
            onClick={handleUpgrade}
            className={`w-full font-space text-xs uppercase tracking-widest h-11 ${user?.tier === 'b2b_profesional' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            {user?.tier === 'b2b_profesional' ? 'Paket Saat Ini' : loading ? 'Memproses...' : 'Beralih ke Pro'}
          </Button>
        </Card>

        {/* Enterprise Plan */}
        <Card className="p-8 border border-border shadow-sm rounded-xl bg-card flex flex-col">
          <h2 className="text-3xl font-instrument text-foreground mb-2">Enterprise</h2>
          <p className="text-sm font-inter text-muted-foreground mb-6">Solusi kustom untuk korporasi dengan kebutuhan legal berskala besar.</p>
          <div className="mb-8">
            <span className="text-5xl font-instrument">Kustom</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Semua Fitur Pro</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>API Integrasi Khusus</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Dedicated Account Manager</span>
            </li>
            <li className="flex items-start gap-3 text-sm font-inter text-foreground">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span>Layanan Single Sign-On (SSO)</span>
            </li>
          </ul>
          <Button variant="outline" className="w-full font-space text-xs uppercase tracking-widest h-11">Hubungi Tim Sales</Button>
        </Card>
      </div>
    </div>
  )
}
