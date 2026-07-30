import { Search, ZoomIn, ZoomOut, Share2, Download, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SecurePdfViewerProps {
  signedUrl: string
  title: string
}

/**
 * CONSTRAINT: The `signedUrl` is short-lived and request-scoped.
 * NEVER persist this URL in localStorage, TanStack Query cache, or any other persistence layer.
 * It is solely for the lifecycle of this component.
 */
export function SecurePdfViewer({ signedUrl, title }: SecurePdfViewerProps) {
  // In a real implementation, we would pass signedUrl to a PDF rendering library
  // or an iframe. For the scaffolding, we mock the visual appearance of the PDF viewer.

  return (
    <Card className="flex flex-col bg-surface-container-lowest shadow-ambient border-outline-variant h-full overflow-hidden border-none rounded-none">
      
      {/* PDF Toolbar */}
      <div className="h-14 border-b border-outline-variant bg-surface-container flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-error/10 text-error flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-body-md font-inter font-bold text-on-surface truncate max-w-[200px]">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none text-outline hover:text-primary hover:bg-surface-variant">
            <Search className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-outline-variant mx-2"></div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none text-outline hover:text-primary hover:bg-surface-variant">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-label-sm font-space text-on-surface-variant w-12 text-center">100%</span>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none text-outline hover:text-primary hover:bg-surface-variant">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Mock */}
      <div className="flex-1 overflow-y-auto bg-surface-container-low p-8 text-on-surface">
        <div className="text-center mb-8">
          <h2 className="text-headline-md font-playfair font-bold uppercase tracking-widest text-primary mb-6">
            Perjanjian Layanan Induk
          </h2>
          <p className="text-body-sm font-inter text-on-surface-variant text-left leading-relaxed">
            Perjanjian Layanan Induk ini ("Perjanjian") dibuat pada tanggal 24 Oktober 2023, oleh dan antara para pihak yang tercantum di bawah ini.
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="text-body-md font-bold font-inter mb-2 uppercase">1. Definisi</h3>
          <p className="text-body-sm font-inter text-on-surface-variant text-left leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        <div className="bg-error-container/20 border border-error p-4">
          <h3 className="text-body-md font-bold font-inter mb-2 uppercase text-error">2. Batasan Tanggung Jawab</h3>
          <p className="text-body-sm font-inter text-error text-left leading-relaxed">
            Dalam keadaan apa pun, tidak satu pun pihak akan bertanggung jawab atas kerugian tidak langsung, insidental, khusus, atau konsekuensial, kecuali dalam kasus kelalaian berat atau kesalahan yang disengaja.
            Total tanggung jawab Penyedia Layanan berdasarkan Perjanjian ini tidak akan melebihi jumlah yang dibayarkan oleh Klien dalam tiga (3) bulan sebelum klaim.
          </p>
        </div>
      </div>
      
    </Card>
  )
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}
