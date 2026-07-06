import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRightLeft,
  CheckCircle,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  Star,
  XCircle,
  Zap,
} from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/AppContext'

const MATCH_SELECT = `
  id_match,
  estatus,
  compensacion_tokens,
  direccion_compensacion,
  acepto_usuario_a,
  acepto_usuario_b,
  fecha_propuesta,
  fecha_cierre,
  id_publicacion_contraoferta,
  oferta:publicaciones!matches_id_publicacion_ofrezco_fkey (
    id_publicacion,
    id_usuario,
    descripcion,
    estado_fisico,
    valor_eco_tokens,
    url_foto,
    estatus,
    categorias ( nombre ),
    autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo, reputacion )
  ),
  busqueda:publicaciones!matches_id_publicacion_busco_fkey (
    id_publicacion,
    id_usuario,
    descripcion,
    estado_fisico,
    valor_eco_tokens,
    url_foto,
    estatus,
    categorias ( nombre ),
    autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo, reputacion )
  ),
  contraoferta:publicaciones!matches_id_publicacion_contraoferta_fkey (
    id_publicacion,
    id_usuario,
    descripcion,
    estado_fisico,
    valor_eco_tokens,
    url_foto,
    estatus,
    categorias ( nombre ),
    autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo, reputacion )
  )
`

function relationOne(value) {
  return Array.isArray(value) ? value[0] : value
}

function formatDisplayName(value = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''

  return raw
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getOwnerId(relation) {
  return relationOne(relation)?.id_usuario || null
}

async function fetchProfileNames(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return {}

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, correo')
    .in('id', uniqueIds)

  if (error) {
    console.warn('No se pudieron resolver los nombres de perfiles:', error)
    return {}
  }

  return Object.fromEntries(
    (data || []).map(profile => [
      profile.id,
      formatDisplayName(profile.nombre || profile.correo?.split('@')[0]),
    ])
  )
}

function parsePublication(item) {
  const publication = relationOne(item)

  let name = 'Componente'
  let description = publication?.descripcion || 'Sin descripción'
  const titleMatch = description.match(/^\*\*(.*?)\*\*\n\n([\s\S]*)$/)

  if (titleMatch) {
    name = titleMatch[1]
    description = titleMatch[2]
  }

  const category = relationOne(publication?.categorias)
  const author = relationOne(publication?.autor)

  return {
    id: publication?.id_publicacion || null,
    ownerId: publication?.id_usuario || null,
    name,
    description,
    category: category?.nombre || 'Sin categoría',
    condition: Number(publication?.estado_fisico || 0),
    tokenValue: Number(publication?.valor_eco_tokens || 0),
    image: publication?.url_foto || null,
    status: publication?.estatus || 'Disponible',
    authorName: formatDisplayName(
      author?.nombre || author?.correo?.split('@')[0]
    ),
    authorReputation: Number(author?.reputacion || 0),
  }
}

function toMatchView(row, userId, profileNames = {}) {
  const offerItem = parsePublication(row.oferta)
  const requestItem = parsePublication(row.busqueda)
  const counterOfferItem = parsePublication(row.contraoferta)
  const isOfferOwner = offerItem.ownerId === userId

  const counterpartId = isOfferOwner
    ? requestItem.ownerId
    : offerItem.ownerId

  const nestedName = isOfferOwner
    ? requestItem.authorName
    : offerItem.authorName

  const counterpartReputation = isOfferOwner
    ? requestItem.authorReputation
    : offerItem.authorReputation

  const youPay =
    row.direccion_compensacion === 'B_a_A'
      ? !isOfferOwner
      : row.direccion_compensacion === 'A_a_B'
        ? isOfferOwner
        : false

  return {
    id: row.id_match,
    status: row.estatus,
    compensation: Number(row.compensacion_tokens || 0),
    direction: row.direccion_compensacion,
    offerItem,
    requestItem,
    counterOfferItem,
    isDirectExchange: Boolean(row.id_publicacion_contraoferta && counterOfferItem.id),
    counterpart: {
      id: counterpartId,
      name: profileNames[counterpartId] || nestedName || 'Usuario SwapIT',
      reputation: counterpartReputation,
    },
    isOfferOwner,
    myAccepted: isOfferOwner
      ? Boolean(row.acepto_usuario_a)
      : Boolean(row.acepto_usuario_b),
    counterpartAccepted: isOfferOwner
      ? Boolean(row.acepto_usuario_b)
      : Boolean(row.acepto_usuario_a),
    proposedAt: row.fecha_propuesta,
    closedAt: row.fecha_cierre,
    youPay,
  }
}

function getIcon(category = '') {
  const normalized = String(category).toLowerCase()
  if (normalized.includes('equipo')) return '💻'
  if (normalized.includes('hardware')) return '🖥️'
  if (normalized.includes('electr')) return '⚡'
  if (normalized.includes('perif')) return '🖱️'
  return '🔌'
}

function ItemThumbnail({ item, className = '' }) {
  return (
    <div
      className={`relative overflow-hidden bg-brand-bg flex items-center justify-center ${className}`}
    >
      <span className="text-2xl">{getIcon(item?.category)}</span>
      {item?.image && (
        <img
          src={item.image}
          alt={item.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={event => event.currentTarget.remove()}
        />
      )}
    </div>
  )
}

function MatchStatus({ status }) {
  const className =
    status === 'Propuesto'
      ? 'badge-status-process'
      : status === 'En Proceso'
        ? 'badge-status-available'
        : 'badge-status-inactive'

  return <span className={className}>{status}</span>
}

function ChatButton({ matchId, className = '' }) {
  const { openChatWindow } = useApp()
  const navigate = useNavigate()

  const handleOpen = () => {
    if (window.innerWidth >= 768) {
      openChatWindow(matchId)
    } else {
      navigate(`/chat/${matchId}`)
    }
  }

  return (
    <button
      onClick={handleOpen}
      className={
        className ||
        `flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-bg
         text-brand-primary text-xs font-semibold border border-brand-border
         hover:bg-brand-bgDark transition-colors`
      }
    >
      <MessageCircle size={14} />
      Chat
    </button>
  )
}

function PublishButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/publicar')}
      className="btn-primary max-w-xs px-6 py-2.5 text-sm"
    >
      Publicar pieza
    </button>
  )
}

export function MatchesList() {
  const { user } = useApp()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  const loadMatches = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .in('estatus', ['Propuesto', 'En Proceso', 'Finalizado'])
        .order('fecha_propuesta', { ascending: false })

      if (error) throw error

      const profileNames = await fetchProfileNames(
        (data || []).flatMap(row => [
          getOwnerId(row.oferta),
          getOwnerId(row.busqueda),
          getOwnerId(row.contraoferta),
        ])
      )

      setMatches(
        (data || []).map(row => toMatchView(row, user.id, profileNames))
      )
    } catch (error) {
      console.error('Error al cargar matches:', error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void loadMatches()
  }, [loadMatches])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`matches-list-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => void loadMatches()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, loadMatches])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="section-title">Mis matches</h1>
        <p className="text-sm text-brand-muted mt-1">
          Propuestas de intercambio activas, en proceso y finalizadas
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-muted">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>Cargando matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="card py-20 text-center">
          <p className="text-4xl mb-4">🔄</p>
          <p className="font-semibold text-brand-primary mb-2">
            Sin matches por ahora
          </p>
          <p className="text-sm text-brand-muted mb-6">
            Publica tus piezas o registra búsquedas para comenzar a recibir propuestas.
          </p>
          <PublishButton />
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </Layout>
  )
}

function MatchCard({ match }) {
  const secondItem = match.isDirectExchange
    ? match.counterOfferItem
    : match.requestItem

  const compensationLabel =
    match.compensation > 0
      ? `${match.youPay ? 'Pagas' : 'Recibes'} ${match.compensation.toLocaleString('es-MX')} Tokens`
      : null

  return (
    <Link
      to={`/match/${match.id}`}
      className="card-hover flex items-center gap-4 p-4"
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <ItemThumbnail item={match.offerItem} className="w-12 h-12 rounded-xl" />
        <div className="w-7 h-7 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center">
          <ArrowRightLeft size={13} className="text-brand-muted" />
        </div>
        <ItemThumbnail item={secondItem} className="w-12 h-12 rounded-xl" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-bold text-brand-primary truncate">
            {match.offerItem.name}
          </p>
          <ArrowRightLeft size={11} className="text-brand-muted flex-shrink-0" />
          <p className="text-sm font-bold text-brand-primary truncate">
            {secondItem.name}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-brand-muted flex-wrap">
          <MatchStatus status={match.status} />
          {compensationLabel && (
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-brand-token" />
              {compensationLabel}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock size={10} />
            con {match.counterpart.name}
          </span>
        </div>
      </div>

      <ChevronRight size={16} className="text-brand-muted flex-shrink-0" />
    </Link>
  )
}

export function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, showToast, openChatWindow, openRatingModal } = useApp()

  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [checkingRating, setCheckingRating] = useState(false)

  const loadMatch = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('id_match', id)
        .single()

      if (error || !data) {
        console.error('Error al cargar match:', error)
        setMatch(null)
        setAlreadyRated(false)
        return
      }

      const profileNames = await fetchProfileNames([
        getOwnerId(data.oferta),
        getOwnerId(data.busqueda),
        getOwnerId(data.contraoferta),
      ])

      setMatch(toMatchView(data, user.id, profileNames))

      if (data.estatus === 'Finalizado') {
        setCheckingRating(true)

        const { data: ratingData, error: ratingError } = await supabase
          .from('evaluaciones')
          .select('id_evaluacion')
          .eq('id_match', id)
          .eq('id_evaluador', user.id)
          .maybeSingle()

        if (ratingError) {
          console.error('Error al revisar la evaluación:', ratingError)
        }

        setAlreadyRated(Boolean(ratingData))
        setCheckingRating(false)
      } else {
        setAlreadyRated(false)
        setCheckingRating(false)
      }
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    void loadMatch()
  }, [loadMatch])

  useEffect(() => {
    const handleRatingSaved = event => {
      if (event.detail?.matchId === id) {
        setAlreadyRated(true)
      }
    }

    window.addEventListener('swapit-rating-saved', handleRatingSaved)

    return () => {
      window.removeEventListener('swapit-rating-saved', handleRatingSaved)
    }
  }, [id])

  useEffect(() => {
    if (!id) return undefined

    const channel = supabase
      .channel(`match-detail-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id_match=eq.${id}`,
        },
        () => void loadMatch()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, loadMatch])

  const goToChat = () => {
    if (window.innerWidth >= 768) {
      openChatWindow(id)
    } else {
      navigate(`/chat/${id}`)
    }
  }

  const respond = async accept => {
    setActionLoading(accept ? 'accept' : 'reject')

    try {
      const { data, error } = await supabase.rpc('responder_match', {
        p_match_id: id,
        p_aceptar: accept,
      })

      if (error) throw error

      const result = Array.isArray(data) ? data[0] : data

      if (!accept) {
        showToast('Propuesta rechazada.')
        navigate('/matches')
        return
      }

      if (result?.estado === 'En Proceso') {
        showToast('¡Ambos aceptaron! El chat de entrega está habilitado.')
        await loadMatch()
        goToChat()
      } else {
        showToast('Aceptaste la propuesta. Falta la confirmación de la contraparte.')
        await loadMatch()
      }
    } catch (error) {
      console.error('Error al responder el match:', error)
      showToast(error.message || 'No se pudo responder el match.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-brand-muted">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>Cargando propuesta...</p>
        </div>
      </Layout>
    )
  }

  if (!match) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-brand-primary font-semibold mb-4">Match no encontrado</p>
          <Link to="/matches" className="text-brand-secondary hover:underline text-sm">
            Ver todos mis matches
          </Link>
        </div>
      </Layout>
    )
  }

  const proposedAt = match.proposedAt
    ? new Date(match.proposedAt).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'recientemente'

  const leftItem = match.isDirectExchange
    ? match.isOfferOwner
      ? { item: match.offerItem, label: 'Tu pieza publicada' }
      : { item: match.offerItem, label: 'Pieza que deseas recibir' }
    : match.isOfferOwner
      ? { item: match.offerItem, label: 'Tu pieza publicada' }
      : { item: match.offerItem, label: 'Pieza ofrecida' }

  const rightItem = match.isDirectExchange
    ? match.isOfferOwner
      ? { item: match.counterOfferItem, label: 'Pieza ofrecida por la contraparte' }
      : { item: match.counterOfferItem, label: 'Tu pieza ofrecida' }
    : match.isOfferOwner
      ? { item: match.requestItem, label: 'Solicitud de la contraparte' }
      : { item: match.requestItem, label: 'Tu solicitud' }

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/matches')}
            className="w-8 h-8 rounded-xl border border-brand-border flex items-center justify-center text-brand-muted hover:bg-brand-bg transition-colors"
          >
            ←
          </button>

          <div>
            <h1 className="section-title">Propuesta de intercambio</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <MatchStatus status={match.status} />
              <span className="flex items-center gap-1 text-xs text-brand-muted">
                <Clock size={11} />
                Propuesta {proposedAt}
              </span>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
            {match.counterpart.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-brand-primary">{match.counterpart.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {[1, 2, 3, 4, 5].map(index => (
                <Star
                  key={index}
                  size={11}
                  className={
                    index <= Math.round(match.counterpart.reputation)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-brand-border'
                  }
                />
              ))}
              <span className="text-xs text-brand-muted ml-1">
                {match.counterpart.reputation.toFixed(1)}
              </span>
            </div>
          </div>

          {match.status === 'En Proceso' && <ChatButton matchId={id} />}
        </div>

        <div className="card p-5 mb-5">
          <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4">
            {match.isDirectExchange ? 'Piezas involucradas' : 'Pieza y solicitud involucradas'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {[leftItem, rightItem].map(({ item, label }, index) => (
              <div
                key={`${label}-${item?.id || index}`}
                className="rounded-xl border border-brand-border overflow-hidden"
              >
                <ItemThumbnail item={item} className="h-28 text-4xl" />
                <div className="p-3">
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className="text-xs font-bold text-brand-primary leading-tight mb-2">
                    {item.name}
                  </p>
                  <p className="text-xs text-brand-token font-semibold flex items-center gap-1">
                    <Zap size={10} />
                    {item.tokenValue > 0
                      ? `${item.tokenValue.toLocaleString('es-MX')} Tokens`
                      : 'Sin límite definido'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {match.compensation > 0 && (
            <div
              className={`mt-4 flex items-center gap-3 p-3 rounded-xl ${
                match.youPay
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-emerald-50 border border-emerald-200'
              }`}
            >
              <Zap
                size={16}
                className={match.youPay ? 'text-amber-600' : 'text-emerald-600'}
              />
              <p className="text-sm font-semibold">
                {match.youPay
                  ? `Al finalizar, pagarás ${match.compensation.toLocaleString('es-MX')} Eco-Tokens.`
                  : `Al finalizar, recibirás ${match.compensation.toLocaleString('es-MX')} Eco-Tokens.`}
              </p>
            </div>
          )}
        </div>

        {match.status === 'Propuesto' && (
          match.myAccepted ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-sm font-semibold text-brand-secondary">Ya aceptaste esta propuesta.</p>
              <p className="text-xs text-brand-muted mt-1">
                Esperando la confirmación de {match.counterpart.name}.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => respond(false)}
                disabled={Boolean(actionLoading)}
                className="flex-1 py-3.5 rounded-xl border-2 border-brand-danger text-brand-danger font-semibold text-sm hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {actionLoading === 'reject' ? (
                  <span className="w-4 h-4 border-2 border-red-300 border-t-brand-danger rounded-full animate-spin" />
                ) : (
                  <><XCircle size={16} />Rechazar</>
                )}
              </button>

              <button
                onClick={() => respond(true)}
                disabled={Boolean(actionLoading)}
                className="flex-1 py-3.5 rounded-xl bg-brand-gradient text-white font-semibold text-sm shadow-md hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {actionLoading === 'accept' ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle size={16} />Aceptar intercambio</>
                )}
              </button>
            </div>
          )
        )}

        {match.status === 'En Proceso' && (
          <button
            onClick={goToChat}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            Ir al chat de entrega
          </button>
        )}

        {match.status === 'Finalizado' && (
          <div className="card p-5 text-center">
            {checkingRating ? (
              <p className="text-sm text-brand-muted">Revisando tu evaluación...</p>
            ) : alreadyRated ? (
              <>
                <CheckCircle size={30} className="text-brand-success mx-auto mb-2" />
                <p className="font-semibold text-brand-primary">Ya calificaste este intercambio</p>
                <p className="text-sm text-brand-muted mt-1">
                  Gracias por contribuir a una comunidad confiable.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-bold text-brand-primary mb-2">Intercambio finalizado</h3>
                <p className="text-sm text-brand-muted mb-4">
                  Califica tu experiencia con {match.counterpart.name}.
                </p>
                <button
                  onClick={() => openRatingModal(match.counterpart.name, match.id)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Star size={16} />
                  Calificar a {match.counterpart.name}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
