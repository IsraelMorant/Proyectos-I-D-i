import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!email.endsWith('@alumno.buap.mx')) {
      setError('Solo se permiten correos institucionales BUAP (@alumno.buap.mx)')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-bgDark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10
                      border border-brand-border/30">

        <Link to="/login"
              className="inline-flex items-center gap-2 text-sm text-brand-muted
                         hover:text-brand-primary transition-colors mb-8">
          <ArrowLeft size={16}/> Volver al inicio de sesión
        </Link>

        {sent ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center
                            justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-brand-success" />
            </div>
            <h2 className="text-2xl font-bold text-brand-primary mb-2"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Correo enviado
            </h2>
            <p className="text-sm text-brand-muted mb-6">
              Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace
              para restablecer tu contraseña. Revisa también tu carpeta de spam.
            </p>
            <Link to="/login" className="btn-primary block text-center">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center
                            justify-center mb-6">
              <Mail size={24} className="text-brand-secondary" />
            </div>

            <h1 className="text-2xl font-bold text-brand-primary mb-2"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Recupera tu acceso
            </h1>
            <p className="text-sm text-brand-muted mb-8">
              Ingresa tu correo institucional y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl
                              text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label htmlFor="email" className="auth-label">Correo institucional</label>
                <input
                  id="email" type="email"
                  placeholder="usuario@alumno.buap.mx"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  className="auth-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center justify-center gap-2
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin"/>
                ) : 'Enviar enlace de recuperación'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
