import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(150, 'Username maksimal 150 karakter'),
  email: z.email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"]
})

type RegisterForm = z.infer<typeof registerSchema>

export function Register() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError('')
    try {
      await api.post('/accounts/register/', {
        username: data.username,
        email: data.email,
        password: data.password,
        tier: 'b2c_esensial'
      })
      navigate('/login')
    } catch (err: any) {
      const serverErrors = err.response?.data
      if (typeof serverErrors === 'object') {
        const errorMsg = Object.values(serverErrors).flat().join(', ')
        setError(errorMsg || 'Registrasi gagal. Silakan coba lagi.')
      } else {
        setError('Registrasi gagal. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md p-8 border border-border shadow-sm rounded-xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <img src="/KupasKontrak.png" alt="KupasKontrak Logo" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
            <span className="font-instrument text-2xl text-primary font-medium tracking-tight">KupasKontrak</span>
          </Link>
          <h1 className="text-3xl font-instrument text-foreground tracking-tight">Daftar Akun</h1>
          <p className="text-sm font-inter text-muted-foreground mt-2">Mulai analisis kontrak Anda dengan AI</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-inter p-3 rounded-md mb-6 border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-space font-bold uppercase tracking-widest text-muted-foreground">Username</label>
            <Input 
              {...register('username')} 
              placeholder="Pilih username"
              className={errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.username && <p className="text-xs text-destructive font-medium">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-space font-bold uppercase tracking-widest text-muted-foreground">Email</label>
            <Input 
              type="email"
              {...register('email')} 
              placeholder="Alamat email Anda"
              className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-space font-bold uppercase tracking-widest text-muted-foreground">Password</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                {...register('password')} 
                placeholder="Buat password"
                autoComplete="new-password"
                className={errors.password ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-space font-bold uppercase tracking-widest text-muted-foreground">Konfirmasi Password</label>
            <div className="relative">
              <Input 
                type={showConfirmPassword ? "text" : "password"}
                {...register('confirmPassword')} 
                placeholder="Ulangi password"
                autoComplete="new-password"
                className={errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-space text-xs tracking-widest uppercase mt-4">
            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
          </Button>
        </form>

        <p className="text-center text-sm font-inter text-muted-foreground mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Masuk
          </Link>
        </p>
      </Card>
    </div>
  )
}
