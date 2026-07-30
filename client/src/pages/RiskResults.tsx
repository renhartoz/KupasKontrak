import { AlertTriangle, Lightbulb, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SecurePdfViewer } from '@/components/audit-result/SecurePdfViewer'

export function RiskResults() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-display-sm font-playfair text-primary font-bold mb-2">Hasil Pemindaian</h1>
          <p className="text-body-md font-inter text-muted-foreground max-w-xl">
            Analisis risiko detail untuk Master_Service_Agreement_v2.pdf. Tinjau klausul yang disorot dan saran tindakan.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Button variant="outline" className="border-border text-foreground hover:bg-muted font-inter">
            Ekspor Laporan
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-inter">
            Buka di Editor
          </Button>
        </div>
      </div>

      {/* Split Section: Overall Score & PDF Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
        {/* Left: Overall Score */}
        <Card className="lg:col-span-4 bg-card border-border shadow-sm p-8 flex flex-col items-center rounded-xl">
          <p className="text-label-sm font-space text-on-surface-variant uppercase tracking-widest font-bold mb-8 self-start">Skor Risiko Keseluruhan</p>
          
          <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
            {/* Mock Donut Chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-surface-variant)" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-error)" strokeWidth="10" strokeDasharray="251" strokeDashoffset="70" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-display-sm font-playfair font-bold text-on-surface">72</span>
              <span className="text-body-sm font-inter text-on-surface-variant border-t border-outline-variant pt-1">/ 100</span>
            </div>
          </div>

          <div className="bg-error-container text-error px-6 py-2 flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-label-sm font-space uppercase tracking-widest font-bold">Risiko Tinggi</span>
          </div>

          <p className="text-body-sm font-inter text-on-surface-variant text-center mb-8 leading-relaxed">
            Kontrak ini mengandung klausul kritis yang mengekspos perusahaan Anda pada kewajiban hukum yang signifikan dan kondisi pengakhiran yang ambigu.
          </p>

          <div className="w-full space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-inter text-on-surface">Masalah Eksploitatif</span>
              <div className="w-6 h-6 rounded-full bg-error text-white flex items-center justify-center text-label-sm font-bold">1</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-inter text-on-surface">Klausul Ambigu</span>
              <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-label-sm font-bold">3</div>
            </div>
          </div>
        </Card>

        {/* Right: PDF Viewer */}
        <div className="lg:col-span-8 h-full">
          <SecurePdfViewer signedUrl="mock-url" title="Master Service Agreement.pdf" />
        </div>
      </div>

      {/* Your Obligations at a Glance */}
      <div>
        <h2 className="text-headline-md font-playfair text-primary font-bold mb-6">Sekilas Kewajiban Anda</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Tabs */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <div className="bg-card border border-border border-l-4 border-l-destructive shadow-sm p-4 cursor-pointer relative rounded-r-lg">
              <h3 className="text-body-md font-bold font-inter text-on-surface mb-1">Ganti Rugi Tanpa Batas</h3>
              <p className="text-body-sm font-inter text-on-surface-variant line-clamp-2">
                Bagian 2.1 membuka kemungkinan perusahaan Anda menghadapi kerugian tak terbatas dari pihak ketiga...
              </p>
            </div>
            
            <div className="bg-muted border-l-4 border-l-secondary shadow-sm p-4 cursor-pointer opacity-70 hover:opacity-100 transition-opacity rounded-r-lg">
              <h3 className="text-body-md font-bold font-inter text-foreground mb-1">Periode Pemulihan Pendek</h3>
              <p className="text-body-sm font-inter text-on-surface-variant line-clamp-2">
                5 hari untuk memulihkan pelanggaran material sangat tidak lazim dan menyulitkan secara operasional...
              </p>
            </div>
          </div>

          {/* Right Detail */}
          <div className="md:col-span-8">
            <Card className="bg-card shadow-sm p-8 border-border rounded-xl">
              <div className="flex items-center gap-2 text-destructive mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-label-sm font-space uppercase tracking-widest font-bold">Risiko Tinggi</span>
              </div>
              
              <h3 className="text-headline-md font-playfair font-bold text-on-surface mb-8">Ganti Rugi Tanpa Batas</h3>
              
              {/* How it will play out */}
              <div className="bg-primary-fixed-dim/20 p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary text-white flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h4 className="text-body-lg font-bold font-inter text-primary">Apa dampaknya</h4>
                </div>
                <p className="text-body-md font-inter text-primary/90 leading-relaxed ml-11">
                  Jika pihak ketiga menuntut Klien dengan klaim bahwa perangkat lunak Anda melanggar paten mereka, Anda diwajibkan untuk menanggung semua biaya hukum, penyelesaian, dan ganti rugi tanpa batas maksimal secara finansial. Ini bisa dengan mudah melebihi total nilai kontrak.
                </p>
              </div>

              {/* Recommended Action */}
              <div className="bg-secondary-fixed-dim/20 p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-secondary text-white flex items-center justify-center">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="text-body-lg font-bold font-inter text-secondary">Tindakan Disarankan</h4>
                </div>
                <p className="text-body-md font-inter text-secondary/90 leading-relaxed ml-11 mb-4">
                  Usulkan amandemen untuk membatasi kewajiban ganti rugi maksimal sebesar total biaya yang dibayarkan dalam 12 bulan terakhir, atau jumlah tetap yang disepakati bersama (misalnya $1M), yang tercakup oleh asuransi kewajiban siber Anda.
                </p>
                <div className="ml-11">
                  <Button className="bg-secondary text-white hover:bg-secondary/90 font-inter text-label-sm uppercase tracking-widest rounded-none">
                    Terapkan Saran AI ke Editor
                  </Button>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer mt-8">
                <input type="checkbox" className="w-5 h-5 border-outline-variant rounded-none text-primary focus:ring-primary" />
                <span className="text-body-md font-inter text-on-surface-variant">Tandai sudah diselesaikan</span>
              </label>

            </Card>
          </div>

        </div>
      </div>

      {/* Risk Category Breakdown */}
      <div>
        <h2 className="text-headline-md font-playfair text-primary font-bold mb-6">Rincian Kategori Risiko</h2>
        <div className="bg-card shadow-sm overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted text-foreground font-space text-label-sm uppercase tracking-widest">
                <th className="py-4 px-6 font-bold">Kategori</th>
                <th className="py-4 px-6 font-bold text-center">Tingkat Risiko</th>
                <th className="py-4 px-6 font-bold text-center">Skor</th>
                <th className="py-4 px-6 font-bold">Kekhawatiran Utama</th>
              </tr>
            </thead>
            <tbody className="font-inter text-body-sm text-foreground">
              <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-5 px-6 font-bold flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  Liabilitas
                </td>
                <td className="py-5 px-6 text-center">
                  <span className="inline-block bg-error-container text-error px-3 py-1 font-space text-label-sm font-bold tracking-widest uppercase">Tinggi</span>
                </td>
                <td className="py-5 px-6 text-center text-error font-bold text-body-lg">88</td>
                <td className="py-5 px-6 text-on-surface-variant">Ganti rugi tanpa batas; batasan tanggung jawab asimetris yang menguntungkan Klien.</td>
              </tr>
              <tr className="border-b border-outline-variant hover:bg-surface-variant/50 transition-colors">
                <td className="py-5 px-6 font-bold flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  Kekayaan Intelektual
                </td>
                <td className="py-5 px-6 text-center">
                  <span className="inline-block bg-secondary-container text-secondary px-3 py-1 font-space text-label-sm font-bold tracking-widest uppercase">Sedang</span>
                </td>
                <td className="py-5 px-6 text-center text-secondary font-bold text-body-lg">65</td>
                <td className="py-5 px-6 text-on-surface-variant">Definisi samar mengenai kepemilikan IP pra-ada vs hasil kerja.</td>
              </tr>
              <tr className="border-b border-outline-variant hover:bg-surface-variant/50 transition-colors">
                <td className="py-5 px-6 font-bold flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  Pengakhiran
                </td>
                <td className="py-5 px-6 text-center">
                  <span className="inline-block bg-secondary-container text-secondary px-3 py-1 font-space text-label-sm font-bold tracking-widest uppercase">Sedang</span>
                </td>
                <td className="py-5 px-6 text-center text-secondary font-bold text-body-lg">52</td>
                <td className="py-5 px-6 text-on-surface-variant">Periode 3 hari untuk pemulihan pelanggaran material; pemutusan kerja sepihak sewenang-wenang.</td>
              </tr>
              <tr className="hover:bg-surface-variant/50 transition-colors">
                <td className="py-5 px-6 font-bold flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                  Kepatuhan
                </td>
                <td className="py-5 px-6 text-center">
                  <span className="inline-block bg-tertiary-container text-tertiary px-3 py-1 font-space text-label-sm font-bold tracking-widest uppercase">Rendah</span>
                </td>
                <td className="py-5 px-6 text-center text-tertiary font-bold text-body-lg">12</td>
                <td className="py-5 px-6 text-on-surface-variant">Klausul GDPR dan perlindungan data standar memenuhi persyaratan saat ini.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
