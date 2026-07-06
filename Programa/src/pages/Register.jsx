import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import HeroIllustration from '../components/HeroIllustration'

export default function Register() {
  const { register, showToast } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    alerts: false, terms: false,
  })
  const [showPw, setShowPw]     = useState(false)
  const [showCp, setShowCp]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const handle = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setErrors(er => ({ ...er, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.email.endsWith('@alumno.buap.mx'))
      e.email = 'Solo se permiten correos institucionales (@alumno.buap.mx)'
    if (form.password.length < 8)
      e.password = 'La contraseña debe tener al menos 8 caracteres'
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden'
    if (!form.terms)
      e.terms = 'Debes aceptar los términos y condiciones'
    return e
  }
const submit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { 
      setErrors(err)
      return 
    }
    setLoading(true)
    
    try {
      // 1. Llamamos a la función register real que creamos en el AppContext
      const { error: authError } = await register(form.email, form.password)
      
      // 2. Si Supabase nos devuelve un error, lo mostramos
      if (authError) {
        if (authError.message.includes('already registered')) {
          setErrors({ email: 'Este correo ya tiene una cuenta registrada.' })
        } else {
          setErrors({ email: 'Hubo un error al registrar: ' + authError.message })
        }
        return
      }

      // 3. Si no hay error, todo salió bien
      showToast('¡Cuenta creada! Revisa tu correo institucional para verificarla.')
      // Lo mandamos al login para que inicie sesión cuando ya haya verificado su correo
      navigate('/login') 

    } catch (err) {
      setErrors({ email: 'Error de conexión con el servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bgDark flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl
                      border border-brand-border/30 flex flex-col md:flex-row bg-white"
           style={{ minHeight: 560 }}>

        {/* ── Form ── */}
        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <SwapLogo />
            <span className="font-bold text-brand-primary text-lg"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}>SwapIT</span>
          </div>

          <h1 className="text-3xl font-bold text-brand-primary mb-1"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Crea tu cuenta
          </h1>
          <p className="text-sm text-brand-muted mb-8">
            Únete a la comunidad de intercambio de hardware de la FCC BUAP
          </p>

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="auth-label">Correo institucional</label>
              <input
                id="email" name="email" type="email"
                placeholder="usuario@alumno.buap.mx"
                value={form.email} onChange={handle}
                className={`auth-input ${errors.email ? 'border-red-400 bg-red-50' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="auth-label">Contraseña</label>
              <div className="relative">
                <input
                  id="password" name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={handle}
                  className={`auth-input pr-11 ${errors.password ? 'border-red-400 bg-red-50' : ''}`}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-brand-muted hover:text-brand-primary">
                  {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="auth-label">Confirmar contraseña</label>
              <div className="relative">
                <input
                  id="confirmPassword" name="confirmPassword"
                  type={showCp ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword} onChange={handle}
                  className={`auth-input pr-11 ${errors.confirmPassword ? 'border-red-400 bg-red-50' : ''}`}
                />
                <button type="button" onClick={() => setShowCp(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-brand-muted hover:text-brand-primary">
                  {showCp ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-2.5 pt-1">
              <CheckboxField
                name="alerts"
                checked={form.alerts}
                onChange={handle}
                label="Recibir alertas de nuevos matches al correo"
              />
              <CheckboxField
                name="terms"
                checked={form.terms}
                onChange={handle}
                label={
                  <>
                    Acepto los{' '}
                    <a href="#" className="text-brand-secondary hover:underline">
                      términos y condiciones
                    </a>
                  </>
                }
              />
              {errors.terms && <p className="text-xs text-red-600">{errors.terms}</p>}
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
                <>
                  <CheckCircle size={16}/> Registrar cuenta
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-brand-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-secondary font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

        {/* ── Illustration ── */}
        <div className="hidden md:block w-2/5 bg-brand-gradient">
          <HeroIllustration />
        </div>
      </div>
    </div>
  )
}

function CheckboxField({ name, checked, onChange, label }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 mt-0.5 rounded border-brand-border accent-brand-secondary flex-shrink-0"
      />
      <span className="text-sm text-brand-muted group-hover:text-brand-primary transition-colors">
        {label}
      </span>
    </label>
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
