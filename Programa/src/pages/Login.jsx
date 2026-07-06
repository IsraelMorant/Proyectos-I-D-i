import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import HeroIllustration from '../components/HeroIllustration'

export default function Login() {
  const { login, showToast } = useApp()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handle = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

const submit = async (e) => {
    e.preventDefault()
    setError('') // Limpiamos errores previos

    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos.')
      return
    }
    if (!form.email.endsWith('@alumno.buap.mx')) {
      setError('Solo se permiten correos institucionales BUAP (@alumno.buap.mx).')
      return
    }
    
    setLoading(true)
    
    try {
      // Llamamos al AppContext
      const { error: authError } = await login(form.email, form.password)
      
      if (authError) {
        // Manejo de excepciones (RF02)
        if (authError.message.includes('Email not confirmed')) {
           setError('Tu cuenta aún no ha sido verificada. Revisa tu correo.')
        } else {
           // Mensaje genérico por seguridad (No distingue entre correo malo o pass malo)
           setError('Credenciales incorrectas.')
        }
        return
      }

      // Login exitoso
      showToast('¡Bienvenido de vuelta a Swap IT!')
      navigate('/')
      
    } catch (err) {
      setError('Ocurrió un error al intentar conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-brand-bgDark flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl
                      border border-brand-border/30 flex flex-col md:flex-row
                      bg-white" style={{ minHeight: 520 }}>

        {/* ── Form side ── */}
        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <SwapLogo />
            <span className="font-bold text-brand-primary text-lg"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              SwapIT
            </span>
          </div>

          <h1 className="text-3xl font-bold text-brand-primary mb-1"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Hola, de nuevo
          </h1>
          <p className="text-sm text-brand-muted mb-8">
            Bienvenido a SwapIT – ingresa tus datos
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl
                            text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="auth-label">Correo institucional</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@alumno.buap.mx"
                value={form.email}
                onChange={handle}
                className="auth-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="auth-label">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={handle}
                  className="auth-input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-brand-muted hover:text-brand-primary transition-colors"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-brand-border text-brand-secondary
                             accent-brand-secondary"
                />
                <span className="text-sm text-brand-muted">Mantener sesión</span>
              </label>
              <Link to="/recuperar"
                    className="text-sm text-brand-secondary font-medium hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin inline-block"/>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            ¿No tienes cuenta?{' '}
            <Link to="/registro"
                  className="text-brand-secondary font-semibold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* ── Illustration side ── */}
        <div className="hidden md:block w-2/5 bg-brand-gradient">
          <HeroIllustration />
        </div>
      </div>
    </div>
  )
}

function SwapLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#0B2D4E"/>
      <path d="M10 14 L16 9 L22 14" stroke="white" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M22 18 L16 23 L10 18" stroke="#2196F3" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="16" cy="16" r="2.5" fill="white" opacity="0.9"/>
    </svg>
  )
}
