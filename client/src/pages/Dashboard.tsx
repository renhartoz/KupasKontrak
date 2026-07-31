import { FileText, ShieldAlert, Clock, ArrowRight, Upload, CheckCircle, ChevronRight, AlertTriangle, Award, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

interface Document {
  id: string
  original_filename: string
  status: string
  overall_risk_score: number
  source_type: string
  created_at: string
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents/')
      // The backend uses StandardPageNumberPagination. If it's paginated, it returns { results: [] }
      return res.data.results ? res.data.results : res.data
    }
  })

  // Calculations
  const totalDocuments = documents.length
  const highRisk = documents.filter(d => d.overall_risk_score >= 70).length
  const safeContracts = documents.filter(d => d.overall_risk_score > 0 && d.overall_risk_score <= 40).length
  
  const documentsWithScores = documents.filter(d => d.overall_risk_score > 0)
  const averageScore = documentsWithScores.length > 0 
    ? Math.round(documentsWithScores.reduce((acc, curr) => acc + curr.overall_risk_score, 0) / documentsWithScores.length)
    : 0

  const recentDocuments = documents.slice(0, 2)
  const queuedDocuments = documents.filter(d => d.status === 'uploaded' || d.status === 'processing').slice(0, 2)

  const isB2B = user?.tier === 'b2b_profesional'

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-playfair text-primary font-bold mb-3 tracking-tight">Selamat datang, {user?.username || 'Pengguna'}!</h1>
          <p className="text-sm font-inter text-muted-foreground max-w-lg">
            Berikut ringkasan aktivitas, status dokumen legal Anda, dan wawasan risiko secara keseluruhan.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" className="font-space text-xs tracking-widest uppercase h-10 px-5">
            Laporan
          </Button>
          <Button onClick={() => navigate('/scanner')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-space text-xs tracking-widest uppercase h-10 px-5 shadow-sm">
            Unggah Kontrak
          </Button>
        </div>
      </header> 

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-5 border border-border shadow-sm rounded-xl bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-space text-xs text-muted-foreground uppercase tracking-widest font-semibold">Total Dokumen</span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <span className="text-3xl font-playfair font-bold text-foreground">
            {isLoading ? '...' : totalDocuments}
          </span>
          <span className="text-xs font-inter text-muted-foreground">Portofolio aktif</span>
        </Card>
        <Card className="p-5 border border-border shadow-sm rounded-xl bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-space text-xs text-muted-foreground uppercase tracking-widest font-semibold">Risiko Tinggi</span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <span className="text-3xl font-playfair font-bold text-foreground">
            {isLoading ? '...' : highRisk}
          </span>
          <span className="text-xs font-inter text-destructive font-medium">Butuh perhatian</span>
        </Card>
        <Card className="p-5 border border-border shadow-sm rounded-xl bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-space text-xs text-muted-foreground uppercase tracking-widest font-semibold">Kontrak Aman</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-playfair font-bold text-foreground">
            {isLoading ? '...' : safeContracts}
          </span>
          <span className="text-xs font-inter text-emerald-600 font-medium">Telah diverifikasi</span>
        </Card>
        <Card className="p-5 border border-border shadow-sm rounded-xl bg-card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-space text-xs text-muted-foreground uppercase tracking-widest font-semibold">Skor Rata-rata</span>
            <Award className="w-4 h-4 text-secondary" />
          </div>
          <span className="text-3xl font-playfair font-bold text-foreground flex items-baseline gap-1">
            {isLoading ? '...' : averageScore}
            <span className="text-sm text-muted-foreground font-inter font-normal">/100</span>
          </span>
          <span className="text-xs font-inter text-muted-foreground">Keseluruhan portofolio</span>
        </Card>
      </div>

      {/* Main Action & Subscription */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Main Action Card */}
        <Card className="md:col-span-2 bg-primary/5 border-primary/20 shadow-sm p-5 md:p-6 rounded-xl overflow-hidden group">
          <div className="flex flex-col items-start h-full justify-center">
            <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center mb-3 rounded-md">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-playfair text-primary font-bold mb-2 tracking-tight">Mulai Analisis Baru</h2>
            <p className="text-sm font-inter text-muted-foreground leading-relaxed max-w-xl mb-5">
              Unggah kontrak atau dokumen legal baru untuk mendapatkan analisis risiko, rekomendasi perbaikan, dan ringkasan eksekutif instan dari AI.
            </p>
            <Button onClick={() => navigate('/scanner')} className="bg-primary hover:bg-primary/90 text-xs font-space uppercase tracking-widest px-8 h-12 rounded-md w-full sm:w-auto text-primary-foreground shadow-sm">
              UNGGAH DOKUMEN SEKARANG
            </Button>
          </div>
        </Card>

        {/* Subscription Status */}
        <Card className="md:col-span-1 border border-border shadow-sm p-4 md:p-5 relative overflow-hidden flex flex-col rounded-xl bg-card">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-space text-amber-500 uppercase font-bold tracking-widest">Premium</span>
          </div>
          <h2 className="text-sm font-inter font-medium text-foreground leading-relaxed mt-2">
            Anda menggunakan paket <span className="font-bold text-primary">{isB2B ? 'B2B Profesional' : 'B2C Esensial'}</span>. 
            {isB2B ? ' Nikmati pemindaian tak terbatas dan fitur analitik mendalam.' : ' Akses terbatas untuk pemindaian.'}
          </h2>
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg mt-4">
            <div className="flex justify-between items-center text-sm font-inter">
              <span className="text-muted-foreground">Sisa Kuota:</span>
              <span className="font-bold text-foreground">{isB2B ? 'Tak Terbatas' : '3 / Bulan'}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-inter">
              <span className="text-muted-foreground">Pengguna:</span>
              <span className="font-bold text-foreground">{isB2B ? '5 / 10 Seat' : '1 Seat'}</span>
            </div>
          </div>
          <div className="mt-auto pt-4">
            <Button onClick={() => navigate('/pricing')} variant="outline" className="w-full rounded-md font-space text-xs uppercase tracking-widest h-11 border-border shadow-sm hover:bg-muted">
              Kelola Paket
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent & Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        
        {/* Recent Contracts */}
        <div className="xl:col-span-2 space-y-5">
          <h3 className="text-2xl font-playfair text-foreground font-bold tracking-tight">Aktivitas Terkini</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {recentDocuments.map((doc) => (
              <Card key={doc.id} onClick={() => navigate(`/results/${doc.id}`)} className="p-5 border border-border shadow-sm hover:border-primary/30 transition-colors cursor-pointer group flex flex-col rounded-xl bg-card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-space text-muted-foreground uppercase tracking-widest font-semibold">
                    {new Date(doc.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                  </span>
                  <Badge variant={doc.overall_risk_score >= 70 ? 'destructive' : 'secondary'} className="font-space text-[10px] tracking-widest uppercase">
                    {doc.overall_risk_score >= 70 ? 'Risiko Tinggi' : doc.status}
                  </Badge>
                </div>
                <h4 className="text-base font-inter text-foreground font-bold mb-2 truncate group-hover:text-primary transition-colors">
                  {doc.original_filename}
                </h4>
                <p className="text-sm font-inter text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                  Status dokumen: {doc.status}. Silakan klik untuk melihat laporan detail.
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                  <span className="inline-flex items-center bg-muted text-foreground px-2 py-1 font-space text-[10px] font-bold tracking-widest rounded">SKOR: {doc.overall_risk_score || 0}/100</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}

            {!isLoading && recentDocuments.length === 0 && (
              <div className="col-span-full py-8 text-center bg-muted/30 border border-border rounded-xl">
                <p className="text-sm font-inter text-muted-foreground">Belum ada dokumen yang diunggah.</p>
              </div>
            )}

          </div>
        </div>

        {/* Queue */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-playfair text-foreground font-bold tracking-tight">Antrean Pemindaian</h3>
          </div>
          
          <div className="space-y-3">
            {queuedDocuments.map((doc, idx) => (
              <Card key={doc.id} className={`p-4 bg-card border border-border shadow-sm flex items-center gap-4 rounded-xl relative overflow-hidden group cursor-pointer hover:border-primary/30 transition-colors ${idx > 0 ? 'opacity-70 hover:opacity-100' : ''}`}>
                {idx === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                <div className={`w-10 h-10 ${idx === 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} flex items-center justify-center shrink-0 rounded-md`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-inter font-bold text-foreground truncate group-hover:text-primary transition-colors">{doc.original_filename}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {idx === 0 ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className={`text-[10px] font-space uppercase tracking-widest font-semibold ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {doc.status === 'uploaded' ? 'Menunggu' : 'Memproses...'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            {!isLoading && queuedDocuments.length === 0 && (
              <div className="py-8 text-center bg-muted/30 border border-border rounded-xl">
                <p className="text-sm font-inter text-muted-foreground">Tidak ada antrean.</p>
              </div>
            )}

            {queuedDocuments.length > 0 && (
              <Button variant="ghost" className="w-full h-12 text-primary hover:bg-muted font-space text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group mt-2 shadow-sm border border-transparent hover:border-border">
                Lihat Seluruh Antrean
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
