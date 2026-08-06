import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await api.post('/accounts/login/', data)
      await login(response.data.access, response.data.refresh)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password')
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
          <h1 className="text-3xl font-instrument text-foreground tracking-tight">Selamat Datang</h1>
          <p className="text-sm font-inter text-muted-foreground mt-2">Masuk ke akun KupasKontrak Anda</p>
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
              placeholder="Masukkan username"
              autoComplete="username"
              className={errors.username ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.username && <p className="text-xs text-destructive font-medium">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-space font-bold uppercase tracking-widest text-muted-foreground">Password</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"}
                {...register('password')} 
                placeholder="Masukkan password"
                autoComplete="current-password"
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

          <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-space text-xs tracking-widest uppercase mt-4">
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </Button>
        </form>

        <p className="text-center text-sm font-inter text-muted-foreground mt-6">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Daftar di sini
          </Link>
        </p>
      </Card>
    </div>
  )
}
