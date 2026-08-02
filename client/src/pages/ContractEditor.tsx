import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChatbotPanel } from '@/components/chatbot/ChatbotPanel'
import { DocumentEditor } from '@/components/draft/DocumentEditor'
import { api } from '@/api'
import { Loader2, AlertCircle, MessageSquare, FileText } from 'lucide-react'

export function ContractEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('editor')

  const { data: document, error, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await api.get(`/documents/${id}/`)
      return res.data
    },
    retry: 1
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    const isProcessing = document && document.status !== 'done' && document.status !== 'failed'
    if (!isProcessing || !id) return

    const token = localStorage.getItem('token')
    const evtSource = new EventSource(`http://localhost:8000/api/v1/documents/${id}/events/?token=${token}`)
    
    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.status === 'done' || data.status === 'failed') {
          queryClient.invalidateQueries({ queryKey: ['document', id] })
          queryClient.invalidateQueries({ queryKey: ['clauses', id] })
          evtSource.close()
        }
      } catch (e) {
      }
    }
    
    return () => {
      evtSource.close()
    }
  }, [document?.status, id, queryClient])

  useEffect(() => {
    if (selectedClauseId) {
      setActiveTab('chat')
    } else {
      setActiveTab('editor')
    }
  }, [selectedClauseId])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-fade-in min-h-[500px] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-instrument text-primary">Memuat Dokumen...</h2>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-fade-in min-h-[500px] items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-instrument text-destructive mb-2">Gagal Memuat Dokumen</h2>
        <p className="text-sm font-inter text-muted-foreground mb-4">
          Dokumen tidak ditemukan atau terjadi kesalahan server.
        </p>
        <button onClick={() => navigate('/dashboard')} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-space uppercase tracking-widest">
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  if (document.status === 'uploaded' || document.status === 'processing') {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-fade-in min-h-[500px] items-center justify-center p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <h2 className="text-3xl font-instrument text-primary mb-2">AI Sedang Memindai...</h2>
        <p className="text-sm font-inter text-muted-foreground max-w-md">
          Dokumen sedang diproses oleh AI untuk mendeteksi risiko dan mengekstrak klausul. Mohon tunggu beberapa saat.
        </p>
      </div>
    )
  }

  if (document.status === 'failed') {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-fade-in min-h-[500px] items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-instrument text-destructive mb-2">Pemindaian Gagal</h2>
        <p className="text-sm font-inter text-muted-foreground mb-4 max-w-md">
          {document.failure_reason || 'Terjadi kesalahan saat memindai dokumen. Silakan coba lagi.'}
        </p>
        <button onClick={() => api.post(`/documents/${id}/retry/`)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-space uppercase tracking-widest mb-2">
          Coba Lagi
        </button>
        <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground text-sm font-inter underline">
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-160px)] min-h-[500px] flex flex-col w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-fade-in">
      
      {/* Mobile Tab Segmented Control */}
      <div className="xl:hidden flex border-b border-border bg-muted/30 p-2 shrink-0">
        <div className="flex w-full bg-muted rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('editor')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-space uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-background shadow text-foreground font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FileText className="w-4 h-4" />
            Dokumen
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-space uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-background shadow text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageSquare className="w-4 h-4" />
            Qupy AI
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row w-full overflow-hidden relative">
        {/* Left Pane: Chatbot (Hidden on mobile if tab is not chat) */}
        <div className={`w-full xl:w-[400px] shrink-0 xl:border-r border-border bg-background flex-col ${activeTab === 'chat' ? 'flex' : 'hidden xl:flex'}`}>
          <ChatbotPanel 
            documentId={id} 
            selectedClauseId={selectedClauseId} 
          />
        </div>

        {/* Right Pane: Document Editor (Hidden on mobile if tab is not editor) */}
        <div className={`flex-1 min-w-0 bg-background flex-col relative ${activeTab === 'editor' ? 'flex' : 'hidden xl:flex'}`}>
          <DocumentEditor 
            document={document} 
            selectedClauseId={selectedClauseId}
            onSelectClause={setSelectedClauseId}
          />
        </div>
      </div>

    </div>
  )
}

