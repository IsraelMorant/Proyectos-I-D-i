import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Zap,
  Star,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronRight,
  Package,
  Loader2,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import { supabase } from '../supabaseClient'

function parsePublication(item) {
  let name = 'Componente'
  let description = item.descripcion || 'Sin descripción'

  const match = description.match(/^\*\*(.*?)\*\*\n\n([\s\S]*)$/)

  if (match) {
    name = match[1]
    description = match[2]
  }

  const category = Array.isArray(item.categorias)
    ? item.categorias[0]?.nombre
    : item.categorias?.nombre

  return {
    id: item.id_publicacion,
    name,
    description,
    category: category || 'Sin categoría',
    condition: item.estado_fisico ?? 1,
    tokenValue: item.valor_eco_tokens ?? 0,
    image: item.url_foto,
    status: item.estatus || 'Disponible',
    publishedAt: item.fecha_publicacion
      ? new Date(item.fecha_publicacion).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : 'Recientemente',
  }
}

function getIcon(category = '') {
  const text = category.toLowerCase()

  if (text.includes('equipo')) return '💻'
  if (text.includes('hardware')) return '🖥️'
  if (text.includes('electr')) return '⚡'
  if (text.includes('perif')) return '🖱️'

  return '🔌'
}

export default function Inventory() {
  const navigate = useNavigate()
  const { showToast, user } = useApp()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    async function loadInventory() {
      if (!user?.id) return

      setLoading(true)

      const { data, error } = await supabase
        .from('publicaciones')
        .select(`
          id_publicacion,
          descripcion,
          estado_fisico,
          valor_eco_tokens,
          url_foto,
          estatus,
          fecha_publicacion,
          categorias ( nombre )
        `)
        .eq('id_usuario', user.id)
        .eq('tipo', 'Ofrezco')
        .order('fecha_publicacion', { ascending: false })

      if (error) {
        console.error('Error al cargar inventario:', error)
        showToast('No se pudo cargar tu inventario.', 'error')
        setItems([])
      } else {
        setItems((data || []).map(parsePublication))
      }

      setLoading(false)
    }

    loadInventory()
  }, [user?.id, showToast])

  const stats = useMemo(() => ({
    total: items.length,
    available: items.filter(item => item.status === 'Disponible').length,
    inProcess: items.filter(item => item.status === 'En Proceso').length,
    inactive: items.filter(item => item.status === 'Inactivo').length,
  }), [items])
const handleDeactivate = async (id) => {
  const item = items.find(product => product.id === id)

  if (!item || !user?.id) return

  const nextStatus =
    item.status === 'Inactivo' ? 'Disponible' : 'Inactivo'

  try {
    setUpdatingId(id)

    const { data, error } = await supabase
      .from('publicaciones')
      .update({
        estatus: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id_publicacion', id)
      .eq('id_usuario', user.id)
      .select('id_publicacion, estatus')
      .single()

    if (error) throw error

    setItems(prev =>
      prev.map(product =>
        product.id === id
          ? { ...product, status: data.estatus }
          : product
      )
    )

    showToast(
      nextStatus === 'Inactivo'
        ? 'Pieza dada de baja correctamente.'
        : 'Pieza reactivada correctamente.'
    )

    setConfirm(null)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    showToast(
      error.message || 'No se pudo actualizar la publicación.',
      'error'
    )
  } finally {
    setUpdatingId(null)
  }
}

  const getStatusClass = (status) => {
    if (status === 'Disponible') return 'badge-status-available'
    if (status === 'En Proceso') return 'badge-status-process'
    return 'badge-status-inactive'
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Mi inventario</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            Gestiona las piezas que has publicado en la Bóveda
          </p>
        </div>

        <button
          onClick={() => navigate('/publicar')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient
                     text-white text-sm font-semibold shadow-md hover:brightness-110
                     active:scale-95 transition-all"
        >
          <Plus size={16} />
          Publicar pieza
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'bg-brand-primary' },
          { label: 'Disponibles', value: stats.available, color: 'bg-emerald-600' },
          { label: 'En proceso', value: stats.inProcess, color: 'bg-amber-500' },
          { label: 'Inactivas', value: stats.inactive, color: 'bg-slate-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-2.5 h-8 rounded-full flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xl font-bold text-brand-primary">{value}</p>
              <p className="text-xs text-brand-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-muted">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>Cargando inventario...</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState onPublish={() => navigate('/publicar')} />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0
                              flex items-center justify-center text-2xl bg-brand-bg">
                <span>{getIcon(item.category)}</span>

                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => e.currentTarget.remove()}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-bold text-brand-primary truncate">
                    {item.name}
                  </p>

                  <span className={getStatusClass(item.status)}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-brand-muted flex-wrap">
                  <span className="flex items-center gap-1">
                    <Zap size={11} className="text-brand-token" />
                    {Number(item.tokenValue).toLocaleString()} Tokens
                  </span>

                  <span className="flex items-center gap-1">
                    <Star size={11} className="text-amber-400" />
                    Estado {item.condition}/10
                  </span>

                  <span>Publicado {item.publishedAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => navigate(`/productos/${item.id}`)}
                  className="p-2 rounded-lg text-brand-muted hover:text-brand-secondary
                             hover:bg-brand-bg transition-colors"
                  title="Ver publicación"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  disabled={item.status === 'En Proceso'}
                  onClick={() => navigate(`/publicar?edit=${item.id}`)}
                  className="p-2 rounded-lg text-brand-muted hover:text-brand-primary
                             hover:bg-brand-bg transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>

                <button
                  disabled={item.status === 'En Proceso' || updatingId === item.id}
                  onClick={() => setConfirm(item.id)}
                  className="p-2 rounded-lg text-brand-muted hover:text-brand-danger
                             hover:bg-red-50 transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                  title={item.status === 'Inactivo' ? 'Reactivar' : 'Dar de baja'}
                >
                  {item.status === 'Inactivo'
  ? <RotateCcw size={15} />
  : <Trash2 size={15} />
}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-brand-primary mb-2">
              Confirmar acción
            </h3>

            <p className="text-sm text-brand-muted mb-5">
              ¿Deseas{' '}
              {items.find(item => item.id === confirm)?.status === 'Inactivo'
                ? 'reactivar'
                : 'dar de baja'}
              {' '}esta pieza del catálogo?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-brand-border
                           text-sm font-semibold text-brand-muted hover:bg-brand-bg"
              >
                Cancelar
              </button>

              <button
                onClick={() => handleDeactivate(confirm)}
                disabled={updatingId === confirm}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white
                           text-sm font-semibold hover:bg-brand-primaryLight
                           disabled:opacity-60"
              >
                {updatingId === confirm ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function EmptyState({ onPublish }) {
  return (
    <div className="card py-20 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center mb-4">
        <Package size={28} className="text-brand-muted" />
      </div>

      <h3 className="font-bold text-brand-primary mb-2">
        Tu inventario está vacío
      </h3>

      <p className="text-sm text-brand-muted mb-6 max-w-xs">
        Publica tus piezas en la Bóveda de Intercambio y comienza a hacer matches.
      </p>

      <button onClick={onPublish} className="btn-primary max-w-xs">
        <span className="flex items-center justify-center gap-2">
          <Plus size={16} />
          Publicar primera pieza
        </span>
      </button>
    </div>
  )
}