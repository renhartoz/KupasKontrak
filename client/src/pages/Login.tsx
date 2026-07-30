import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    login({ id: '1', email: 'user@example.com', tier: 'b2c_esensial' }, 'dummy-token')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="w-full max-w-md p-stack-lg border border-outline-variant bg-surface-container-lowest shadow-ambient">
        <h1 className="text-headline-lg font-playfair text-primary mb-stack-md">Log In</h1>
        <button
          onClick={handleLogin}
          className="w-full bg-primary text-on-primary py-2 font-inter text-body-md hover:bg-primary-container hover:text-on-primary-container transition-all"
        >
          Login (Mock)
        </button>
      </div>
    </div>
  )
}
