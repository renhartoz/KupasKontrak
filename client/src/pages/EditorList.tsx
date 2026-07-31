import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { FileText, ChevronRight, Loader2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface Document {
  id: string
  original_filename: string
  status: string
  overall_risk_score: number
  created_at: string
}

export function EditorList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents/')
      return res.data.results ? res.data.results : res.data
    }
  })

  const filteredDocs = documents.filter(doc => 
    doc.original_filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-2 md:p-4">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-instrument text-primary mb-3 tracking-tight">Koleksi Dokumen</h1>
          <p className="text-sm font-inter text-muted-foreground max-w-lg">
            Pilih dokumen yang ingin Anda ulas atau sunting menggunakan Editor AI.
          </p>
        </div>
      </header>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Cari nama dokumen..." 
          className="pl-10 h-12 bg-card border-border shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center p-20 bg-card border border-border rounded-xl shadow-sm">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-inter font-bold">Tidak ada dokumen ditemukan</p>
          <p className="text-sm text-muted-foreground mt-2">Unggah dokumen baru di menu Scanner.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredDocs.map((doc) => (
            <Card 
              key={doc.id} 
              onClick={() => navigate(`/editor/${doc.id}`)}
              className="p-5 border border-border shadow-sm hover:border-primary/50 transition-all hover:shadow-md cursor-pointer group flex flex-col rounded-xl bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-space text-muted-foreground uppercase tracking-widest font-semibold">
                  {new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <Badge variant={doc.status === 'audited' ? (doc.overall_risk_score >= 70 ? 'destructive' : 'secondary') : 'default'} className="font-space text-[10px] tracking-widest uppercase">
                  {doc.status === 'audited' ? (doc.overall_risk_score >= 70 ? 'Beresiko' : 'Selesai') : doc.status}
                </Badge>
              </div>
              
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-inter font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {doc.original_filename}
                  </h3>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-space text-muted-foreground uppercase tracking-widest font-bold">
                  Skor: {doc.overall_risk_score || 0}/100
                </span>
                <div className="flex items-center text-xs font-inter text-primary font-medium group-hover:translate-x-1 transition-transform">
                  Buka Editor <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
