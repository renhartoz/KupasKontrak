import { Download, ShieldAlert, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'

interface DocumentEditorProps {
  document: any
  selectedClauseId: string | null
  onSelectClause: (id: string | null) => void
}

export function DocumentEditor({ document, selectedClauseId, onSelectClause }: DocumentEditorProps) {
  const { data: clauses = [], isLoading } = useQuery({
    queryKey: ['clauses', document.id],
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

            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <span className="font-space uppercase tracking-widest text-xs font-bold animate-pulse">Memuat Klausul...</span>
              </div>
            ) : clauses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm font-inter text-muted-foreground">Tidak ada klausul yang terdeteksi.</p>
              </div>
            ) : (
              clauses.map((clause: any) => {
                const isSelected = selectedClauseId === clause.id
                const isHighRisk = clause.risk_level === 'high'
                
                return (
                  <div 
                    key={clause.id} 
                    className="relative cursor-pointer group"
                    onClick={() => onSelectClause(clause.id)}
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
                          SKOR: {clause.clause_safety_score}/100
                        </span>
                      </h2>
                      <p className={`text-sm font-inter leading-relaxed ${isHighRisk ? 'text-destructive font-medium' : 'text-foreground'}`}>
                        {clause.clause_text}
                      </p>
                      
                      {isSelected && clause.plain_language_summary && (
                        <div className="mt-4 p-4 bg-background border border-border rounded-md shadow-sm">
                          <h4 className="text-[10px] font-space uppercase tracking-widest font-bold text-muted-foreground mb-2">Ringkasan AI:</h4>
                          <p className="text-sm font-inter text-foreground italic">{clause.plain_language_summary}</p>
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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-md p-2 flex items-center justify-center gap-4 z-10 rounded-lg w-full max-w-sm sm:max-w-max">
        <span className="text-xs font-space text-muted-foreground uppercase tracking-widest font-bold px-2">
          Mode Baca Saja (Analisis AI)
        </span>
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
