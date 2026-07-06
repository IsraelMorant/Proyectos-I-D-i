import { useState } from 'react'
import { Search, Zap, Bell, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { value: 'hw', label: 'Hardware de computadora' },
  { value: 'comp', label: 'Equipos de cómputo' },
  { value: 'elec', label: 'Componentes electrónicos' },
  { value: 'peri', label: 'Periféricos' },
  { value: 'cable', label: 'Cables y conectores' },
]

export default function SearchPieceModal() {
  const {
    searchPieceModalOpen,
    closeSearchPieceModal,
    showToast,
  } = useApp()

  const navigate = useNavigate()

  const [form, setForm] = useState({
    category: '',
    description: '',
    maxTokens: '',
    urgent: false,
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [matchCount, setMatchCount] = useState(0)



  const handleClose = () => {
    closeSearchPieceModal()

    setTimeout(() => {
      setSuccess(false)
      setMatchCount(0)
      setForm({
        category: '',
        description: '',
        maxTokens: '',
        urgent: false,
      })
      setErrors({})
    }, 300)
  }


const handleSuccessContinue = () => {
  handleClose()

  if (matchCount > 0) {
    navigate('/matches')
  }
}

  const handle = (e) => {
    const { name, value, type, checked } = e.target

    setForm(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setErrors(current => ({
      ...current,
      [name]: '',
      form: '',
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.category) {
      nextErrors.category = 'Selecciona una categoría'
    }

    if (!form.description.trim()) {
      nextErrors.description = 'Describe el componente que buscas'
    }

    if (form.maxTokens !== '') {
      const maxTokens = Number(form.maxTokens)

      if (
        !Number.isInteger(maxTokens) ||
        maxTokens < 10 ||
        maxTokens > 10000
      ) {
        nextErrors.maxTokens =
          'El máximo debe ser un número entre 10 y 10,000 tokens'
      }
    }

    return nextErrors
  }

  const submit = async (ev) => {
    ev.preventDefault()

    const validationErrors = validate()

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Debes iniciar sesión para registrar una búsqueda.')
      }

      const categoryLabel = CATEGORIES.find(
        category => category.value === form.category
      )?.label

      const { data: categoryData, error: categoryError } = await supabase
        .from('categorias')
        .select('id_categoria')
        .eq('nombre', categoryLabel)
        .single()

      if (categoryError || !categoryData) {
        throw new Error('No se encontró la categoría seleccionada.')
      }

      const maxTokens =
        form.maxTokens === '' ? null : Number(form.maxTokens)

      const { data: newSearch, error: insertError } = await supabase
        .from('publicaciones')
        .insert({
          id_usuario: user.id,
          id_categoria: categoryData.id_categoria,
          tipo: 'Busco',
          descripcion:
            `**Busco: ${categoryLabel}**\n\n${form.description.trim()}`,
          estado_fisico: null,
          valor_eco_tokens: maxTokens,
          url_foto: null,
          es_urgente: form.urgent,
          estatus: 'Disponible',
        })
        .select('id_publicacion')
        .single()

      if (insertError) {
        throw new Error(
          `No se pudo registrar la búsqueda: ${insertError.message}`
        )
      }

      const { count, error: matchesError } = await supabase
        .from('matches')
        .select('id_match', { count: 'exact', head: true })
        .eq('id_publicacion_busco', newSearch.id_publicacion)
        .eq('estatus', 'Propuesto')

      if (matchesError) {
        console.warn('No se pudo contar coincidencias:', matchesError)
      }

      const foundMatches = count || 0

      setMatchCount(foundMatches)
      setSuccess(true)

      showToast(
        foundMatches > 0
          ? `¡Búsqueda registrada! Se encontraron ${foundMatches} coincidencia(s).`
          : 'Búsqueda registrada. Te avisaremos cuando aparezca una pieza compatible.'
      )
    } catch (error) {
      console.error('Error al registrar búsqueda:', error)

      const message =
        error.message || 'No se pudo registrar la búsqueda.'

      setErrors({ form: message })
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={searchPieceModalOpen}
      onClose={handleClose}
      title="Busco una pieza"
      subtitle="Registra qué hardware necesitas y te avisaremos cuando haya un match"
      size="md"
    >
      {success ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-brand-success" />
          </div>

          <h3 className="font-bold text-brand-primary text-lg mb-2">
            Búsqueda registrada
          </h3>

          <p className="text-sm text-brand-muted mb-6">
            {matchCount > 0
              ? `Encontramos ${matchCount} coincidencia(s) inicial(es). Revisa tus matches.`
              : 'Te notificaremos cuando aparezca una pieza compatible en la Bóveda.'}
          </p>

       <button
  onClick={() => {
    const hasMatches = matchCount > 0
    handleClose()
    if (hasMatches) navigate('/matches')
  }}
  className="btn-primary max-w-xs mx-auto"
>
  {matchCount > 0 ? 'Ver matches' : 'Entendido'}
</button>

        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5">
            <Bell size={15} className="text-brand-secondary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-secondary leading-relaxed">
              El Motor de Match busca piezas de la misma categoría, disponibles
              y dentro de tu máximo de Eco-Tokens.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {errors.form && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errors.form}
              </div>
            )}

            <div>
              <label className="field-label">Categoría del componente *</label>

              <select
                name="category"
                value={form.category}
                onChange={handle}
                className={`field-input ${
                  errors.category ? 'border-red-400 bg-red-50' : ''
                }`}
              >
                <option value="">Selecciona una categoría…</option>

                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">Descripción del componente *</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handle}
                rows={3}
                placeholder="Modelo exacto, especificaciones, compatibilidad requerida…"
                className={`field-input resize-none ${
                  errors.description ? 'border-red-400 bg-red-50' : ''
                }`}
              />

              {errors.description && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="field-label">
                Tokens máximos a pagar (opcional)
              </label>

              <div className="relative">
                <Zap
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-token"
                />

                <input
                  type="number"
                  name="maxTokens"
                  value={form.maxTokens}
                  onChange={handle}
                  placeholder="Ej: 500 (vacío = sin límite)"
                  min={10}
                  max={10000}
                  className={`field-input pl-10 ${
                    errors.maxTokens ? 'border-red-400 bg-red-50' : ''
                  }`}
                />
              </div>

              {errors.maxTokens && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.maxTokens}
                </p>
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-brand-border rounded-xl hover:border-brand-secondary hover:bg-blue-50/50 transition-all">
              <input
                type="checkbox"
                name="urgent"
                checked={form.urgent}
                onChange={handle}
                className="w-4 h-4 mt-0.5 rounded accent-brand-secondary flex-shrink-0"
              />

              <div>
                <p className="text-sm font-semibold text-brand-primary">
                  Búsqueda urgente
                </p>

                <p className="text-xs text-brand-muted mt-0.5">
                  Notifica a propietarios de piezas compatibles.
                </p>
              </div>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl border-2 border-brand-border text-sm font-semibold text-brand-muted hover:border-brand-primary hover:text-brand-primary transition-all"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-md hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Search size={15} />
                    Registrar búsqueda
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  )
}