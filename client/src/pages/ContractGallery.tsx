import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api'
import { Card } from '@/components/ui/card'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, ChevronRight, Loader2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'

interface Document {
  id: string
  original_filename: string
  status: string
  overall_risk_score: number
  created_at: string
}

export function ContractGallery() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')

  useEffect(() => {
    const querySearch = searchParams.get('search')
    if (querySearch !== null) {
      setSearch(querySearch)
    }
  }, [searchParams])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (e.target.value) {
      setSearchParams({ search: e.target.value })
    } else {
      setSearchParams({})
    }
  }

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await api.get('/documents/')
      return res.data.results ? res.data.results : res.data
    }
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1'
    const evtSource = new EventSource(`${baseUrl}/documents/events/?token=${token}`)
    
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.status) {
          queryClient.invalidateQueries({ queryKey: ['documents'] })
        }
      } catch (e) {
        console.error("SSE parse error", e)
      }
    }
    
    return () => {
      evtSource.close()
    }
  }, [queryClient])

  const filteredDocs = documents.filter(doc => 
    doc.original_filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in p-2 md:p-4">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-instrument text-primary mb-3 tracking-tight">Galeri Dokumen</h1>
          <p className="text-sm font-inter text-muted-foreground">
            Pilih dokumen yang ingin Anda lihat hasil laporannya atau sunting menggunakan Editor AI.
          </p>
        </div>
      </header>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Cari nama dokumen..." 
          className="pl-10 h-12 bg-card border-border shadow-sm"
          value={search}
          onChange={handleSearchChange}
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
              onClick={() => navigate(`/results/${doc.id}`)}
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/editor/${doc.id}`);
                  }}
                  className="flex items-center text-xs font-inter text-primary font-medium hover:text-primary/80 transition-colors z-10 p-2 -mr-2 rounded hover:bg-muted"
                >
                  Buka Editor <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
