import { AlertTriangle, Lightbulb, MapPin, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useState } from 'react'

export function RiskResults() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)

  const { data: document, isLoading: isLoadingDoc } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await api.get(`/documents/${id}/`)
      return res.data
    }
  })

  const { data: clauses = [], isLoading: isLoadingClauses } = useQuery({
    queryKey: ['clauses', id],
    queryFn: async () => {
      const res = await api.get(`/audits/documents/${id}/clauses/`)
      return res.data.results ? res.data.results : res.data
    },
    enabled: !!id
  })

  if (isLoadingDoc || isLoadingClauses) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    )
  }

  if (!document) return <div className="p-8 text-center">Dokumen tidak ditemukan.</div>

  const score = document.overall_risk_score || 0
  const isHighRisk = score >= 70
  const isMediumRisk = score >= 40 && score < 70

  const highRiskClauses = clauses.filter((c: any) => c.clause_safety_score >= 70)
  const mediumRiskClauses = clauses.filter((c: any) => c.clause_safety_score >= 40 && c.clause_safety_score < 70)
  
  const activeClause = selectedHighlight ? clauses.find((c: any) => c.id === selectedHighlight) : (highRiskClauses[0] || mediumRiskClauses[0] || clauses[0])

  const categoryStats = clauses.reduce((acc: Record<string, any>, clause: any) => {
    const cat = clause.category || 'default'
    if (!acc[cat]) {
      acc[cat] = { count: 0, highRiskCount: 0, mediumRiskCount: 0, sumScore: 0, maxScore: 0 }
    }
    acc[cat].count++
    acc[cat].sumScore += clause.clause_safety_score
    if (clause.clause_safety_score > acc[cat].maxScore) {
      acc[cat].maxScore = clause.clause_safety_score
    }
    if (clause.clause_safety_score >= 70) {
      acc[cat].highRiskCount++
    } else if (clause.clause_safety_score >= 40) {
      acc[cat].mediumRiskCount++
    }
    return acc
  }, {})

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference
  const strokeColor = isHighRisk ? 'text-destructive' : (isMediumRisk ? 'text-amber-500' : 'text-emerald-500')
  const bgColor = isHighRisk ? 'bg-destructive/10 text-destructive' : (isMediumRisk ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-instrument text-primary mb-2">Hasil Pemindaian</h1>
          <p className="text-sm font-inter text-muted-foreground max-w-xl">
            Analisis risiko detail untuk <span className="font-bold text-foreground">{document.original_filename}</span>.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="border-border text-foreground hover:bg-muted font-space text-xs tracking-widest uppercase rounded-md shadow-sm"
              >
                Ekspor Laporan
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 bg-card border border-border shadow-md rounded-md" align="end" sideOffset={10}>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={async () => {
                    try {
                      const res = await api.post(`/documents/${id}/export/`, { format: 'report_pdf' })
                      if (res.data?.download_url) {
                        window.open(res.data.download_url, '_blank')
                      }
                    } catch (e) {
                      alert('Gagal mengekspor laporan.')
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-inter hover:bg-muted rounded-sm transition-colors text-foreground"
                >
                  Laporan Analisis (PDF)
                </button>
                
                <button 
                  onClick={async () => {
                    try {
                      const res = await api.post(`/documents/${id}/export/`, { format: 'contract_docx' })
                      if (res.data?.download_url) {
                        window.open(res.data.download_url, '_blank')
                      }
                    } catch (e: any) {
                      if (e.response?.status === 403) {
                        alert('Fitur ini eksklusif untuk pelanggan PRO (B2B). Silakan upgrade paket Anda.')
                      } else {
                        alert(e.response?.data?.detail || 'Gagal mengekspor draf. Pastikan Anda sudah melakukan Auto-Fix terlebih dahulu.')
                      }
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-inter hover:bg-muted rounded-sm transition-colors flex items-center justify-between text-foreground"
                >
                  <span>Kontrak Diperbaiki (DOCX)</span>
                  <span className="text-[10px] font-space tracking-widest bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded uppercase font-bold">PRO</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => navigate(`/editor/${id}`)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-space text-xs tracking-widest uppercase rounded-md shadow-sm">
            Buka di Editor
          </Button>
        </div>
      </div>

      {/* Split Section: Overall Score & Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Overall Score */}
        <Card className="lg:col-span-4 bg-card border border-border shadow-sm p-8 flex flex-col items-center rounded-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          
          <p className="text-xs font-space text-muted-foreground uppercase tracking-widest font-bold mb-8 self-start">
            Skor Risiko Keseluruhan
          </p>
          
          <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} className="text-muted/30 stroke-current" strokeWidth="8" fill="transparent" />
              <circle cx="50" cy="50" r={radius} className={`${strokeColor} stroke-current transition-all duration-1000 ease-in-out`} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-instrument text-foreground tracking-tight">{Math.round(score)}</span>
              <span className="text-xs font-space text-muted-foreground tracking-widest mt-1">/ 100</span>
            </div>
          </div>

          <div className={`px-6 py-2 flex items-center gap-2 mb-6 rounded-md ${bgColor}`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[10px] font-space uppercase tracking-widest font-bold">
              {isHighRisk ? 'Risiko Tinggi' : (isMediumRisk ? 'Risiko Sedang' : 'Risiko Rendah')}
            </span>
          </div>

          <p className="text-sm font-inter text-muted-foreground text-center mb-8 leading-relaxed px-4">
            {document.score_breakdown?.fatal_clauses_count > 0 
              ? `Terdapat ${document.score_breakdown.fatal_clauses_count} klausul kritis yang melanggar hukum secara mutlak.`
              : 'Analisis AI telah selesai mengkategorikan dan menilai setiap klausul dalam dokumen ini.'}
          </p>

          <div className="w-full space-y-4 mt-auto border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-inter text-foreground">Klausul Kritis / Ilegal</span>
              <div className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold font-space">
                {document.score_breakdown?.fatal_clauses_count || 0}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-inter text-foreground">Klausul Risiko Sedang</span>
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold font-space">
                {mediumRiskClauses.length}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-inter text-foreground">Total Klausul Diekstrak</span>
              <div className="w-6 h-6 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-bold font-space">
                {clauses.length}
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Dynamic Highlights instead of PDF Viewer */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
          <h2 className="text-2xl font-instrument text-primary mb-6">Sekilas Temuan Utama</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full flex-1">
            {/* Clause Tabs */}
            <div className="md:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2">
              {highRiskClauses.length === 0 && mediumRiskClauses.length === 0 && (
                 <div className="text-sm text-muted-foreground p-4">Tidak ada klausul berisiko signifikan ditemukan.</div>
              )}
              {[...highRiskClauses, ...mediumRiskClauses].slice(0, 5).map((clause: any) => {
                const isActive = activeClause?.id === clause.id
                const isHigh = clause.clause_safety_score >= 70
                
                return (
                  <div 
                    key={clause.id}
                    onClick={() => setSelectedHighlight(clause.id)}
                    className={`bg-card border shadow-sm p-4 cursor-pointer relative rounded-r-lg transition-all ${
                      isActive 
                        ? `border-${isHigh ? 'destructive' : 'amber-500'} border-l-4` 
                        : `border-border border-l-4 border-l-transparent hover:border-l-primary/30 opacity-70 hover:opacity-100`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-space uppercase tracking-widest font-bold ${isHigh ? 'text-destructive' : 'text-amber-500'}`}>
                        Skor: {Math.round(clause.clause_safety_score)}/100
                      </span>
                      <span className="text-[10px] font-space uppercase tracking-widest font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {clause.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-inter text-foreground line-clamp-3 leading-relaxed">
                      {clause.clause_text}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Active Clause Detail */}
            <div className="md:col-span-7 h-full">
              {activeClause ? (
                <Card className="bg-card shadow-sm p-6 sm:p-8 border-border rounded-xl h-full flex flex-col overflow-y-auto">
                  <div className={`flex items-center gap-2 mb-6 ${activeClause.clause_safety_score >= 70 ? 'text-destructive' : 'text-amber-500'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-[10px] font-space uppercase tracking-widest font-bold">
                      {activeClause.is_fatal ? 'Ilegal (Melanggar Hukum)' : (activeClause.clause_safety_score >= 70 ? 'Risiko Tinggi' : 'Risiko Sedang')}
                    </span>
                  </div>
                  
                  <div className="mb-6 bg-muted/30 p-4 rounded-md border-l-2 border-primary">
                    <p className="text-sm font-inter leading-relaxed text-foreground italic">
                      "{activeClause.clause_text}"
                    </p>
                  </div>
                  
                  {activeClause.legal_reference && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <h4 className="text-[10px] font-space uppercase tracking-widest font-bold text-amber-600 mb-2 flex items-center gap-2">
                        Dasar Hukum / Referensi
                      </h4>
                      <p className="text-sm font-inter text-amber-700 leading-relaxed">
                        {activeClause.legal_reference}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-primary/5 p-6 rounded-lg mb-6 border border-primary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-md bg-primary/20 text-primary flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold font-inter text-foreground">Analisis AI</h4>
                    </div>
                    <p className="text-sm font-inter text-muted-foreground leading-relaxed ml-11">
                      {activeClause.plain_language_summary || 'AI mengindikasikan adanya ketidakseimbangan hak yang signifikan atau parameter finansial yang tidak transparan pada pasal ini.'}
                    </p>
                  </div>

                  <div className="bg-secondary/5 p-6 rounded-lg mb-6 border border-secondary/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-md bg-secondary/20 text-secondary flex items-center justify-center">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold font-inter text-foreground">Saran Tindakan</h4>
                    </div>
                    <p className="text-sm font-inter text-muted-foreground leading-relaxed ml-11 mb-4">
                      {activeClause.mcp_query_hint ? `Referensi hukum disarankan: ${activeClause.mcp_query_hint}` : 'Gunakan Editor untuk berdiskusi dengan AI dan meminta draf perbaikan yang lebih seimbang.'}
                    </p>
                    <div className="ml-11 mt-4">
                      <Button onClick={() => navigate(`/editor/${id}`)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-space text-[10px] uppercase tracking-widest rounded-md h-9">
                        Bawa ke Editor <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl">
                  <span className="text-sm font-inter text-muted-foreground">Pilih klausul di sebelah kiri</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Category Breakdown */}
      <div>
        <h2 className="text-2xl font-instrument text-primary mb-6 mt-12">Rincian Kategori Risiko</h2>
        <div className="bg-card shadow-sm overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted text-foreground font-space text-[10px] uppercase tracking-widest border-b border-border">
                  <th className="py-4 px-6 font-bold w-1/3">Kategori Klausul</th>
                  <th className="py-4 px-6 font-bold text-center">Jumlah Temuan</th>
                  <th className="py-4 px-6 font-bold text-center">Rata-rata Skor</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="font-inter text-sm text-foreground">
                {Object.keys(categoryStats).map((cat, idx) => {
                  const stat = categoryStats[cat]
                  const displayScore = Math.round(stat.maxScore)
                  const hasHighRisk = stat.highRiskCount > 0
                  const hasMediumRisk = stat.mediumRiskCount > 0
                  
                  return (
                    <tr key={cat} className={`border-b border-border hover:bg-muted/30 transition-colors ${idx === Object.keys(categoryStats).length - 1 ? 'border-b-0' : ''}`}>
                      <td className="py-5 px-6 font-bold flex items-center gap-3 capitalize">
                        <div className={`w-2 h-2 rounded-full ${hasHighRisk ? 'bg-destructive' : (hasMediumRisk ? 'bg-amber-500' : 'bg-primary')}`}></div>
                        {cat.replace(/_/g, ' ')}
                      </td>
                      <td className="py-5 px-6 text-center font-medium">
                        {stat.count}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className={`font-bold ${hasHighRisk ? 'text-destructive' : (hasMediumRisk ? 'text-amber-500' : 'text-foreground')}`}>
                          {displayScore}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                      </td>
                      <td className="py-5 px-6">
                        {hasHighRisk ? (
                          <span className="inline-block bg-destructive/10 text-destructive px-3 py-1 font-space text-[10px] font-bold tracking-widest uppercase rounded">
                            Berbahaya
                          </span>
                        ) : hasMediumRisk ? (
                          <span className="inline-block bg-amber-500/10 text-amber-500 px-3 py-1 font-space text-[10px] font-bold tracking-widest uppercase rounded">
                            Risiko Sedang
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-500/10 text-emerald-600 px-3 py-1 font-space text-[10px] font-bold tracking-widest uppercase rounded">
                            Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {Object.keys(categoryStats).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      Tidak ada data kategori yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
