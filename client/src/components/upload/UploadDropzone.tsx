import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UploadCloud, ArrowRight, FileText, Loader2 } from 'lucide-react'
import { api } from '@/api'

export function UploadDropzone() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    setError('')
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Hanya mendukung format PDF untuk saat ini.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('Ukuran file maksimal 25 MB.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      // Redirect to the editor page with the new document ID
      navigate(`/editor/${response.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.file?.[0] || 'Gagal mengunggah dokumen.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card border border-border shadow-sm overflow-hidden rounded-xl">
      {/* Dropzone Area */}
      <div 
        className={`relative p-10 lg:p-16 flex flex-col items-center justify-center text-center transition-colors ${isDragging ? 'bg-primary/5 border-2 border-dashed border-primary/50' : 'bg-muted/30'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden" 
        />
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-muted text-muted-foreground text-xs font-space uppercase tracking-widest font-semibold py-2 px-4 rounded-md inline-block mb-8 border border-border">
            Unggah dokumen untuk evaluasi risiko
          </div>

          <div className="w-16 h-16 mx-auto bg-primary/10 text-primary flex items-center justify-center mb-5 rounded-xl">
            {isUploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileText className="w-7 h-7" />}
          </div>

          <h2 className="text-2xl md:text-3xl font-instrument text-primary mb-3 tracking-tight">
            {isUploading ? 'Mengunggah Dokumen...' : 'Tarik & lepas kontrak di sini'}
          </h2>
          
          <p className="text-sm font-inter text-muted-foreground mb-4">
            Dukung format PDF (maksimal 25MB) untuk dipindai secara instan oleh AI.
          </p>

          {error && (
            <div className="text-destructive text-sm font-inter mb-4 bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90 px-8 h-12 text-xs font-space uppercase tracking-widest text-primary-foreground flex items-center gap-2 rounded-md w-full sm:w-auto shadow-sm"
            >
              Cari Berkas
              {!isUploading && <ArrowRight className="w-4 h-4" />}
            </Button>
            
            <Button 
              variant="outline" 
              disabled={isUploading}
              className="border-border text-foreground hover:bg-muted px-8 h-12 text-xs font-space uppercase tracking-widest flex items-center gap-2 bg-card rounded-md w-full sm:w-auto shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Dropbox
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
