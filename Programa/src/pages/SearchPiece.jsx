import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Zap, Bell, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'

const CATEGORIES = [
  { value: 'hw',   label: 'Hardware de computadora' },
  { value: 'comp', label: 'Equipos de cómputo'       },
  { value: 'elec', label: 'Componentes electrónicos' },
  { value: 'peri', label: 'Periféricos'               },
  { value: 'cable','label': 'Cables y conectores'    },
]

export default function SearchPiece() {
  const navigate      = useNavigate()
  const { showToast } = useApp()

  const [form, setForm] = useState({
    category: '',
    description: '',
    maxTokens: '',
    urgent: false,
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handle = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setErrors(er => ({ ...er, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.category)           e.category = 'Selecciona una categoría'
    if (!form.description.trim()) e.description = 'Describe el componente que buscas'
    return e
  }

  const submit = async (ev) => {
    ev.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSuccess(true)
  }

  if (success) return (
    <Layout>
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center
                        justify-center mx-auto mb-5">
          <CheckCircle size={38} className="text-brand-success"/>
        </div>
        <h2 className="text-2xl font-bold text-brand-primary mb-2"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Búsqueda registrada
        </h2>
        <p className="text-sm text-brand-muted mb-2">
          Hemos registrado tu solicitud. Te notificaremos por correo cuando
          aparezca una pieza compatible en la Bóveda.
        </p>
        <p className="text-xs text-brand-muted mb-8">
          También puedes revisar la Bóveda manualmente en cualquier momento.
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/productos')} className="btn-primary">
            <span className="flex items-center justify-center gap-2">
              <Search size={16}/> Explorar la Bóveda ahora
            </span>
          </button>
          <button onClick={() => setSuccess(false)}
                  className="btn-secondary">
            Registrar otra búsqueda
          </button>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="section-title">Busco una pieza</h1>
          <p className="text-sm text-brand-muted mt-1">
            Registra qué hardware necesitas. El sistema buscará coincidencias
            automáticamente y te avisará cuando haya un match.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200
                        rounded-2xl p-4 mb-6">
          <Bell size={17} className="text-brand-secondary flex-shrink-0 mt-0.5"/>
          <div className="text-xs text-brand-secondary leading-relaxed">
            <p className="font-semibold mb-0.5">¿Cómo funciona?</p>
            <p>El Motor de Match compara tu solicitud con las piezas disponibles.
               Si existe coincidencia inmediata, recibirás una propuesta de trueque al instante.
               Si no, quedará en espera activa.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* Category */}
          <div>
            <label className="field-label">Categoría del componente *</label>
            <select
              name="category" value={form.category} onChange={handle}
              className={`field-input ${errors.category ? 'border-red-400 bg-red-50' : ''}`}
            >
              <option value="">Selecciona una categoría…</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="field-label">Descripción del componente *</label>
            <textarea
              name="description" value={form.description} onChange={handle}
              rows={4} placeholder="Describe lo que necesitas: modelo exacto, especificaciones, compatibilidad requerida…"
              className={`field-input resize-none ${errors.description ? 'border-red-400 bg-red-50' : ''}`}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>

          {/* Max tokens */}
          <div>
            <label className="field-label">Tokens máximos a pagar (opcional)</label>
            <p className="text-xs text-brand-muted mb-2">
              Si el intercambio es asimétrico, ¿cuántos Eco-Tokens estás dispuesto a agregar?
            </p>
            <div className="relative">
              <Zap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-token"/>
              <input
                type="number" name="maxTokens"
                value={form.maxTokens} onChange={handle}
                placeholder="Ej: 500 (dejar vacío = sin límite)"
                min={0} max={10000}
                className="field-input pl-10"
              />
            </div>
          </div>

          {/* Urgent */}
          <label className="flex items-start gap-3 cursor-pointer group p-4
                             border border-brand-border rounded-xl hover:border-brand-secondary
                             hover:bg-blue-50/50 transition-all">
            <input
              type="checkbox" name="urgent"
              checked={form.urgent} onChange={handle}
              className="w-4 h-4 mt-0.5 rounded accent-brand-secondary flex-shrink-0"
            />
            <div>
              <p className="text-sm font-semibold text-brand-primary group-hover:text-brand-secondary transition-colors">
                Búsqueda urgente
              </p>
              <p className="text-xs text-brand-muted mt-0.5">
                Prioriza tu solicitud en el Motor de Match y envía notificaciones a
                usuarios con piezas compatibles.
              </p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-xl border-2 border-brand-border text-sm
                         font-semibold text-brand-muted hover:border-brand-primary
                         hover:text-brand-primary transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-grow py-3 px-6 rounded-xl bg-brand-gradient text-white
                         text-sm font-semibold shadow-md hover:brightness-110
                         disabled:opacity-60 flex items-center justify-center gap-2
                         active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : (
                <><Search size={15}/> Registrar búsqueda</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
