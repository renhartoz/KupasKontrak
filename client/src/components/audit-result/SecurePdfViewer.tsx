import { Search, ZoomIn, ZoomOut, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SecurePdfViewerProps {
  signedUrl: string
  title: string
}


export function SecurePdfViewer({ signedUrl, title }: SecurePdfViewerProps) {
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

      {/* PDF Canvas */}
      <div className="flex-1 w-full bg-surface-container-low h-full relative">
        <iframe
          src={signedUrl}
          title={title}
          className="w-full h-full border-none"
        />
      </div>
      
    </Card>
  )
}

