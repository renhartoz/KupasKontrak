import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
          <div className="w-12 h-12 bg-primary text-primary-foreground mx-auto flex items-center justify-center font-instrument text-3xl rounded-md mb-4">
            K
          </div>
          <h1 className="text-3xl font-instrument text-primary tracking-tight">Selamat Datang</h1>
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
            <Input 
              type="password"
              {...register('password')} 
              placeholder="Masukkan password"
              autoComplete="current-password"
              className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
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
