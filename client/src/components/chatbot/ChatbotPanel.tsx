import { useState, useRef, useEffect } from 'react'
import { MessageSquare, MoreVertical, ArrowUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import ReactMarkdown from 'react-markdown'

interface ChatbotPanelProps {
  documentId?: string
  selectedClauseId: string | null
}

interface Inquiry {
  id: string
  question: string
  answer: string
  created_at: string
}

export function ChatbotPanel({ selectedClauseId }: ChatbotPanelProps) {
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [streamingQuestion, setStreamingQuestion] = useState('')
  const [streamingAnswer, setStreamingAnswer] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: history = [], refetch } = useQuery<Inquiry[]>({
    queryKey: ['chatHistory', selectedClauseId],
    queryFn: async () => {
      if (!selectedClauseId) return []
      const res = await api.get(`/chat/clauses/${selectedClauseId}/inquiries/`)
      return res.data.results ? res.data.results.reverse() : res.data.reverse()
    },
    enabled: !!selectedClauseId
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleAsk = async (text: string) => {
    if (!text.trim() || !selectedClauseId || isAsking) return
    
    setIsAsking(true)
    setQuestion('')
    setStreamingQuestion(text)
    setStreamingAnswer('')

    try {
      const token = localStorage.getItem('token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1'
      const response = await fetch(`${baseUrl}/chat/clauses/${selectedClauseId}/ask/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: text })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            const chunk = decoder.decode(value, { stream: true })
            setStreamingAnswer(prev => prev + chunk)
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }
      refetch()
    } catch (e) {
      console.error('Failed to ask question', e)
    } finally {
      setIsAsking(false)
      setStreamingQuestion('')
      setStreamingAnswer('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAsk(question)
    }
  }

  return (
    <Card className="h-full bg-card border-none flex flex-col overflow-hidden rounded-none shadow-none">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-instrument text-primary tracking-tight">Qupy AI</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${selectedClauseId ? 'bg-emerald-500' : 'bg-muted-foreground'}`}></div>
              <span className="text-[10px] font-space uppercase tracking-widest text-muted-foreground font-semibold">
                {selectedClauseId ? 'Siap Berdiskusi' : 'Pilih Klausul'}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-card">
        
        {!selectedClauseId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <div className="w-16 h-16 bg-muted text-primary flex items-center justify-center mb-6 rounded-xl">
              <Info className="w-8 h-8" />
            </div>
            <h3 className="text-2xl md:text-3xl font-instrument text-primary mb-3 tracking-tight">Klik klausul di dokumen</h3>
            <p className="text-sm font-inter text-muted-foreground leading-relaxed">
              Pilih salah satu klausul di editor sebelah kanan untuk mulai berdiskusi, meminta penjelasan, atau memperbaiki teks.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-6">
            
            {history.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center">
                <h4 className="text-[10px] font-space text-muted-foreground uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                  <span className="text-secondary">✦</span> PERTANYAAN CEPAT
                </h4>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleAsk("Tolong jelaskan klausul ini dalam bahasa yang sederhana.")} className="bg-muted hover:bg-muted/80 text-foreground px-4 py-3 text-xs font-space tracking-wide transition-colors text-left rounded-md border border-border/50">
                    Jelaskan klausul ini
                  </button>
                  <button onClick={() => handleAsk("Apakah ada risiko tersembunyi di sini?")} className="bg-muted hover:bg-muted/80 text-foreground px-4 py-3 text-xs font-space tracking-wide transition-colors text-left rounded-md border border-border/50">
                    Identifikasi risiko tersembunyi
                  </button>
                  <button onClick={() => handleAsk("Bantu saya menulis ulang agar lebih seimbang bagi kedua pihak.")} className="bg-muted hover:bg-muted/80 text-foreground px-4 py-3 text-xs font-space tracking-wide transition-colors text-left rounded-md border border-border/50">
                    Tulis ulang agar seimbang
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <span className="text-[10px] font-space uppercase tracking-widest text-muted-foreground font-semibold bg-muted px-2 py-1 rounded">
                    Mulai Diskusi Klausul
                  </span>
                </div>
                
                {history.map((inq) => (
                  <div key={inq.id} className="flex flex-col gap-4">
                    {/* User Question */}
                    <div className="self-end bg-primary/10 text-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-primary/20">
                      <p className="text-sm font-inter leading-relaxed">{inq.question}</p>
                    </div>
                    
                    {/* AI Answer */}
                    <div className="self-start bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] border border-border shadow-sm">
                      <div className="text-sm font-inter leading-relaxed prose prose-sm dark:prose-invert [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold">
                        <ReactMarkdown>{inq.answer}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                
                {streamingQuestion && (
                  <div className="flex flex-col gap-4">
                    <div className="self-end bg-primary/10 text-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] border border-primary/20">
                      <p className="text-sm font-inter leading-relaxed">{streamingQuestion}</p>
                    </div>
                    <div className="self-start bg-muted text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[90%] border border-border shadow-sm">
                      {!streamingAnswer ? (
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                      ) : (
                        <div className="text-sm font-inter leading-relaxed prose prose-sm dark:prose-invert [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-bold">
                          <ReactMarkdown>{streamingAnswer}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative">
          <Input 
            className="w-full pl-4 pr-12 h-12 bg-muted/50 border-border focus-visible:ring-primary text-sm font-inter rounded-md"
            placeholder={selectedClauseId ? "Berikan tanggapan ke AI..." : "Pilih klausul dulu..."}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedClauseId || isAsking}
          />
          <Button 
            size="icon" 
            onClick={() => handleAsk(question)}
            disabled={!selectedClauseId || !question.trim() || isAsking}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground w-8 h-8 rounded-md"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
