import { Link } from 'react-router-dom'
import { ShieldAlert, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

export function LandingHome() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full pt-20 pb-32 overflow-hidden bg-secondary">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-instrument text-foreground tracking-tight leading-tight">
              Jangan Tanda Tangan <br className="hidden md:block" />
              <span className="text-primary">Sebelum Dikupas.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-inter max-w-2xl mx-auto lg:mx-0">
              Platform audit kontrak pintar untuk pekerja informal, freelancer, dan mitra. Deteksi jebakan hukum dan klausul eksploitatif dalam hitungan detik sebelum Anda menyesal.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-lg text-sm font-space uppercase tracking-widest transition-all hover:shadow-lg flex items-center justify-center gap-2">
                Coba Audit Gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/docs" className="w-full sm:w-auto bg-muted text-foreground hover:bg-muted/80 px-8 py-4 rounded-lg text-sm font-space uppercase tracking-widest transition-all">
                Pelajari Cara Kerja
              </Link>
            </div>
          </div>

          {/* Floating Card Animation UI */}
          <div className="flex-1 w-full max-w-md relative">
            <div className="relative w-full bg-card rounded-2xl border border-border shadow-2xl p-6 pb-24 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <div className="h-4 w-32 bg-muted-foreground/20 rounded"></div>
                  <div className="h-2 w-24 bg-muted-foreground/20 rounded mt-2"></div>
                </div>
              </div>
              
              <div className="space-y-4 flex-1 relative mt-2 mb-6">
                {/* Paragraph 1 - Unanalyzed/Normal */}
                <div className="space-y-2">
                  <div className="h-2.5 w-[90%] bg-muted-foreground/20 rounded"></div>
                  <div className="h-2.5 w-[95%] bg-muted-foreground/20 rounded"></div>
                  <div className="h-2.5 w-[70%] bg-muted-foreground/20 rounded"></div>
                </div>
                
                {/* Simulated Scanning Laser */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_12px_3px_rgba(var(--primary),0.6)] animate-[scan_3s_ease-in-out_infinite_alternate] z-10 pointer-events-none"></div>
                
                {/* Paragraph 2 - Analyzed (Fatal) */}
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg relative z-0">
                  <div className="flex items-center gap-2 text-destructive mb-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold font-inter">Klausul Denda Sepihak</span>
                  </div>
                  <div className="h-2 w-full bg-destructive/30 rounded mb-2"></div>
                  <div className="h-2 w-[85%] bg-destructive/30 rounded"></div>
                </div>

                {/* Paragraph 3 - Unanalyzed/Normal */}
                <div className="space-y-2">
                  <div className="h-2.5 w-[100%] bg-muted-foreground/20 rounded"></div>
                  <div className="h-2.5 w-[90%] bg-muted-foreground/20 rounded"></div>
                  <div className="h-2.5 w-[80%] bg-muted-foreground/20 rounded"></div>
                </div>

                {/* Paragraph 4 - Analyzed (Warning) */}
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg relative z-0">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold font-inter">Ambiguitas Kewajiban</span>
                  </div>
                  <div className="h-2 w-[95%] bg-orange-500/30 rounded mb-2"></div>
                  <div className="h-2 w-[60%] bg-orange-500/30 rounded"></div>
                </div>
              </div>

              {/* Floating Score Badge */}
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-md border border-border shadow-xl p-4 rounded-xl flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 rounded-full border-4 border-destructive flex items-center justify-center">
                  <span className="text-lg font-bold font-space text-destructive">89</span>
                </div>
                <div>
                  <p className="text-xs font-space uppercase tracking-widest text-muted-foreground font-bold">Skor Risiko</p>
                  <p className="text-lg font-inter font-bold text-destructive">Fatal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="w-full py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-instrument text-foreground mb-4">Realita Ketimpangan Kekuasaan</h2>
            <p className="text-muted-foreground font-inter">
              Sebagai pekerja informal, Anda sering dihadapkan pada kontrak "take it or leave it". Perusahaan memanfaatkan ketidaktahuan hukum untuk menyelipkan jebakan eksploitatif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-background/60 backdrop-blur-sm border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-instrument text-foreground mb-3 font-medium">Bahasa Hukum Manipulatif</h3>
              <p className="text-sm text-muted-foreground font-inter">
                Klausul berbahaya sering disembunyikan dalam paragraf panjang dan bahasa hukum yang rumit (teknik sandwich) untuk mengelabui pembaca awam.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-background/60 backdrop-blur-sm border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-instrument text-foreground mb-3 font-medium">Denda Tak Masuk Akal</h3>
              <p className="text-sm text-muted-foreground font-inter">
                Kontrak kemitraan sering kali menjerat dengan denda finansial ratusan juta tanpa batas maksimal (uncapped) untuk pelanggaran sepele.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-background/60 backdrop-blur-sm border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-instrument text-foreground mb-3 font-medium">Kewajiban Tanpa Hak</h3>
              <p className="text-sm text-muted-foreground font-inter">
                Kewajiban pekerja dijabarkan berhalaman-halaman (Omission), tetapi hak bayaran tidak disebutkan secara eksplisit. Sebuah indikasi perbudakan modern.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
