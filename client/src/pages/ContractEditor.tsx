import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChatbotPanel } from '@/components/chatbot/ChatbotPanel'
import { DocumentEditor } from '@/components/draft/DocumentEditor'
import { DraftConfigModal, DraftPreviewModal } from '@/components/draft/DraftModals'
import { api } from '@/api'
import { Loader2, AlertCircle, MessageSquare, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function ContractEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
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

  const [showDraftConfig, setShowDraftConfig] = useState(false)
  const [showDraftPreview, setShowDraftPreview] = useState(false)
  const [isPollingDraft, setIsPollingDraft] = useState(false)
  
  const { data: drafts } = useQuery({
    queryKey: ['drafts', id],
    queryFn: async () => {
      const res = await api.get(`/insights/documents/${id}/drafts/list/`)
      return res.data.results || res.data
    },
    refetchInterval: isPollingDraft ? 2000 : false,
    enabled: !!id
  })

  const prevDraftsLength = useRef(0)

  useEffect(() => {
    if (drafts) {
      if (isPollingDraft && drafts.length > prevDraftsLength.current) {
        setIsPollingDraft(false)
        setShowDraftPreview(true)
      }
      prevDraftsLength.current = drafts.length
    }
  }, [drafts, isPollingDraft])

  const queryClient = useQueryClient()

  useEffect(() => {
    const isProcessing = document && document.status !== 'done' && document.status !== 'failed'
    if (!isProcessing || !id) return

    const token = localStorage.getItem('token')
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
    const evtSource = new EventSource(`${baseUrl}/documents/${id}/events/?token=${token}`)
    
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
      <div className="h-[calc(100vh-160px)] min-h-[500px] flex w-full border border-border rounded-xl overflow-hidden shadow-sm bg-card animate-pulse">
        {/* Skeleton Sidebar / Chat */}
        <div className="w-[400px] hidden xl:flex flex-col border-r border-border bg-muted/20 p-4">
          <div className="h-8 bg-muted rounded-md w-1/3 mb-6"></div>
          <div className="h-20 bg-muted/50 rounded-xl mb-4"></div>
          <div className="h-10 bg-muted/40 rounded-lg mb-2"></div>
          <div className="h-10 bg-muted/30 rounded-lg"></div>
          <div className="mt-auto h-12 bg-muted/50 rounded-lg"></div>
        </div>
        
        {/* Skeleton Editor */}
        <div className="flex-1 p-8 bg-background flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-primary/20 rounded w-24"></div>
          </div>
          <div className="h-10 bg-muted/80 rounded mb-6 w-3/4 mx-auto"></div>
          <div className="space-y-4 max-w-3xl mx-auto w-full mt-8">
            <div className="h-4 bg-muted/60 rounded w-full"></div>
            <div className="h-4 bg-muted/60 rounded w-[90%]"></div>
            <div className="h-4 bg-muted/60 rounded w-[95%]"></div>
            <div className="h-4 bg-muted/60 rounded w-[80%] mb-8"></div>
            
            <div className="p-6 bg-muted/30 border-l-4 border-muted rounded-r-lg mb-6">
              <div className="h-5 bg-muted/80 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-muted/60 rounded w-full mb-2"></div>
              <div className="h-4 bg-muted/60 rounded w-[85%]"></div>
            </div>
            
            <div className="h-4 bg-muted/60 rounded w-[90%]"></div>
            <div className="h-4 bg-muted/60 rounded w-full"></div>
          </div>
        </div>
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
            onAutoFix={user?.tier === 'b2b_profesional' ? () => setShowDraftConfig(true) : undefined}
            isPollingDraft={isPollingDraft}
          />
        </div>
      </div>

      <DraftConfigModal 
        isOpen={showDraftConfig} 
        onClose={() => setShowDraftConfig(false)} 
        documentId={id as string} 
        onSuccess={() => setIsPollingDraft(true)} 
      />

      <DraftPreviewModal
        isOpen={showDraftPreview}
        onClose={() => setShowDraftPreview(false)}
        draft={drafts && drafts.length > 0 ? drafts[0] : null}
      />

    </div>
  )
}

