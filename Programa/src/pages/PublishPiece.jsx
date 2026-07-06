import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, X, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import { supabase } from '../supabaseClient'


const CATEGORIES = [
  { value: 'hw',   label: 'Hardware de computadora' },
  { value: 'comp', label: 'Equipos de cómputo'       },
  { value: 'elec', label: 'Componentes electrónicos' },
  { value: 'peri', label: 'Periféricos'               },
  { value: 'cable','label': 'Cables y conectores'    },
]

export default function PublishPiece() {
  const navigate   = useNavigate()
  const { showToast } = useApp()
  const [params] = useSearchParams()
const editId = params.get('edit')
const isEdit = Boolean(editId)

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    condition: 7,
    tokenValue: '',
    image: null,
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const [loadingPublication, setLoadingPublication] = useState(isEdit)
const [existingImageUrl, setExistingImageUrl] = useState(null)

useEffect(() => {
  let cancelled = false

  async function loadPublicationToEdit() {
    if (!isEdit) {
      setLoadingPublication(false)
      return
    }

    try {
      setLoadingPublication(true)

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Debes iniciar sesión para editar una publicación.')
      }

      const { data, error } = await supabase
        .from('publicaciones')
        .select(`
          id_publicacion,
          descripcion,
          estado_fisico,
          valor_eco_tokens,
          url_foto,
          categorias ( nombre )
        `)
        .eq('id_publicacion', editId)
        .eq('id_usuario', user.id)
        .single()

      if (error || !data) {
        throw new Error('No se encontró la publicación o no tienes permiso para editarla.')
      }

      let name = 'Componente'
      let description = data.descripcion || ''

      const match = description.match(/^\*\*(.*?)\*\*\n\n([\s\S]*)$/)

      if (match) {
        name = match[1]
        description = match[2]
      }

      const categoryName = Array.isArray(data.categorias)
        ? data.categorias[0]?.nombre
        : data.categorias?.nombre

      const categoryValue = CATEGORIES.find(
        category => category.label === categoryName
      )?.value || ''

      if (!cancelled) {
        setForm({
          name,
          category: categoryValue,
          description,
          condition: data.estado_fisico ?? 7,
          tokenValue: String(data.valor_eco_tokens ?? ''),
          image: null,
        })

        setPreview(data.url_foto || null)
        setExistingImageUrl(data.url_foto || null)
      }
    } catch (error) {
      console.error('Error al cargar publicación:', error)

      if (!cancelled) {
        setErrors({
          description: error.message || 'No se pudo cargar la publicación.',
        })
        showToast(error.message || 'No se pudo cargar la publicación.', 'error')
      }
    } finally {
      if (!cancelled) {
        setLoadingPublication(false)
      }
    }
  }

  loadPublicationToEdit()

  return () => {
    cancelled = true
  }
}, [editId, isEdit, showToast])


if (loadingPublication) {
  return (
    <Layout>
      <div className="py-28 text-center text-brand-muted">
        Cargando publicación...
      </div>
    </Layout>
  )
}

  const handle = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(er => ({ ...er, [name]: '' }))
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrors(er => ({ ...er, image: 'La imagen no debe superar 2 MB' }))
      return
    }
    setForm(f => ({ ...f, image: file }))
    setPreview(URL.createObjectURL(file))
    setErrors(er => ({ ...er, image: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name = 'El nombre es obligatorio'
    if (!form.category)      e.category = 'Selecciona una categoría'
    if (!form.description.trim()) e.description = 'Agrega una descripción'
    const tv = Number(form.tokenValue)
    if (!form.tokenValue || tv < 10 || tv > 10000)
      e.tokenValue = 'El valor debe ser entre 10 y 10,000 Eco-Tokens'
   if (!form.image && !existingImageUrl) {
  e.image = 'Se requiere al menos una fotografía'
}
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
  setErrors({})

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Debes iniciar sesión para publicar una pieza.')
    }

    let imageUrl = existingImageUrl

    // Solo sube una imagen si el usuario seleccionó una nueva.
    if (form.image) {
      const fileExt = form.image.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('fotos-componentes')
        .upload(filePath, form.image, {
          contentType: form.image.type,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`No se pudo subir la foto: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage
        .from('fotos-componentes')
        .getPublicUrl(filePath)

      imageUrl = publicUrlData.publicUrl
    }

    const categoryLabel = CATEGORIES.find(
      category => category.value === form.category
    )?.label

    if (!categoryLabel) {
      throw new Error('La categoría seleccionada no es válida.')
    }

    const { data: catData, error: catError } = await supabase
      .from('categorias')
      .select('id_categoria')
      .eq('nombre', categoryLabel)
      .single()

    if (catError || !catData) {
      throw new Error(`No existe la categoría "${categoryLabel}".`)
    }

    const descripcionCompleta =
      `**${form.name.trim()}**\n\n${form.description.trim()}`

    const publicationData = {
      id_categoria: catData.id_categoria,
      descripcion: descripcionCompleta,
      estado_fisico: Number(form.condition),
      valor_eco_tokens: Number(form.tokenValue),
      url_foto: imageUrl,
      updated_at: new Date().toISOString(),
    }

    let saveError = null

    if (isEdit) {
      const { error } = await supabase
        .from('publicaciones')
        .update(publicationData)
        .eq('id_publicacion', editId)
        .eq('id_usuario', user.id)

      saveError = error
    } else {
      const { error } = await supabase
        .from('publicaciones')
        .insert({
          ...publicationData,
          id_usuario: user.id,
          tipo: 'Ofrezco',
          estatus: 'Disponible',
        })

      saveError = error
    }

    if (saveError) {
      throw new Error(
        `${isEdit ? 'No se pudo actualizar' : 'No se pudo guardar'} la publicación: ${saveError.message}`
      )
    }

    showToast(
      isEdit
        ? '¡Publicación actualizada correctamente!'
        : '¡Pieza publicada en la Bóveda!'
    )

    navigate('/inventario')
  } catch (error) {
    console.error('Error al guardar publicación:', error)

    setErrors({
      description: error.message || 'No se pudo guardar la publicación.',
    })

    showToast(error.message || 'No se pudo guardar la publicación.', 'error')
  } finally {
    setLoading(false)
  }
}
  const conditionLabel = (v) =>
    v >= 9 ? 'Excelente' : v >= 7 ? 'Muy bueno' : v >= 5 ? 'Bueno' : v >= 3 ? 'Regular' : 'Deficiente'
 
  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="section-title">{isEdit ? 'Editar pieza' : 'Publicar nueva pieza'}</h1>
          <p className="text-sm text-brand-muted mt-1">
            Completa los datos para agregar tu pieza a la Bóveda de Intercambio
          </p>
        </div>

        <form onSubmit={submit} className="space-y-6">

          {/* ── Image upload ── */}
          <div className="card p-5">
            <label className="field-label">Fotografía del componente *</label>
            <p className="text-xs text-brand-muted mb-3">Formatos: .jpg / .png · Máx. 2 MB</p>

            {preview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-brand-bg">
                <img src={preview} alt="preview"
                     className="w-full h-full object-cover"/>
                <button
                  type="button"
                 onClick={() => {
  if (form.image && existingImageUrl) {
    setForm(f => ({ ...f, image: null }))
    setPreview(existingImageUrl)
  } else {
    setForm(f => ({ ...f, image: null }))
    setPreview(null)
    setExistingImageUrl(null)
  }
}}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50
                             text-white flex items-center justify-center hover:bg-black/70"
                >
                  <X size={14}/>
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className={`flex flex-col items-center justify-center h-48 rounded-xl
                                 border-2 border-dashed transition-all
                                 ${errors.image
                                   ? 'border-red-400 bg-red-50'
                                   : 'border-brand-border hover:border-brand-secondary bg-brand-bg hover:bg-blue-50'}`}>
                  <Upload size={28} className="text-brand-muted mb-2"/>
                  <p className="text-sm font-medium text-brand-primary">Haz clic o arrastra tu foto</p>
                  <p className="text-xs text-brand-muted mt-1">.jpg o .png, máx. 2 MB</p>
                </div>
                <input type="file" accept="image/jpeg,image/png" className="hidden"
                       onChange={handleImage}/>
              </label>
            )}
            {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
          </div>

          {/* ── Basic info ── */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-brand-primary text-sm">Información básica</h3>

            <div>
              <label className="field-label">Nombre del componente *</label>
              <input
                name="name" value={form.name} onChange={handle}
                placeholder="Ej: Placa Madre ASUS B560M-A"
                className={`field-input ${errors.name ? 'border-red-400 bg-red-50' : ''}`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="field-label">Categoría *</label>
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

            <div>
              <label className="field-label">Descripción *</label>
              <textarea
                name="description" value={form.description} onChange={handle}
                rows={4}
                placeholder="Describe el componente: especificaciones, razón de venta, accesorios incluidos…"
                className={`field-input resize-none ${errors.description ? 'border-red-400 bg-red-50' : ''}`}
              />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* ── Condition & value ── */}
          <div className="card p-5 space-y-5">
            <h3 className="font-semibold text-brand-primary text-sm">Estado y valuación</h3>

            {/* Condition slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label mb-0">Estado físico *</label>
                <div className="flex items-center gap-1.5 bg-brand-primary rounded-full
                                px-3 py-1">
                  <span className="text-sm font-bold text-white">{form.condition}/10</span>
                  <span className="text-xs text-white/60">{conditionLabel(form.condition)}</span>
                </div>
              </div>
              <input
                type="range" name="condition"
                min={1} max={10} step={1}
                value={form.condition}
                onChange={handle}
                className="w-full accent-brand-secondary h-2 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-brand-muted mt-1">
                <span>Deficiente</span>
                <span>Excelente</span>
              </div>
            </div>

            {/* Token value */}
            <div>
              <label className="field-label">Valor en Eco-Tokens *</label>
              <p className="text-xs text-brand-muted mb-2">Rango permitido: 10 – 10,000 Eco-Tokens</p>
              <div className="relative">
                <Zap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-token"/>
                <input
                  type="number" name="tokenValue"
                  value={form.tokenValue} onChange={handle}
                  placeholder="Ej: 1500"
                  min={10} max={10000}
                  className={`field-input pl-10 ${errors.tokenValue ? 'border-red-400 bg-red-50' : ''}`}
                />
              </div>
              {errors.tokenValue && <p className="text-xs text-red-600 mt-1">{errors.tokenValue}</p>}

              {form.tokenValue && !errors.tokenValue && (
                <div className="mt-2 flex items-center gap-2 text-xs text-brand-success">
                  <CheckCircle size={13}/>
                  Valor válido: {Number(form.tokenValue).toLocaleString()} Eco-Tokens
                </div>
              )}
            </div>
          </div>

          {/* Info box */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200
                          rounded-xl p-4">
            <AlertCircle size={16} className="text-brand-secondary flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-brand-secondary leading-relaxed">
              Al publicar aceptas que esta pieza puede participar en intercambios
              propuestos por el Motor de Match. Las piezas quedan bloqueadas temporalmente
              mientras se negocia un trueque.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-6">
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
              className="flex-2 flex-grow py-3 px-6 rounded-xl bg-brand-gradient text-white
                         text-sm font-semibold shadow-md hover:brightness-110
                         disabled:opacity-60 disabled:cursor-not-allowed
                         active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : isEdit ? 'Guardar cambios' : 'Publicar en Bóveda'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
