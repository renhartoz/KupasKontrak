import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Printer, CheckCircle, Wand2 } from 'lucide-react'
import { api } from '@/api'

export function DraftConfigModal({ 
  isOpen, 
  onClose, 
  documentId, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  documentId: string, 
  onSuccess: () => void 
}) {
  const [draftType, setDraftType] = useState('clause_patch')
  const [instructions, setInstructions] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    try {
      await api.post(`/insights/documents/${documentId}/drafts/`, {
        draft_type: draftType,
        custom_instructions: instructions
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Gagal memulai pembuatan draf. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-instrument text-2xl text-primary flex items-center gap-2">
            <Wand2 className="w-6 h-6" />
            Auto-Fix Kontrak
          </DialogTitle>
          <DialogDescription className="font-inter text-muted-foreground">
            AI akan menyusun ulang klausul-klausul yang bermasalah agar adil dan berimbang.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-[10px] font-space uppercase tracking-widest font-bold">Mode Perombakan</label>
            <select 
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="clause_patch">Tambalan Per Pasal (Clause Patch)</option>
              <option value="full_rewrite">Tulis Ulang Total (Full Rewrite)</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <label className="text-[10px] font-space uppercase tracking-widest font-bold">Instruksi Tambahan (Opsional)</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Cth: Tolong pastikan kompensasi lembur dibayar 1.5x lipat..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {error && <p className="text-sm font-inter text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="font-space uppercase tracking-widest text-[10px]">Batal</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary text-primary-foreground font-space uppercase tracking-widest text-[10px]">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Draf Sekarang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DraftPreviewModal({ 
  isOpen, 
  onClose, 
  draft 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  draft: any | null 
}) {
  if (!draft) return null

  const handlePrint = () => {
    const printContent = document.getElementById('draft-printable-area')
    if (!printContent) return
    const originalContent = document.body.innerHTML
    document.body.innerHTML = printContent.innerHTML
    window.print()
    document.body.innerHTML = originalContent
    window.location.reload()
  }

  const renderContent = () => {
    if (draft.draft_type === 'clause_patch' && draft.content.patches) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-instrument text-center mb-8">Lampiran Perubahan (Adendum)</h1>
          {draft.content.patches.map((p: any, i: number) => (
            <div key={i} className="border-b border-border pb-4">
              <p className="text-sm text-muted-foreground italic line-through mb-2">Original: {p.original_text}</p>
              <p className="font-medium text-foreground mb-1">Revisi Baru:</p>
              <p className="text-foreground leading-relaxed bg-primary/5 p-3 rounded-md border-l-4 border-primary mb-2">{p.proposed_patch_text}</p>
              <p className="text-xs text-muted-foreground"><strong className="text-secondary-foreground">Dasar Pemikiran:</strong> {p.rationale}</p>
            </div>
          ))}
        </div>
      )
    }

    if (draft.draft_type === 'full_rewrite' && draft.content.sections) {
      return (
        <div className="space-y-6">
          <h1 className="text-3xl font-instrument text-center mb-8">{draft.content.title || 'Draf Perjanjian'}</h1>
          {draft.content.sections.map((s: any, i: number) => (
            <div key={i}>
              <h2 className="text-lg font-bold font-inter mb-2 text-foreground">{s.section_title}</h2>
              <p className="text-foreground leading-relaxed text-sm mb-4 whitespace-pre-wrap">{s.content}</p>
            </div>
          ))}
        </div>
      )
    }

    return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(draft.content, null, 2)}</pre>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-instrument text-2xl flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
            Draf Selesai Dibuat!
          </DialogTitle>
          <DialogDescription className="font-inter text-muted-foreground">
            Periksa hasil perbaikan AI di bawah ini, lalu ekspor jika sudah sesuai.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 my-4 relative bg-background p-6 border border-border rounded-md shadow-inner" id="draft-printable-area">
          {renderContent()}
        </div>

        <DialogFooter className="mt-auto">
          <Button variant="outline" onClick={onClose} className="font-space uppercase tracking-widest text-[10px]">Tutup</Button>
          <Button onClick={handlePrint} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-space uppercase tracking-widest text-[10px] flex gap-2">
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
