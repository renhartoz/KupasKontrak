import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, CreditCard, Coins, Receipt, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

declare global {
  interface Window {
    snap: any
  }
}

export function Billing() {
  const { user } = useAuth()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [billingInfo, setBillingInfo] = useState<any>(null)
  const [isLoadingInfo, setIsLoadingInfo] = useState(true)

  const fetchBillingInfo = async () => {
    try {
      const res = await api.get('/billing/info/')
      setBillingInfo(res.data)
    } catch (error) {
      console.error('Failed to fetch billing info', error)
    } finally {
      setIsLoadingInfo(false)
    }
  }

  useEffect(() => {
    fetchBillingInfo()
  }, [])

  const handleTransaction = async (plan: string) => {
    try {
      setLoadingAction(plan)
      const res = await api.post('/billing/transaction/', { plan })
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
          setLoadingAction(null)
        },
        onError: function() {
          setLoadingAction(null)
        },
        onClose: function() {
          setLoadingAction(null)
        }
      })
    } catch (error) {
      setLoadingAction(null)
      alert("Gagal memproses transaksi. Coba lagi nanti.")
    }
  }

  if (isLoadingInfo) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const { quota, transactions } = billingInfo || {}

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-10 animate-fade-in px-4">
      <div className="text-left">
        <h1 className="text-3xl md:text-4xl font-instrument text-primary mb-2 tracking-tight">Billing & Kuota</h1>
        <p className="text-sm font-inter text-muted-foreground leading-relaxed">
          Kelola paket langganan Anda, pantau penggunaan kuota, dan beli token ekstra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quota Summary */}
        <Card className="p-6 border border-border shadow-sm rounded-xl bg-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-instrument font-semibold text-foreground">Paket Saat Ini</h3>
                <p className="text-xs font-inter text-muted-foreground uppercase tracking-widest">{user?.tier.replace('_', ' ')}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-inter mb-2">
                  <span className="text-muted-foreground">Dokumen Diunggah Bulan Ini</span>
                  <span className="font-semibold">{quota?.used_this_month || 0} / {quota?.monthly_limit || 0}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.min(100, ((quota?.used_this_month || 0) / (quota?.monthly_limit || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tokens Info */}
        <Card className="p-6 border border-border shadow-sm rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Coins className="w-24 h-24 text-amber-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-instrument font-semibold text-foreground mb-1">Sisa Token Ekstra</h3>
            <p className="text-xs font-inter text-muted-foreground mb-6">Token digunakan jika kuota bulanan habis.</p>
            
            <div className="text-5xl font-instrument text-amber-500 mb-6">
              {quota?.extra_tokens || 0} <span className="text-lg text-muted-foreground">Token</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-instrument text-foreground">Beli Token Kuota</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-border shadow-sm rounded-xl bg-card flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-instrument font-semibold text-foreground">1 Token (Dokumen Ekstra)</h3>
              <p className="text-sm font-inter text-muted-foreground">Berlaku selamanya. Otomatis dipakai jika kuota habis.</p>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className="text-2xl font-instrument text-foreground">Rp 10.000</span>
              <Button 
                onClick={() => handleTransaction('token_1')}
                disabled={loadingAction === 'token_1'}
                className="w-full md:w-auto font-space text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white"
              >
                {loadingAction === 'token_1' ? 'Memproses...' : 'Beli 1 Token'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 border border-amber-500/30 shadow-sm rounded-xl bg-amber-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white text-[10px] font-space font-bold uppercase tracking-widest py-1 px-4 rounded-full">
              Lebih Hemat
            </div>
            <div>
              <h3 className="text-lg font-instrument font-semibold text-foreground">5 Token (Paket Hemat)</h3>
              <p className="text-sm font-inter text-muted-foreground">Berlaku selamanya. Otomatis dipakai jika kuota habis.</p>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className="text-2xl font-instrument text-amber-600">Rp 40.000</span>
              <Button 
                onClick={() => handleTransaction('token_5')}
                disabled={loadingAction === 'token_5'}
                className="w-full md:w-auto font-space text-xs uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white"
              >
                {loadingAction === 'token_5' ? 'Memproses...' : 'Beli 5 Token'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-instrument text-foreground">Upgrade Langganan</h2>
        <Card className="p-8 border-2 border-primary shadow-md rounded-xl bg-primary/5 flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-instrument text-primary">B2B Profesional</h3>
            <p className="text-sm font-inter text-muted-foreground">Paket komprehensif untuk tim legal dan perusahaan berkembang.</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <li className="flex items-center gap-3 text-sm font-inter text-foreground">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>50 Dokumen / Bulan</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-inter text-foreground">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Ekspor ke DOCX & PDF</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-inter text-foreground">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Analisis Risiko AI Mendalam</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-inter text-foreground">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Prioritas Dukungan</span>
              </li>
            </ul>
          </div>
          <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-4 shrink-0 bg-card p-6 rounded-xl border border-border">
            <div className="text-center lg:text-right">
              <span className="text-4xl font-instrument text-foreground">Rp 99k</span>
              <span className="text-sm font-inter text-muted-foreground block">/bulan</span>
            </div>
            <Button 
              disabled={user?.tier === 'b2b_profesional' || loadingAction === 'profesional'}
              onClick={() => handleTransaction('profesional')}
              className={`w-full font-space text-xs uppercase tracking-widest h-11 px-8 ${user?.tier === 'b2b_profesional' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            >
              {user?.tier === 'b2b_profesional' ? 'Paket Saat Ini' : loadingAction === 'profesional' ? 'Memproses...' : 'Beralih ke Pro'}
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-instrument text-foreground flex items-center gap-2">
          <Receipt className="w-6 h-6" />
          Riwayat Transaksi
        </h2>
        <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-card">
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-space uppercase tracking-widest text-[10px]">ID Order</TableHead>
                    <TableHead className="font-space uppercase tracking-widest text-[10px]">Tanggal</TableHead>
                    <TableHead className="font-space uppercase tracking-widest text-[10px]">Paket/Item</TableHead>
                    <TableHead className="font-space uppercase tracking-widest text-[10px]">Nominal</TableHead>
                    <TableHead className="font-space uppercase tracking-widest text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((trx: any) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-mono text-xs">{trx.id}</TableCell>
                      <TableCell className="font-inter text-sm">
                        {new Date(trx.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="font-inter text-sm font-medium capitalize">
                        {trx.plan ? trx.plan.replace('_', ' ') : '-'}
                      </TableCell>
                      <TableCell className="font-inter text-sm">
                        Rp {parseInt(trx.amount).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-space uppercase tracking-widest px-2 py-1 rounded-md ${
                          trx.status === 'settlement' || trx.status === 'capture' ? 'bg-emerald-500/10 text-emerald-600' :
                          trx.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {trx.status === 'settlement' || trx.status === 'capture' ? 'Berhasil' : trx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground font-inter text-sm">
              Belum ada riwayat transaksi.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
