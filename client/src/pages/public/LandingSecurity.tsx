import { ShieldCheck, Lock, Scale } from 'lucide-react'

export function LandingSecurity() {
  return (
    <div className="w-full pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-instrument text-foreground mb-6">Dokumen Anda adalah Rahasia Anda.</h1>
          <p className="text-lg text-muted-foreground font-inter">
            Kami membangun KupasKontrak dengan prinsip privasi dan keamanan tingkat perusahaan. Anda memiliki kendali penuh atas data Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 mt-1">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-instrument font-medium text-foreground mb-2">No AI Training</h3>
                <p className="text-muted-foreground font-inter text-sm">
                  Dokumen dan kontrak yang Anda unggah tidak akan pernah digunakan untuk melatih model AI kami maupun pihak ketiga. Privasi Anda adalah hak mutlak.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 mt-1">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-instrument font-medium text-foreground mb-2">Auto-Sanitization</h3>
                <p className="text-muted-foreground font-inter text-sm">
                  Sistem kami secara otomatis mendeteksi dan menghapus (*redact*) data pribadi yang sensitif seperti NIK KTP, Nama Lengkap, dan Alamat sebelum dokumen diproses oleh mesin analisis LLM.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 mt-1">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-instrument font-medium text-foreground mb-2">Asas Lex Specialis</h3>
                <p className="text-muted-foreground font-inter text-sm">
                  Analisis hukum kami dirancang untuk berpihak pada keadilan pekerja. Mesin AI kami secara spesifik diprogram untuk mengutamakan hukum perlindungan sektoral (seperti UU Ketenagakerjaan) dibandingkan sekadar kebebasan berkontrak.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border shadow-lg rounded-2xl p-8 flex flex-col justify-center">
            <h3 className="text-lg font-space uppercase tracking-widest text-primary font-bold mb-6 text-center">Infrastruktur Keamanan</h3>
            <ul className="space-y-4">
              <li className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                <span className="font-inter text-sm font-medium">Private Signed URLs</span>
                <span className="text-xs text-muted-foreground">Enkripsi Akses Sesaat</span>
              </li>
              <li className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                <span className="font-inter text-sm font-medium">Event Sourcing Logs</span>
                <span className="text-xs text-muted-foreground">Jejak Audit Immutable</span>
              </li>
              <li className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                <span className="font-inter text-sm font-medium">Passive Scanning</span>
                <span className="text-xs text-muted-foreground">Isolasi Proses Latar Belakang</span>
              </li>
              <li className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                <span className="font-inter text-sm font-medium">Anti-DDoS Protection</span>
                <span className="text-xs text-muted-foreground">Didukung Cloudinary</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
