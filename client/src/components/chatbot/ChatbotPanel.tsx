import { MessageSquare, MoreVertical, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function ChatbotPanel() {
  return (
    <Card className="h-full bg-card border-none flex flex-col overflow-hidden rounded-none shadow-none">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-playfair font-bold text-primary tracking-tight">Qupy AI</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-space uppercase tracking-widest text-muted-foreground font-semibold">Aktif & Membaca</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Chat Area (Empty State) */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-card">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-muted text-primary flex items-center justify-center mb-6 rounded-xl">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl md:text-2xl font-playfair text-primary font-bold mb-3 tracking-tight">Bagaimana saya bisa membantu?</h3>
          <p className="text-sm font-inter text-muted-foreground leading-relaxed">
            Minta ringkasan, temukan risiko, jelaskan istilah rumit, atau buat draf klausul baru.
          </p>
        </div>

        {/* Quick Questions */}
        <div className="mt-auto pt-6 border-t border-border">
          <h4 className="text-[10px] font-space text-muted-foreground uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
            <span className="text-secondary">✦</span> PERTANYAAN CEPAT
          </h4>
          <div className="flex flex-col gap-2">
            <button className="bg-muted hover:bg-muted/80 text-foreground px-4 py-3 text-xs font-space tracking-wide transition-colors text-left rounded-md border border-border/50">
              Ringkas kewajiban utama
            </button>
            <button className="bg-muted hover:bg-muted/80 text-foreground px-4 py-3 text-xs font-space tracking-wide transition-colors text-left rounded-md border border-border/50">
              Identifikasi risiko berat
            </button>
            <button className="bg-muted hover:bg-muted/80 text-foreground px-4 py-3 text-xs font-space tracking-wide transition-colors text-left rounded-md border border-border/50">
              Jelaskan ganti rugi (indemnification)
            </button>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-border bg-card">
        <div className="relative">
          <Input 
            className="w-full pl-4 pr-12 h-12 bg-muted/50 border-border focus-visible:ring-primary text-sm font-inter rounded-md"
            placeholder="Tanyakan apa saja..."
          />
          <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground w-8 h-8 rounded-md">
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
