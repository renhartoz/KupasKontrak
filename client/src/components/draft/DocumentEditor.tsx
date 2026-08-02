import { useState } from 'react'
import { Download, ShieldAlert, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import ReactMarkdown from 'react-markdown'
import { SecurePdfViewer } from '../audit-result/SecurePdfViewer'

interface DocumentEditorProps {
  document: any
  selectedClauseId: string | null
  onSelectClause: (id: string | null) => void
}

export function DocumentEditor({ document, selectedClauseId, onSelectClause }: DocumentEditorProps) {
  const [viewMode, setViewMode] = useState<'ringkas' | 'dokumen_penuh' | 'dokumen_asli'>('ringkas')
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
                <HighlightedDocument 
                   text={document.extracted_text} 
                   clauses={clauses} 
                   selectedClauseId={selectedClauseId}
                   onSelectClause={onSelectClause}
                />
              </div>
            ) : viewMode === 'dokumen_asli' ? (
              <div className="bg-background shadow-sm rounded-md h-[800px] w-full relative overflow-hidden">
                 {document.signed_pdf_url ? (
                   <SecurePdfViewer signedUrl={document.signed_pdf_url} title={document.original_filename} />
                 ) : (
                   <div className="flex h-full w-full items-center justify-center p-8 text-muted-foreground text-sm border border-border border-dashed">
                     Tautan PDF asli tidak tersedia atau sudah kedaluwarsa.
                   </div>
                 )}
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
          <button 
            onClick={() => setViewMode('dokumen_asli')} 
            className={`px-3 py-1.5 text-[10px] font-space tracking-widest uppercase font-bold rounded-sm transition-colors ${viewMode === 'dokumen_asli' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            PDF Asli
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

function HighlightedDocument({ text, clauses, selectedClauseId, onSelectClause }: { text: string, clauses: any[], selectedClauseId: string | null, onSelectClause: (id: string | null) => void }) {
  if (!text) return <div className="text-center text-muted-foreground py-12">Teks penuh dokumen belum tersedia.</div>;

  const matches: { start: number, end: number, clause: any }[] = [];
  const textMapping: number[] = [];
  const normalizedTextArr: string[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/[a-zA-Z0-9]/.test(text[i])) {
      normalizedTextArr.push(text[i].toLowerCase());
      textMapping.push(i);
    }
  }
  const normTextStr = normalizedTextArr.join('');

  clauses.forEach(clause => {
    if (!clause.clause_text) return;
    const searchNormalized = clause.clause_text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (searchNormalized.length === 0) return;

    let matchIdx = normTextStr.indexOf(searchNormalized);
    if (matchIdx !== -1) {
      const startOrig = textMapping[matchIdx];
      const endOrig = textMapping[matchIdx + searchNormalized.length - 1] + 1;
      matches.push({ start: startOrig, end: endOrig, clause });
    }
  });

  matches.sort((a, b) => a.start - b.start);

  const chunks: { text: string, isClause: boolean, clause?: any }[] = [];
  let currentIndex = 0;

  matches.forEach(match => {
    if (match.start > currentIndex) {
      chunks.push({ text: text.substring(currentIndex, match.start), isClause: false });
    }
    if (match.start >= currentIndex) {
      chunks.push({ text: text.substring(match.start, match.end), isClause: true, clause: match.clause });
      currentIndex = match.end;
    }
  });

  if (currentIndex < text.length) {
    chunks.push({ text: text.substring(currentIndex), isClause: false });
  }

  const renderClauseText = (clauseText: string, riskyKeywords: string[]) => {
    if (!riskyKeywords || riskyKeywords.length === 0) return clauseText;
    
    const sortedKeywords = [...riskyKeywords].sort((a, b) => b.length - a.length);
    let textChunks = [{ text: clauseText, isKeyword: false }];
    
    sortedKeywords.forEach(keyword => {
      if (!keyword) return;
      const newChunks: {text: string, isKeyword: boolean}[] = [];
      textChunks.forEach(chunk => {
        if (chunk.isKeyword) {
          newChunks.push(chunk);
        } else {
          const parts = chunk.text.split(keyword);
          parts.forEach((part, index) => {
            if (part) newChunks.push({ text: part, isKeyword: false });
            if (index < parts.length - 1) {
              newChunks.push({ text: keyword, isKeyword: true });
            }
          });
        }
      });
      textChunks = newChunks;
    });
    
    return textChunks.map((c, i) => 
      c.isKeyword ? <strong key={i} className="font-bold bg-red-500/40 text-red-950 border-b-2 border-red-600 px-1 mx-0.5 rounded-sm shadow-sm">{c.text}</strong> : <span key={i}>{c.text}</span>
    );
  };

  return (
    <div className="text-sm font-inter text-foreground leading-relaxed text-justify whitespace-pre-wrap">
      {chunks.map((chunk, i) => {
        if (!chunk.isClause) {
          return <span key={i}>{chunk.text}</span>
        }
        
        const isHighRisk = chunk.clause.clause_safety_score >= 70;
        const isSelected = selectedClauseId === chunk.clause.id;
        
        return (
          <span 
            key={i}
            id={`clause-${chunk.clause.id}`}
            onClick={() => onSelectClause(isSelected ? null : chunk.clause.id)}
            className={`cursor-pointer inline transition-all duration-200 px-1 rounded-sm ${
              isSelected 
                ? (isHighRisk ? 'bg-destructive/20 border-b-2 border-destructive shadow-sm' : 'bg-amber-500/30 border-b-2 border-amber-500 shadow-sm')
                : (isHighRisk ? 'bg-destructive/10 hover:bg-destructive/20 border-b border-destructive/30' : 'bg-amber-500/10 hover:bg-amber-500/20 border-b border-amber-500/30')
            }`}
            title={`Kategori: ${chunk.clause.category} | Skor: ${Math.round(chunk.clause.clause_safety_score)}/100`}
          >
            <strong className="inline-flex items-center bg-emerald-500/30 text-emerald-900 font-bold px-1.5 py-0.5 rounded-sm mx-1 uppercase text-[10px] tracking-wider align-baseline border-b-2 border-emerald-500/50 shadow-sm">
              {chunk.clause.category.replace(/_/g, ' ')}
            </strong>
            {renderClauseText(chunk.text, chunk.clause.risky_keywords)}
          </span>
        )
      })}
    </div>
  )
}
