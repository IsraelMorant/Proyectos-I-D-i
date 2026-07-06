import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Send,
  ArrowLeft,
  CheckCircle,
  Info,
  ArrowRightLeft,
  Loader2,
  Star,
} from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/AppContext'

const MATCH_SELECT = `
  id_match,
  estatus,
  fecha_propuesta,
  id_publicacion_ofrezco,
  id_publicacion_busco,
  oferta:publicaciones!matches_id_publicacion_ofrezco_fkey (
    id_publicacion,
    id_usuario,
    descripcion,
    estado_fisico,
    valor_eco_tokens,
    url_foto,
    estatus,
    categorias ( nombre ),
    autor:profiles!publicaciones_id_usuario_fkey (
      nombre,
      correo,
      reputacion
    )
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
    autor:profiles!publicaciones_id_usuario_fkey (
      nombre,
      correo,
      reputacion
    )
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

function parsePublication(item) {
  const publication = relationOne(item)

  let name = 'Componente'
  let description = publication?.descripcion || 'Sin descripción'

  const titleMatch = description.match(/^\*\*(.*?)\*\*\n\n([\s\S]*)$/)

  if (titleMatch) {
    name = titleMatch[1]
    description = titleMatch[2]
  }

  const author = relationOne(publication?.autor)
  const category = relationOne(publication?.categorias)

  return {
    id: publication?.id_publicacion,
    ownerId: publication?.id_usuario,
    name,
    description,
    category: category?.nombre || 'Sin categoría',
    tokenValue: Number(publication?.valor_eco_tokens || 0),
    image: publication?.url_foto || null,
    authorName: formatDisplayName(
      author?.nombre || author?.correo?.split('@')[0]
    ),
  }
}

function getIcon(category = '') {
  const text = String(category).toLowerCase()

  if (text.includes('equipo')) return '💻'
  if (text.includes('hardware')) return '🖥️'
  if (text.includes('electr')) return '⚡'
  if (text.includes('perif')) return '🖱️'

  return '🔌'
}

export default function Chat() {
  const { matchId } = useParams()

  const {
    user,
    showToast,
    confirmDelivery,
    openRatingModal,
  } = useApp()

  const [match, setMatch] = useState(null)
  const [chatId, setChatId] = useState(null)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [alreadyRated, setAlreadyRated] = useState(false)

  const bottomRef = useRef(null)

  const loadMessages = useCallback(async currentChatId => {
    if (!currentChatId || !user?.id) return

    const { data, error } = await supabase
      .from('mensajes')
      .select(`
        id_mensaje,
        id_remitente,
        contenido,
        fecha_envio,
        remitente:profiles!mensajes_id_remitente_fkey (
          nombre,
          correo
        )
      `)
      .eq('id_chat', currentChatId)
      .order('fecha_envio', { ascending: true })

    if (error) {
      console.error('Error al cargar mensajes:', error)
      return
    }

    const formattedMessages = (data || []).map(message => {
      const sender = relationOne(message.remitente)
      const isOwn = message.id_remitente === user.id

      return {
        id: message.id_mensaje,
        sender: isOwn
          ? 'Tú'
          : formatDisplayName(
              sender?.nombre || sender?.correo?.split('@')[0]
            ) || 'Usuario',
        text: message.contenido,
        timestamp: message.fecha_envio,
        isOwn,
      }
    })

    setMsgs(formattedMessages)
  }, [user?.id])

  const loadChat = useCallback(async () => {
    if (!matchId || !user?.id) return

    setLoading(true)

    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(MATCH_SELECT)
        .eq('id_match', matchId)
        .single()

      if (matchError || !matchData) {
        console.error('Error al cargar el match:', matchError)
        setMatch(null)
        setChatId(null)
        return
      }

      const offerItem = parsePublication(matchData.oferta)
      const requestItem = parsePublication(matchData.busqueda)

      const isOfferOwner = offerItem.ownerId === user.id

      const counterpart = isOfferOwner
        ? requestItem
        : offerItem

      let counterpartName = counterpart.authorName

      // Respaldo por consulta directa al perfil si la relación anidada no llega.
      if (!counterpartName && counterpart.ownerId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nombre, correo')
          .eq('id', counterpart.ownerId)
          .maybeSingle()

        counterpartName = formatDisplayName(
          profileData?.nombre || profileData?.correo?.split('@')[0]
        )
      }

      const formattedMatch = {
        id: matchData.id_match,
        status: matchData.estatus,
        offerItem,
        requestItem,
        counterpart: {
          id: counterpart.ownerId,
          name: counterpartName || 'Usuario',
        },
      }

      setMatch(formattedMatch)

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id_chat, activo')
        .eq('id_match', matchId)
        .maybeSingle()

      if (chatError) {
        console.error('Error al cargar el chat:', chatError)
      }

      if (chatData?.id_chat) {
        setChatId(chatData.id_chat)
        await loadMessages(chatData.id_chat)
      } else {
        setChatId(null)
        setMsgs([])
      }

      if (matchData.estatus === 'Finalizado') {
        const { data: ratingData, error: ratingError } = await supabase
          .from('evaluaciones')
          .select('id_evaluacion')
          .eq('id_match', matchId)
          .eq('id_evaluador', user.id)
          .maybeSingle()

        if (ratingError) {
          console.error('Error al comprobar evaluación:', ratingError)
        }

        setAlreadyRated(Boolean(ratingData))
      } else {
        setAlreadyRated(false)
      }
    } finally {
      setLoading(false)
    }
  }, [matchId, user?.id, loadMessages])

  useEffect(() => {
    void loadChat()
  }, [loadChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (!chatId) return undefined

    const channel = supabase
      .channel(`mobile-chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensajes',
          filter: `id_chat=eq.${chatId}`,
        },
        () => void loadMessages(chatId)
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [chatId, loadMessages])

  useEffect(() => {
    if (!matchId) return undefined

    const channel = supabase
      .channel(`mobile-match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id_match=eq.${matchId}`,
        },
        () => void loadChat()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchId, loadChat])

  useEffect(() => {
    const handleRatingSaved = event => {
      if (event.detail?.matchId === matchId) {
        setAlreadyRated(true)
      }
    }

    window.addEventListener('swapit-rating-saved', handleRatingSaved)

    return () => {
      window.removeEventListener(
        'swapit-rating-saved',
        handleRatingSaved
      )
    }
  }, [matchId])

  const send = async event => {
    event.preventDefault()

    const content = text.trim()

    if (!content || !chatId || sending) return

    setSending(true)

    try {
      const { error } = await supabase
        .from('mensajes')
        .insert({
          id_chat: chatId,
          id_remitente: user.id,
          contenido: content,
        })

      if (error) throw error

      setText('')
      await loadMessages(chatId)
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      showToast(
        error.message || 'No se pudo enviar el mensaje.',
        'error'
      )
    } finally {
      setSending(false)
    }
  }

  const handleConfirm = async () => {
    if (confirming || match?.status !== 'En Proceso') return

    setConfirming(true)

    try {
      const response = await confirmDelivery(matchId)

      if (response?.error) {
        throw response.error
      }

      const result = Array.isArray(response?.data)
        ? response.data[0]
        : response?.data ?? response

      const finalizado =
        result?.finalizado === true ||
        result?.estado === 'Finalizado' ||
        result?.estatus === 'Finalizado'

      setConfirmed(true)
      await loadChat()

      if (finalizado) {
        showToast('¡Intercambio finalizado! Ahora puedes calificar.')
        openRatingModal(
          match?.counterpart?.name || 'la contraparte',
          matchId
        )
      } else {
        showToast(
          `Entrega confirmada. Falta la confirmación de ${match?.counterpart?.name || 'la contraparte'}.`
        )
      }
    } catch (error) {
      console.error('Error al confirmar entrega:', error)

      showToast(
        error.message || 'No se pudo confirmar la entrega.',
        'error'
      )
    } finally {
      setConfirming(false)
    }
  }

  const fmt = iso => {
    if (!iso) return ''

    return new Date(iso).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-brand-muted">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>Cargando chat...</p>
        </div>
      </Layout>
    )
  }

  if (!match) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-brand-primary font-semibold mb-4">
            Chat no encontrado
          </p>

          <Link
            to="/matches"
            className="text-brand-secondary hover:underline text-sm"
          >
            Ver mis matches
          </Link>
        </div>
      </Layout>
    )
  }

  const canWrite = Boolean(chatId && match.status === 'En Proceso')

  return (
    <Layout>
      <div
        className="max-w-xl flex flex-col"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <div className="card p-4 mb-3 flex items-center gap-3 flex-shrink-0">
          <Link
            to={`/match/${matchId}`}
            className="w-8 h-8 rounded-xl border border-brand-border flex items-center
                       justify-center text-brand-muted hover:bg-brand-bg transition-colors"
          >
            <ArrowLeft size={15} />
          </Link>

          <div
            className="w-10 h-10 rounded-full bg-brand-gradient flex items-center
                       justify-center text-white font-bold flex-shrink-0"
          >
            {match.counterpart.name?.[0]?.toUpperCase() || 'U'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-primary">
              {match.counterpart.name}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-brand-muted">
              <ArrowRightLeft size={11} />

              <span className="truncate">
                {match.offerItem.name} ↔ {match.requestItem.name}
              </span>
            </div>
          </div>

          <span
            className={
              match.status === 'En Proceso'
                ? 'badge-status-available flex-shrink-0'
                : 'badge-status-inactive flex-shrink-0'
            }
          >
            {match.status}
          </span>
        </div>

        <div
          className="flex items-start gap-2 bg-blue-50 border border-blue-200
                     rounded-xl px-4 py-2.5 mb-3 flex-shrink-0"
        >
          <Info
            size={14}
            className="text-brand-secondary flex-shrink-0 mt-0.5"
          />

          <p className="text-xs text-brand-secondary">
            Coordina aquí el punto y horario de entrega en campus FCC–BUAP.
            Cuando hayas recibido la pieza, confirma la entrega.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!chatId && (
            <p className="text-center text-sm text-brand-muted py-8">
              El chat estará disponible cuando ambos acepten el intercambio.
            </p>
          )}

          {chatId && msgs.length === 0 && (
            <p className="text-center text-sm text-brand-muted py-8">
              Aún no hay mensajes. ¡Empieza a coordinar la entrega!
            </p>
          )}

          {msgs.map(message => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.isOwn ? 'items-end' : 'items-start'
              }`}
            >
              {!message.isOwn && (
                <p className="text-xs text-brand-muted mb-1 ml-1">
                  {message.sender}
                </p>
              )}

              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${
                    message.isOwn
                      ? 'bg-brand-primary text-white rounded-br-sm'
                      : 'bg-white border border-brand-border text-brand-text rounded-bl-sm'
                  }`}
              >
                {message.text}
              </div>

              <p className="text-[10px] text-brand-muted mt-1 mx-1">
                {fmt(message.timestamp)}
              </p>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {match.status === 'En Proceso' && !confirmed && (
          <div className="flex-shrink-0 mt-3">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full py-3 rounded-xl border-2 border-brand-success text-brand-success
                         font-semibold text-sm hover:bg-emerald-50 transition-colors
                         flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <span
                  className="w-4 h-4 border-2 border-emerald-300 border-t-brand-success
                             rounded-full animate-spin"
                />
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirmar entrega recibida
                </>
              )}
            </button>
          </div>
        )}

        {match.status === 'En Proceso' && confirmed && (
          <div
            className="flex-shrink-0 mt-3 p-4 bg-emerald-50 border border-emerald-200
                       rounded-xl flex items-center gap-3"
          >
            <CheckCircle
              size={20}
              className="text-brand-success flex-shrink-0"
            />

            <div>
              <p className="text-sm font-semibold text-brand-success">
                ¡Entrega confirmada!
              </p>

              <p className="text-xs text-emerald-700">
                En espera de que {match.counterpart.name} también confirme.
              </p>
            </div>
          </div>
        )}

        {match.status === 'Finalizado' && (
          <div className="flex-shrink-0 mt-3">
            {alreadyRated ? (
              <div
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl
                           flex items-center gap-3"
              >
                <CheckCircle
                  size={20}
                  className="text-brand-success flex-shrink-0"
                />

                <div>
                  <p className="text-sm font-semibold text-brand-success">
                    Ya calificaste este intercambio
                  </p>

                  <p className="text-xs text-emerald-700">
                    Gracias por contribuir a una comunidad confiable.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() =>
                  openRatingModal(match.counterpart.name, matchId)
                }
                className="w-full py-3 rounded-xl bg-brand-gradient text-white
                           font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Star size={16} />
                Calificar a {match.counterpart.name}
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={send}
          className="flex-shrink-0 mt-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={text}
            disabled={!canWrite || sending}
            onChange={event => setText(event.target.value)}
            placeholder={
              canWrite
                ? 'Escribe un mensaje…'
                : 'El chat no está disponible'
            }
            className="flex-1 px-4 py-3 rounded-xl border border-brand-border bg-white
                       text-sm text-brand-text placeholder-brand-muted
                       focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-secondary
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!canWrite || !text.trim() || sending}
            className="w-11 h-11 rounded-xl bg-brand-gradient text-white flex items-center
                       justify-center shadow-md hover:brightness-110 active:scale-95
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      </div>
    </Layout>
  )
}