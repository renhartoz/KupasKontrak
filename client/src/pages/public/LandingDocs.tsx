import { AlertTriangle, Activity, Eye, PlayCircle, Search, MessageSquare, FileText } from 'lucide-react'

export function LandingDocs() {
  return (
    <div className="w-full pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* FMEA Concept Section */}
        <div className="mb-24">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-instrument text-foreground mb-6">Bukan Sekadar Prompt AI Biasa.</h1>
            <p className="text-lg text-muted-foreground font-inter">
              KupasKontrak menggunakan metodologi <strong>FMEA (Failure Mode and Effects Analysis)</strong>—standar industri manufaktur—untuk menilai risiko hukum secara kuantitatif, bukan sekadar opini subjektif.
            </p>
          </div>

          <div className="bg-card border border-border shadow-md rounded-3xl p-8 md:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-space font-bold text-primary tracking-widest uppercase mb-4">Rumus Risiko (RPN)</h2>
              <p className="text-muted-foreground font-inter mb-6">
                Setiap klausul kontrak akan dinilai dari 3 dimensi (Skala 1-5). Ketiga nilai ini dikalikan untuk menghasilkan <strong>Risk Priority Number (RPN)</strong>. Semakin tinggi angkanya, semakin fatal klausul tersebut.
              </p>
              <div className="inline-flex items-center gap-3 bg-muted/50 border border-border/50 px-6 py-4 rounded-xl text-lg font-space font-bold">
                <span className="text-destructive">RPN</span> = 
                <span className="text-orange-500">Severity</span> × 
                <span className="text-blue-500">Occurrence</span> × 
                <span className="text-purple-500">Detectability</span>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 grid grid-cols-1 gap-4">
              <div className="bg-background border border-border p-4 rounded-xl shadow-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold font-inter text-sm text-foreground">Severity (1-5)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Seberapa parah kerugian finansial/hukum jika sanksi diterapkan?</p>
                </div>
              </div>
              <div className="bg-background border border-border p-4 rounded-xl shadow-sm flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold font-inter text-sm text-foreground">Occurrence (1-5)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Seberapa mudah denda/sanksi dieksekusi sepihak oleh perusahaan?</p>
                </div>
              </div>
              <div className="bg-background border border-border p-4 rounded-xl shadow-sm flex items-start gap-3">
                <Eye className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold font-inter text-sm text-foreground">Detectability (1-5)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Seberapa tersembunyi/rumit klausul ini ditulis dari mata awam?</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Guide Section */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-instrument text-foreground mb-4">Panduan Penggunaan</h2>
            <p className="text-muted-foreground font-inter max-w-2xl mx-auto">
              Langkah demi langkah melindungi diri Anda menggunakan ekosistem KupasKontrak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg text-primary mb-6 relative z-10">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-instrument font-medium text-foreground mb-2">1. Unggah PDF</h3>
              <p className="text-sm text-muted-foreground font-inter">
                Buka menu <strong>Scanner</strong> dan unggah draf kontrak (PDF). Sistem akan mengekstrak teks menggunakan OCR.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg text-primary mb-6 relative z-10">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-instrument font-medium text-foreground mb-2">2. Analisis FMEA</h3>
              <p className="text-sm text-muted-foreground font-inter">
                AI akan melakukan <em>Passive Scanning</em> di latar belakang untuk menilai RPN dari setiap klausul yang terdeteksi.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg text-primary mb-6 relative z-10">
                <PlayCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-instrument font-medium text-foreground mb-2">3. Lihat Hasil (Galeri)</h3>
              <p className="text-sm text-muted-foreground font-inter">
                Buka menu <strong>Galeri</strong> untuk melihat Skor Risiko keseluruhan dan membaca penjelasan awam atas klausul fatal.
              </p>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg text-primary mb-6 relative z-10">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-instrument font-medium text-foreground mb-2">4. AI Contract Editor</h3>
              <p className="text-sm text-muted-foreground font-inter">
                Diskusikan pasal yang memberatkan dengan <em>Qupy AI</em> dan hasilkan draf balasan untuk negosiasi ke HRD.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
