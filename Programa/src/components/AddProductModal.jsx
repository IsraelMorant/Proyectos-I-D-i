import { useState, useEffect } from 'react'
import { Upload, X, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'
import { PRODUCTS } from '../data/mockData'

const CATEGORIES = [
  { value: 'hw',   label: 'Hardware de computadora' },
  { value: 'comp', label: 'Equipos de cómputo'       },
  { value: 'elec', label: 'Componentes electrónicos' },
  { value: 'peri', label: 'Periféricos'               },
  { value: 'cable','label': 'Cables y conectores'    },
]

export default function AddProductModal() {
  const { addProductModal, closeAddProductModal, showToast } = useApp()
  const { isOpen, editId } = addProductModal

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

  const isEdit = !!editId
  const editingProduct = isEdit ? PRODUCTS.find(p => p.id === editId) : null

  useEffect(() => {
    if (!isOpen) return
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        category: editingProduct.category,
        description: editingProduct.description,
        condition: editingProduct.condition,
        tokenValue: String(editingProduct.tokenValue),
        image: null,
      })
      setPreview(null)
    } else {
      setForm({ name: '', category: '', description: '', condition: 7, tokenValue: '', image: null })
      setPreview(null)
    }
    setErrors({})
  }, [isOpen, editId, editingProduct])

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
    if (!form.name.trim())        e.name = 'El nombre es obligatorio'
    if (!form.category)           e.category = 'Selecciona una categoría'
    if (!form.description.trim()) e.description = 'Agrega una descripción'
    const tv = Number(form.tokenValue)
    if (!form.tokenValue || tv < 10 || tv > 10000)
      e.tokenValue = 'El valor debe ser entre 10 y 10,000 Eco-Tokens'
    if (!form.image && !isEdit)
      e.image = 'Se requiere al menos una fotografía'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (Object.keys(err).length) { setErrors(err); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    showToast(isEdit ? 'Pieza actualizada' : '¡Pieza publicada en la Bóveda!')
    closeAddProductModal()
    setLoading(false)
  }

  const conditionLabel = (v) =>
    v >= 9 ? 'Excelente' : v >= 7 ? 'Muy bueno' : v >= 5 ? 'Bueno' : v >= 3 ? 'Regular' : 'Deficiente'

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAddProductModal}
      title={isEdit ? 'Editar pieza' : 'Publicar nueva pieza'}
      subtitle="Completa los datos para agregar tu pieza a la Bóveda de Intercambio"
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">

        {/* Image upload */}
        <div>
          <label className="field-label">Fotografía del componente *</label>
          <p className="text-xs text-brand-muted mb-2">Formatos: .jpg / .png · Máx. 2 MB</p>

          {preview ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden bg-brand-bg">
              <img src={preview} alt="preview" className="w-full h-full object-cover"/>
              <button
                type="button"
                onClick={() => { setPreview(null); setForm(f => ({ ...f, image: null })) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50
                           text-white flex items-center justify-center hover:bg-black/70"
              >
                <X size={14}/>
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className={`flex flex-col items-center justify-center h-40 rounded-xl
                               border-2 border-dashed transition-all
                               ${errors.image
                                 ? 'border-red-400 bg-red-50'
                                 : 'border-brand-border hover:border-brand-secondary bg-brand-bg hover:bg-blue-50'}`}>
                <Upload size={24} className="text-brand-muted mb-2"/>
                <p className="text-sm font-medium text-brand-primary">Haz clic o arrastra tu foto</p>
                <p className="text-xs text-brand-muted mt-1">.jpg o .png, máx. 2 MB</p>
              </div>
              <input type="file" accept="image/jpeg,image/png" className="hidden"
                     onChange={handleImage}/>
            </label>
          )}
          {errors.image && <p className="text-xs text-red-600 mt-1">{errors.image}</p>}
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
              <option value="">Selecciona…</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="field-label">Valor en Eco-Tokens *</label>
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
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Descripción *</label>
            <textarea
              name="description" value={form.description} onChange={handle}
              rows={3}
              placeholder="Especificaciones, razón de venta, accesorios incluidos…"
              className={`field-input resize-none ${errors.description ? 'border-red-400 bg-red-50' : ''}`}
            />
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Condition slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="field-label mb-0">Estado físico *</label>
            <div className="flex items-center gap-1.5 bg-brand-primary rounded-full px-3 py-1">
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

        {form.tokenValue && !errors.tokenValue && (
          <div className="flex items-center gap-2 text-xs text-brand-success">
            <CheckCircle size={13}/>
            Valor válido: {Number(form.tokenValue).toLocaleString()} Eco-Tokens
          </div>
        )}

        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
          <AlertCircle size={15} className="text-brand-secondary flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-brand-secondary leading-relaxed">
            Al publicar aceptas que esta pieza puede participar en intercambios
            propuestos por el Motor de Match.
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={closeAddProductModal}
            className="flex-1 py-3 rounded-xl border-2 border-brand-border text-sm
                       font-semibold text-brand-muted hover:border-brand-primary
                       hover:text-brand-primary transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-sm
                       font-semibold shadow-md hover:brightness-110
                       disabled:opacity-60 disabled:cursor-not-allowed
                       active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : isEdit ? 'Guardar cambios' : 'Publicar en Bóveda'}
          </button>
        </div>
      </form>
    </Modal>
  )
}