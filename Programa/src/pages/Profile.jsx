import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Star,
  Zap,
  Package,
  ArrowRightLeft,
  Shield,
  Edit3,
  Save,
  X,
  Loader2,
} from 'lucide-react'
import Layout from '../components/Layout'
import { useApp } from '../context/AppContext'
import { supabase } from '../supabaseClient'

function parsePublication(item) {
  let name = 'Componente'
  let description = item.descripcion || ''

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
    tokenValue: item.valor_eco_tokens ?? 0,
    image: item.url_foto,
    status: item.estatus || 'Disponible',
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

function formatTokens(value) {
  const amount = Number(value || 0)

  if (amount >= 1000) {
    const compact = amount / 1000
    return `${compact % 1 === 0 ? compact : compact.toFixed(1)}K`
  }

  return amount.toLocaleString('es-MX')
}

export default function Profile() {
  const { user, showToast } = useApp()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState({
    intercambios: 0,
    publicaciones: 0,
    tokensGanados: 0,
    reputacion: 0,
    totalValoraciones: 0,
  })
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfileData() {
      if (!user?.id) return

      setLoading(true)

      const [
        { data: profileData, error: profileError },
        { data: summaryData, error: summaryError },
        { data: publicationsData, error: publicationsError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('nombre, correo, reputacion, fecha_registro')
          .eq('id', user.id)
          .maybeSingle(),

        supabase
          .rpc('obtener_resumen_perfil')
          .single(),

        supabase
          .from('publicaciones')
          .select(`
            id_publicacion,
            descripcion,
            valor_eco_tokens,
            url_foto,
            estatus,
            fecha_publicacion,
            categorias ( nombre )
          `)
          .eq('id_usuario', user.id)
          .eq('tipo', 'Ofrezco')
          .order('fecha_publicacion', { ascending: false })
          .limit(4),
      ])

      if (profileError) {
        console.error('Error al cargar perfil:', profileError)
      }

      if (summaryError) {
        console.error('Error al cargar resumen:', summaryError)
      }

      if (publicationsError) {
        console.error('Error al cargar publicaciones:', publicationsError)
      }

      if (!active) return

      const currentProfile = {
        nombre: profileData?.nombre || user.name || user.email?.split('@')[0],
        correo: profileData?.correo || user.email,
        fechaRegistro: profileData?.fecha_registro || null,
      }

      setProfile(currentProfile)
      setName(currentProfile.nombre)

      setSummary({
        intercambios: Number(summaryData?.intercambios || 0),
        publicaciones: Number(summaryData?.publicaciones || 0),
        tokensGanados: Number(summaryData?.tokens_ganados || 0),
        reputacion: Number(summaryData?.reputacion || 0),
        totalValoraciones: Number(summaryData?.total_valoraciones || 0),
      })

      setPublications((publicationsData || []).map(parsePublication))
      setLoading(false)
    }

    loadProfileData()

    return () => {
      active = false
    }
  }, [user?.id, user?.email, user?.name])

  const saveProfile = async () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      showToast('Escribe un nombre válido.', 'error')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: trimmedName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(current => ({
        ...current,
        nombre: trimmedName,
      }))

      showToast('Perfil actualizado correctamente.')
      setEditing(false)
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
      showToast(error.message || 'No se pudo actualizar el perfil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const reputation = summary.reputacion

  const stats = [
    {
      icon: <ArrowRightLeft size={18} />,
      label: 'Intercambios',
      value: summary.intercambios.toLocaleString('es-MX'),
    },
    {
      icon: <Package size={18} />,
      label: 'Publicaciones',
      value: summary.publicaciones.toLocaleString('es-MX'),
    },
    {
      icon: <Zap size={18} />,
      label: 'Tokens ganados',
      value: formatTokens(summary.tokensGanados),
    },
    {
      icon: <Star size={18} />,
      label: 'Reputación',
      value: reputation.toFixed(1),
    },
  ]

  const memberSince = profile?.fechaRegistro
    ? new Date(profile.fechaRegistro).toLocaleDateString('es-MX', {
        month: 'long',
        year: 'numeric',
      })
    : 'recientemente'

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-28 text-brand-muted">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>Cargando perfil...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl space-y-5">

        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center
                         justify-center text-white text-3xl font-black flex-shrink-0"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {profile?.nombre?.[0]?.toUpperCase() || 'U'}
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="field-input text-lg font-bold"
                    maxLength={100}
                  />

                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="p-2 rounded-lg bg-brand-success text-white hover:brightness-110 disabled:opacity-60"
                  >
                    {saving
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Save size={15} />
                    }
                  </button>

                  <button
                    onClick={() => {
                      setName(profile?.nombre || '')
                      setEditing(false)
                    }}
                    className="p-2 rounded-lg border border-brand-border text-brand-muted hover:bg-brand-bg"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1
                    className="text-xl font-bold text-brand-primary"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {profile?.nombre}
                  </h1>

                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-bg"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              )}

              <p className="text-sm text-brand-muted mb-2">
                {profile?.correo}
              </p>

              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 w-fit">
                <Shield size={12} className="text-brand-success" />
                <span className="text-[11px] font-semibold text-brand-success">
                  Verificado @alumno.buap.mx
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-brand-border/50">
            <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">
              Reputación
            </p>

            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    size={22}
                    className={
                      i <= Math.round(reputation)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-brand-border fill-brand-border'
                    }
                  />
                ))}
              </div>

              <span
                className="text-2xl font-black text-brand-primary"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {reputation.toFixed(1)}
              </span>

              <span className="text-sm text-brand-muted">
                / 5 · {summary.totalValoraciones} valoraciones
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-brand-secondary mx-auto mb-2">
                {icon}
              </div>

              <p
                className="text-xl font-black text-brand-primary"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {value}
              </p>

              <p className="text-xs text-brand-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-brand-primary text-base">
              Mis publicaciones
            </h2>

            <button
              onClick={() => navigate('/inventario')}
              className="text-xs text-brand-secondary font-semibold hover:underline"
            >
              Ver todo
            </button>
          </div>

          {publications.length === 0 ? (
            <div className="py-8 text-center text-sm text-brand-muted">
              Todavía no tienes publicaciones.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {publications.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(`/productos/${item.id}`)}
                  className="rounded-xl overflow-hidden border border-brand-border hover:border-brand-secondary transition-all hover:shadow-md group"
                >
                  <div className="relative h-20 flex items-center justify-center text-2xl bg-brand-bg">
                    <span>{getIcon(item.category)}</span>

                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={e => e.currentTarget.remove()}
                      />
                    )}
                  </div>

                  <div className="p-2 text-left">
                    <p className="text-[11px] font-bold text-brand-primary line-clamp-1 group-hover:text-brand-secondary transition-colors">
                      {item.name}
                    </p>

                    <p className="text-[10px] text-brand-token flex items-center gap-0.5 mt-0.5">
                      <Zap size={9} />
                      {Number(item.tokenValue).toLocaleString('es-MX')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-brand-primary mb-4">
            Ajustes de cuenta
          </h2>

          <div className="space-y-1">
            {[
              {
                label: 'Cambiar contraseña',
                action: () => navigate('/recuperar'),
              },
              {
                label: 'Preferencias de notificaciones',
                action: () => showToast('Próximamente'),
              },
              {
                label: 'Política de privacidad',
                action: () => showToast('Próximamente'),
              },
              {
                label: 'Términos y condiciones',
                action: () => showToast('Próximamente'),
              },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-brand-text hover:bg-brand-bg transition-colors text-left"
              >
                {label}
                <span className="text-brand-muted">›</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-brand-muted pb-4">
          Miembro desde {memberSince} · FCC BUAP
        </p>
      </div>
    </Layout>
  )
}