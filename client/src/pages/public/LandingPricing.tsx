import { Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LandingPricing() {
  return (
    <div className="w-full pt-20 pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-instrument text-foreground mb-6">Investasi Kecil untuk Keadilan Hukum Anda.</h1>
          <p className="text-lg text-muted-foreground font-inter">
            Pilih paket yang sesuai dengan kebutuhan Anda. Kami merancang harga yang terjangkau bagi para freelancer dan pekerja independen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Tier 1 */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col relative overflow-hidden">
            <h3 className="text-xl font-instrument font-medium text-foreground mb-2">Pejuang</h3>
            <p className="text-sm text-muted-foreground font-inter mb-6 h-10">Untuk pemula yang ingin memastikan keamanan kontrak dasar.</p>
            <div className="mb-8">
              <span className="text-4xl font-space font-bold text-foreground">Gratis</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">3x Scan Dokumen / bulan</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">Ringkasan Klausul Bahasa Awam</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">Skor Risiko Keseluruhan</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-inter text-muted-foreground">Rincian RPN FMEA per Pasal</span>
              </li>
              <li className="flex items-start gap-3 opacity-50">
                <X className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm font-inter text-muted-foreground">AI Contract Editor (Qupy)</span>
              </li>
            </ul>

            <Link to="/register" className="w-full py-3 px-4 rounded-xl border border-primary text-primary text-center font-space uppercase tracking-widest text-sm font-bold hover:bg-primary/5 transition-colors mt-auto">
              Mulai Gratis
            </Link>
          </div>

          {/* Tier 2 */}
          <div className="bg-primary/5 border border-primary/30 rounded-3xl p-8 shadow-lg flex flex-col relative overflow-hidden transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-primary"></div>
            <div className="absolute top-4 right-4 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold font-space uppercase tracking-widest">
              Rekomendasi
            </div>
            
            <h3 className="text-xl font-instrument font-medium text-foreground mb-2">Profesional</h3>
            <p className="text-sm text-muted-foreground font-inter mb-6 h-10">Perlindungan hukum maksimal bagai didampingi pengacara.</p>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl font-space font-bold text-primary">Rp49.000</span>
              <span className="text-muted-foreground text-sm font-inter">/ bulan</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground font-medium">Unlimited Scan & OCR Dokumen</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground font-medium">Rincian FMEA (RPN) per Pasal</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground font-medium">AI Contract Editor (Revisi Draf)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground font-medium">Referensi Yurisprudensi Hukum</span>
              </li>
            </ul>

            <Link to="/register" className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-center font-space uppercase tracking-widest text-sm font-bold hover:bg-primary/90 transition-colors mt-auto shadow-md">
              Pilih Profesional
            </Link>
          </div>

          {/* Tier 3 */}
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm flex flex-col relative overflow-hidden">
            <h3 className="text-xl font-instrument font-medium text-foreground mb-2">Enterprise</h3>
            <p className="text-sm text-muted-foreground font-inter mb-6 h-10">Solusi terintegrasi untuk tim legal perusahaan skala besar.</p>
            <div className="mb-8">
              <span className="text-3xl font-space font-bold text-foreground">Hubungi Kami</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">API Integration (White-label)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">Bulk Processing (Ribuan Dokumen)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">Custom Ruleset Analisis Legal</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-inter text-foreground">Dedicated Account Manager</span>
              </li>
            </ul>

            <a 
              href="mailto:aaron.hartono@binus.ac.id?subject=Perihal%20KupasKontrak" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl border border-border text-foreground text-center font-space uppercase tracking-widest text-sm font-bold hover:bg-muted transition-colors mt-auto"
            >
              Email Sales
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
