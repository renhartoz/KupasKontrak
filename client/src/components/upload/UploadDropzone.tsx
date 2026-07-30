import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { UploadCloud, File, X, ArrowRight, FileText } from 'lucide-react'

export function UploadDropzone() {
  return (
    <Card className="w-full max-w-4xl mx-auto bg-card border border-border shadow-sm overflow-hidden rounded-xl">
      {/* Header Row */}
      <div className="flex items-center justify-between p-5 border-b border-border bg-card relative z-10">
        <span className="text-xs font-space text-muted-foreground uppercase tracking-widest font-bold">
          Pilih Cara Memulai
        </span>
        <div className="bg-destructive text-destructive-foreground px-3 py-1.5 flex items-center gap-2 rounded">
          <ShieldAlertIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-space uppercase tracking-widest font-bold">
            Mode Pindai Risiko Aktif
          </span>
        </div>
      </div>

      {/* Dropzone Area */}
      <div className="relative p-10 lg:p-16 flex flex-col items-center justify-center text-center bg-muted/30">
        
        {/* Content */}
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-muted text-muted-foreground text-xs font-space uppercase tracking-widest font-semibold py-2 px-4 rounded-md inline-block mb-8 border border-border">
            Unggah dokumen untuk evaluasi risiko
          </div>

          <div className="w-16 h-16 mx-auto bg-primary/10 text-primary flex items-center justify-center mb-5 rounded-xl">
            <FileText className="w-7 h-7" />
          </div>

          <h2 className="text-2xl md:text-3xl font-playfair text-primary font-bold mb-3 tracking-tight">
            Tarik & lepas kontrak di sini
          </h2>
          
          <p className="text-sm font-inter text-muted-foreground mb-8">
            Dukung format PDF dan Word (.docx) untuk dipindai secara instan oleh AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button className="bg-primary hover:bg-primary/90 px-8 h-12 text-xs font-space uppercase tracking-widest text-primary-foreground flex items-center gap-2 rounded-md w-full sm:w-auto shadow-sm">
              Cari Berkas
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" className="border-border text-foreground hover:bg-muted px-8 h-12 text-xs font-space uppercase tracking-widest flex items-center gap-2 bg-card rounded-md w-full sm:w-auto shadow-sm">
              <UploadCloud className="w-4 h-4" />
              Dropbox
            </Button>
          </div>

          <p className="text-xs font-space text-muted-foreground uppercase tracking-widest font-semibold mt-8">
            Pindai risiko gratis - tidak perlu mendaftar
          </p>
        </div>
      </div>
    </Card>
  )
}

function ShieldAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
