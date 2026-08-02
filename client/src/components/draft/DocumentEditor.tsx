import { useState } from 'react'
import { Download, ShieldAlert, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import ReactMarkdown from 'react-markdown'

interface DocumentEditorProps {
  document: any
  selectedClauseId: string | null
  onSelectClause: (id: string | null) => void
}

export function DocumentEditor({ document, selectedClauseId, onSelectClause }: DocumentEditorProps) {
  const [viewMode, setViewMode] = useState<'ringkas' | 'dokumen_penuh'>('ringkas')
  const isProcessing = document && document.status !== 'done' && document.status !== 'failed'

  const { data: clauses = [], isLoading } = useQuery({
    queryKey: ['clauses', document.id, document.status],
    queryFn: async () => {
      const res = await api.get(`/audits/documents/${document.id}/clauses/`)
      return res.data.results ? res.data.results : res.data
    }
  })

  return (
    <Card className="h-full bg-card flex flex-col relative overflow-hidden border-none rounded-none shadow-none">
      
      {/* Editor Canvas (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-8 lg:p-12 relative">
        <div className="max-w-3xl mx-auto bg-card min-h-[1056px] shadow-sm border border-border p-8 sm:p-12 lg:p-16 text-foreground relative rounded-sm">
          
          {/* Header Metas */}
          <div className="flex justify-between items-center text-[10px] font-space text-muted-foreground uppercase tracking-widest font-bold mb-16 border-b border-border pb-4">
            <span>ID: {document.id.substring(0, 12)}</span>
            <span>{document.original_filename}</span>
          </div>

          {/* Document Content */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-instrument text-primary text-center leading-tight mb-16 tracking-tight">
              {document.original_filename.replace('.pdf', '').replace('.docx', '').replace(/_/g, ' ')}
            </h1>

            {isLoading || isProcessing ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 border border-border rounded-md bg-muted/20 animate-pulse">
                    <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-4/6"></div>
                  </div>
                ))}
                <div className="flex justify-center pt-4">
                  <span className="font-space uppercase tracking-widest text-[10px] text-muted-foreground animate-pulse">
                    Memindai Kontrak...
                  </span>
                </div>
              </div>
            ) : clauses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm font-inter text-muted-foreground">Tidak ada klausul yang terdeteksi.</p>
              </div>
            ) : viewMode === 'dokumen_penuh' ? (
              <div className="bg-background p-8 sm:p-12 border border-border shadow-sm rounded-md space-y-6">
                {document.extracted_text ? (
                  document.extracted_text.split('\n').map((paragraph: string, idx: number) => {
                    if (!paragraph.trim()) return null;
                    return (
                      <p key={idx} className="text-sm font-inter text-foreground leading-relaxed text-justify">
                        {paragraph}
                      </p>
                    )
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Teks penuh dokumen belum tersedia. Silakan proses ulang dokumen.
                  </div>
                )}
                
                <div className="pt-12 mt-12 border-t border-border">
                  <h3 className="font-instrument text-2xl text-primary mb-6">Klausul yang Disorot AI</h3>
                  <div className="space-y-6">
                    {clauses.map((clause: any) => (
                      <div 
                        key={clause.id}
                        onClick={() => onSelectClause(selectedClauseId === clause.id ? null : clause.id)}
                        className={`p-4 border rounded-md cursor-pointer transition-colors ${selectedClauseId === clause.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                      >
                        <h4 className="font-bold font-inter text-sm mb-2">{clause.category}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{clause.clause_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              clauses.map((clause: any) => {
                const isSelected = selectedClauseId === clause.id
                const isHighRisk = clause.clause_safety_score >= 70
                
                return (
                  <div 
                    key={clause.id} 
                    className="relative cursor-pointer group"
                    onClick={() => onSelectClause(selectedClauseId === clause.id ? null : clause.id)}
                  >
                    {/* Highlight indicator icon */}
                    {isHighRisk && (
                      <div className="absolute -left-12 top-0 text-destructive bg-destructive/10 p-1 rounded-sm hidden sm:block opacity-70 group-hover:opacity-100 transition-opacity">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                    
                    <div className={`p-5 sm:p-6 -mx-5 sm:-mx-6 rounded-md transition-colors ${
                      isSelected 
                        ? (isHighRisk ? 'bg-destructive/10 border-l-4 border-destructive' : 'bg-primary/10 border-l-4 border-primary') 
                        : (isHighRisk ? 'bg-destructive/5 border-l-2 border-destructive/50 hover:bg-destructive/10' : 'hover:bg-muted/50 border-l-2 border-transparent hover:border-border')
                    }`}>
                      <h2 className={`text-xl font-instrument mb-3 uppercase ${isHighRisk ? 'text-destructive' : 'text-primary'}`}>
                        {clause.category || 'Klausul'}
                        <span className="ml-3 text-[10px] font-space text-muted-foreground tracking-widest">
                          SKOR: {Math.round(clause.clause_safety_score)}/100
                        </span>
                      </h2>
                      
                      <div className="space-y-4">
                        <p className={`text-sm font-inter leading-relaxed ${isHighRisk ? 'text-destructive font-medium' : 'text-foreground'}`}>
                          {clause.clause_text}
                        </p>
                        
                        {clause.risky_keywords && clause.risky_keywords.length > 0 && (
                          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md shadow-sm">
                            <h4 className="text-[10px] font-space uppercase tracking-widest font-bold text-destructive mb-2 flex items-center gap-2">
                              <ShieldAlert className="w-3 h-3" /> Kalimat / Kata Berbahaya:
                            </h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {clause.risky_keywords.map((kw: string, i: number) => (
                                <li key={i} className="text-xs font-inter text-destructive font-bold italic">{kw}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {clause.legal_reference && (
                          <div className="mt-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md shadow-sm">
                            <h4 className="text-[10px] font-space uppercase tracking-widest font-bold text-amber-600 mb-2 flex items-center gap-2">
                              <FileText className="w-3 h-3" /> Dasar Hukum / Referensi:
                            </h4>
                            <p className="text-xs font-inter text-amber-700 leading-relaxed">
                              {clause.legal_reference}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {isSelected && clause.plain_language_summary && (
                        <div className="mt-4 p-4 bg-background border border-border rounded-md shadow-sm">
                          <h4 className="text-[10px] font-space uppercase tracking-widest font-bold text-muted-foreground mb-2">Ringkasan AI:</h4>
                          <div className="text-sm font-inter text-foreground italic [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>strong]:font-bold">
                            <ReactMarkdown>{clause.plain_language_summary}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-md p-2 flex items-center justify-center gap-2 z-10 rounded-lg w-full max-w-sm sm:max-w-max">
        <div className="flex bg-muted/50 rounded-md p-1">
          <button 
            onClick={() => setViewMode('ringkas')} 
            className={`px-3 py-1.5 text-[10px] font-space tracking-widest uppercase font-bold rounded-sm transition-colors ${viewMode === 'ringkas' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Ringkas
          </button>
          <button 
            onClick={() => setViewMode('dokumen_penuh')} 
            className={`px-3 py-1.5 text-[10px] font-space tracking-widest uppercase font-bold rounded-sm transition-colors ${viewMode === 'dokumen_penuh' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Dokumen Penuh
          </button>
        </div>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-foreground hover:bg-muted font-space text-[10px] tracking-widest uppercase flex gap-2"
          onClick={async () => {
             try {
                const res = await api.post(`/documents/${document.id}/export/`, { format: 'pdf' })
                if (res.data?.download_url) {
                   window.open(res.data.download_url, '_blank')
                }
             } catch (e) {
                alert('Gagal mengekspor dokumen atau fitur ini memerlukan paket Pro B2B.')
             }
          }}
        >
          <Download className="w-4 h-4" />
          Ekspor
        </Button>
      </div>

    </Card>
  )
}
