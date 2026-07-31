import { UploadDropzone } from '@/components/upload/UploadDropzone'

export function RiskScanner() {
  // const [files, setFiles] = useState<File[]>([])

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-playfair text-primary font-bold mb-4 tracking-tight">Pemindaian Risiko Berbasis AI</h1>
        <p className="text-sm font-inter text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Unggah dokumen kontrak Anda untuk mendeteksi klausul berisiko, potensi jebakan hukum, dan rekomendasi perubahan dalam hitungan detik.
        </p>
      </div>

      {/* Upload Dropzone */}
      <UploadDropzone />
    </div>
  )
}
