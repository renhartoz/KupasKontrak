import { Bold, Italic, Underline, Link, AlignLeft, Search, Download, Trash2, ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function DocumentEditor() {
  return (
    <Card className="h-full bg-card flex flex-col relative overflow-hidden border-none rounded-none shadow-none">
      
      {/* Editor Canvas (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-8 lg:p-12 relative">
        <div className="max-w-3xl mx-auto bg-card min-h-[1056px] shadow-sm border border-border p-8 sm:p-12 lg:p-16 text-foreground relative rounded-sm">
          
          {/* Header Metas */}
          <div className="flex justify-between items-center text-[10px] font-space text-muted-foreground uppercase tracking-widest font-bold mb-16">
            <span>ID: REQ-3829-892</span>
            <span>DRAF v2.1</span>
          </div>

          {/* Document Content */}
          <div className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-playfair text-primary font-bold text-center leading-tight mb-16 tracking-tight">
              PERJANJIAN<br/>LAYANAN<br/>INDUK
            </h1>

            <div>
              <h2 className="text-xl font-playfair font-bold mb-4 uppercase text-foreground">1. Definisi</h2>
              <p className="text-sm font-inter text-muted-foreground leading-relaxed mb-4 text-justify">
                "Perjanjian" berarti Perjanjian Layanan Induk ini, bersama dengan Pernyataan Kerja (SOW), 
                lampiran, jadwal, atau adendum apa pun yang terlampir padanya atau dilaksanakan oleh Para Pihak yang merujuk pada Perjanjian ini.
              </p>
              <p className="text-sm font-inter text-muted-foreground leading-relaxed mb-4 text-justify">
                "Informasi Rahasia" berarti setiap informasi non-publik yang diungkapkan oleh salah satu Pihak ("Pihak Pengungkap") 
                kepada Pihak lainnya ("Pihak Penerima") yang ditetapkan sebagai rahasia atau yang sepatutnya 
                dipahami sebagai rahasia mengingat sifat informasi dan keadaan pengungkapannya.
              </p>
            </div>

            <div className="relative">
              {/* Highlight indicator icon */}
              <div className="absolute -left-12 top-0 text-destructive bg-destructive/10 p-1 rounded-sm opacity-80 hidden sm:block">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="bg-destructive/5 border-l-4 border-destructive p-5 sm:p-6 -mx-5 sm:-mx-6 rounded-r-md">
                <h2 className="text-lg font-playfair font-bold mb-3 uppercase text-destructive">2. Batasan Tanggung Jawab</h2>
                <p className="text-sm font-inter leading-relaxed text-destructive font-medium">
                  KERUGIAN KONSEKUENSIAL ATAU PENGHUKUMAN; ATAU KERUGIAN ATAS HILANGNYA KEUNTUNGAN, PENDAPATAN...
                </p>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Floating Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border shadow-md p-1.5 flex flex-wrap items-center justify-center gap-1 z-10 rounded-lg w-full max-w-sm sm:max-w-max">
        
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <span className="font-bold font-playfair text-sm">H1</span>
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <span className="font-bold font-playfair text-sm">H2</span>
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>

        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-primary bg-primary/10 hover:bg-primary/20">
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <Underline className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <Link className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>
        
        <div className="hidden sm:flex items-center gap-2 px-2 text-[10px] font-space text-primary font-semibold tracking-widest uppercase">
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded text-muted-foreground hover:text-primary p-0 hover:bg-muted">
            {'<'}
          </Button>
          <span>5 dari 14</span>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded text-muted-foreground hover:text-primary p-0 hover:bg-muted">
            {'>'}
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1"></div>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-foreground hover:bg-muted">
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded text-destructive hover:bg-destructive hover:text-destructive-foreground">
          <Trash2 className="w-4 h-4" />
        </Button>

      </div>

    </Card>
  )
}
