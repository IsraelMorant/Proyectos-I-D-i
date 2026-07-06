import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle,
  ChevronDown,
  Image,
  Info,
  MessageCircle,
  Minus,
  Phone,
  Search,
  Send,
  Smile,
  ThumbsUp,
  Video,
  X,
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/AppContext'

const FB_BLUE = '#0084FF'

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

const CHAT_MATCH_SELECT = `
  id_match,
  estatus,
  oferta:publicaciones!matches_id_publicacion_ofrezco_fkey (
    id_publicacion,
    id_usuario,
    descripcion,
    valor_eco_tokens,
    url_foto,
    categorias ( nombre ),
    autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo )
  ),
  busqueda:publicaciones!matches_id_publicacion_busco_fkey (
    id_publicacion,
    id_usuario,
    descripcion,
    valor_eco_tokens,
    url_foto,
    categorias ( nombre ),
    autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo )
  ),
  chats ( id_chat, activo )
`

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

  return {
    id: publication?.id_publicacion,
    ownerId: publication?.id_usuario,
    name,
    description,
    tokenValue: Number(publication?.valor_eco_tokens || 0),
    image: publication?.url_foto || null,
    authorName: formatDisplayName(author?.nombre || author?.correo?.split('@')[0]) || null,
  }
}

function toChatMatch(row, userId, profileNames = {}) {
  const offerItem = parsePublication(row.oferta)
  const requestItem = parsePublication(row.busqueda)
  const chat = relationOne(row.chats)
  const isOfferOwner = offerItem.ownerId === userId

  const counterpartId = isOfferOwner
    ? requestItem.ownerId
    : offerItem.ownerId

  const nestedName = isOfferOwner
    ? requestItem.authorName
    : offerItem.authorName

  return {
    id: row.id_match,
    chatId: chat?.id_chat || null,
    status: row.estatus,
    offerItem,
    requestItem,
    counterpart: {
      id: counterpartId,
      name: profileNames[counterpartId] || nestedName || 'Usuario SwapIT',
    },
  }
}

export default function ChatWidget() {
  const {
    user,
    chatWidget,
    openChatWidget,
    closeChatWidget,
    toggleChatDock,
    openChatWindow,
    closeChatWindow,
    minimizeChatWindow,
    sendChatMessage,
    confirmDelivery,
    showToast,
  } = useApp()

  const { dockOpen, openWindows, minimized } = chatWidget

  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState({})
  const [matches, setMatches] = useState([])
  const [messagesByMatch, setMessagesByMatch] = useState({})
  const [sending, setSending] = useState({})
  const [confirming, setConfirming] = useState({})
  const bottomRefs = useRef({})

  const loadChats = useCallback(async () => {
    if (!user?.id) return

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(CHAT_MATCH_SELECT)
      .eq('estatus', 'En Proceso')
      .order('fecha_propuesta', { ascending: false })

    if (matchesError) {
      console.error('Error al cargar chats:', matchesError)
      setMatches([])
      setMessagesByMatch({})
      return
    }

    const profileNames = await fetchProfileNames(
      (matchesData || []).flatMap(row => [
        getOwnerId(row.oferta),
        getOwnerId(row.busqueda),
      ])
    )

    const nextMatches = (matchesData || [])
      .map(row => toChatMatch(row, user.id, profileNames))
      .filter(match => match.chatId)

    setMatches(nextMatches)

    const chatIdToMatchId = Object.fromEntries(
      nextMatches.map(match => [match.chatId, match.id])
    )
    const chatIds = Object.keys(chatIdToMatchId)

    if (chatIds.length === 0) {
      setMessagesByMatch({})
      return
    }

    const { data: messagesData, error: messagesError } = await supabase
      .from('mensajes')
      .select(`
        id_mensaje,
        id_chat,
        id_remitente,
        contenido,
        fecha_envio,
        remitente:profiles!mensajes_id_remitente_fkey ( nombre, correo )
      `)
      .in('id_chat', chatIds)
      .order('fecha_envio', { ascending: true })

    if (messagesError) {
      console.error('Error al cargar mensajes:', messagesError)
      return
    }

    const nextMessages = {}

    for (const row of messagesData || []) {
      const matchId = chatIdToMatchId[row.id_chat]
      if (!matchId) continue

      const senderProfile = Array.isArray(row.remitente)
        ? row.remitente[0]
        : row.remitente

      const sender = formatDisplayName(
        senderProfile?.nombre || senderProfile?.correo?.split('@')[0]
      )

      if (!nextMessages[matchId]) nextMessages[matchId] = []

      nextMessages[matchId].push({
        id: row.id_mensaje,
        sender: sender || 'Usuario',
        text: row.contenido,
        timestamp: row.fecha_envio,
        isOwn: row.id_remitente === user.id,
      })
    }

    setMessagesByMatch(nextMessages)
  }, [user?.id])

  useEffect(() => {
    void loadChats()
  }, [loadChats])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`chat-widget-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => void loadChats()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        () => void loadChats()
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, loadChats])

  useEffect(() => {
    openWindows.forEach(matchId => {
      bottomRefs.current[matchId]?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [messagesByMatch, openWindows])

  const filteredMatches = matches.filter(match => {
    const query = search.trim().toLowerCase()

    if (!query) return true

    return (
      match.counterpart.name.toLowerCase().includes(query) ||
      match.offerItem.name.toLowerCase().includes(query) ||
      match.requestItem.name.toLowerCase().includes(query)
    )
  })

  const getLastMessage = (matchId) => {
    const messages = messagesByMatch[matchId] || []
    return messages[messages.length - 1]
  }

  const fmtTime = (iso) => {
    if (!iso) return ''

    const date = new Date(iso)
    const now = new Date()
    const elapsed = now - date

    if (elapsed < 86400000) {
      return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handleSend = async (matchId, event) => {
    event.preventDefault()

    const text = drafts[matchId]?.trim()
    if (!text) return

    setSending(current => ({ ...current, [matchId]: true }))

    const { error } = await sendChatMessage(matchId, text)

    if (error) {
      showToast(error.message || 'No se pudo enviar el mensaje.', 'error')
    } else {
      setDrafts(current => ({ ...current, [matchId]: '' }))
      await loadChats()
    }

    setSending(current => ({ ...current, [matchId]: false }))
  }

  const handleConfirmDelivery = async (matchId) => {
    setConfirming(current => ({ ...current, [matchId]: true }))
    await confirmDelivery(matchId)
    await loadChats()
    setConfirming(current => ({ ...current, [matchId]: false }))
  }

  // En móvil la app conserva la ruta /chat/:matchId. Ese archivo debe conectarse
  // por separado; este componente es el widget de escritorio.
  if (!dockOpen && openWindows.length === 0) {
    return (
      <button
        onClick={toggleChatDock}
        className="hidden md:flex fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform"
        style={{ background: FB_BLUE }}
        aria-label="Abrir mensajes"
      >
        <MessageCircle size={26} fill="white" />
        {matches.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {matches.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="hidden md:flex fixed bottom-0 right-0 z-50 items-end gap-2 p-3 pointer-events-none">
      {openWindows.map((matchId, index) => {
        const match = matches.find(item => item.id === matchId)

        if (!match || minimized[matchId]) return null

        const messages = messagesByMatch[matchId] || []

        return (
          <div
            key={matchId}
            className="pointer-events-auto w-[328px] h-[455px] bg-white rounded-t-xl shadow-[0_12px_28px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-gray-200"
            style={{ marginRight: index > 0 ? 0 : undefined }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
              <button
                onClick={() => openChatWidget(matchId)}
                className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80"
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: FB_BLUE }}
                  >
                    {match.counterpart.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {match.counterpart.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Chat de entrega activo
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <IconBtn icon={<Phone size={16} />} title="Llamar" />
                <IconBtn icon={<Video size={16} />} title="Videollamada" />
                <IconBtn icon={<Info size={16} />} title="Información" />
                <IconBtn
                  icon={<Minus size={16} />}
                  title="Minimizar"
                  onClick={() => minimizeChatWindow(matchId)}
                />
                <IconBtn
                  icon={<X size={16} />}
                  title="Cerrar"
                  onClick={() => closeChatWindow(matchId)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 bg-white chat-messenger-scroll">
              <div className="flex justify-center mb-3">
                <div className="bg-gray-100 rounded-full px-3 py-1 text-[11px] text-gray-600 max-w-[90%] text-center">
                  Pieza: {match.offerItem.name} ↔ Solicitud: {match.requestItem.name}
                </div>
              </div>

              {messages.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-6">
                  Envía un mensaje para coordinar la entrega.
                </p>
              )}

              {messages.map((message, messageIndex) => {
                const previous = messages[messageIndex - 1]
                const showAvatar = !message.isOwn && (!previous || previous.isOwn)
                const showName = !message.isOwn && showAvatar

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-1.5 ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isOwn && (
                      <div className="w-7 flex-shrink-0">
                        {showAvatar && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: FB_BLUE }}
                          >
                            {match.counterpart.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`max-w-[75%] ${message.isOwn ? 'items-end' : 'items-start'}`}>
                      {showName && (
                        <p className="text-[11px] font-semibold text-gray-700 mb-0.5 ml-1">
                          {message.sender}
                        </p>
                      )}

                      <div
                        className={`px-3 py-2 text-[13px] leading-snug ${
                          message.isOwn
                            ? 'text-white rounded-[18px] rounded-br-[4px]'
                            : 'bg-[#E4E6EB] text-gray-900 rounded-[18px] rounded-bl-[4px]'
                        }`}
                        style={message.isOwn ? { background: FB_BLUE } : undefined}
                      >
                        {message.text}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={element => { bottomRefs.current[matchId] = element }} />
            </div>

            <div className="px-3 py-2 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => handleConfirmDelivery(matchId)}
                disabled={Boolean(confirming[matchId])}
                className="w-full py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {confirming[matchId] ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={13} />
                )}
                Confirmar entrega recibida
              </button>
            </div>

            <form
              onSubmit={event => handleSend(matchId, event)}
              className="flex items-center gap-1.5 px-2 py-2 border-t border-gray-200 bg-white flex-shrink-0"
            >
              <button type="button" className="p-1.5 text-[#0084FF] hover:bg-gray-100 rounded-full">
                <Image size={20} />
              </button>
              <button type="button" className="p-1.5 text-[#0084FF] hover:bg-gray-100 rounded-full">
                <Smile size={20} />
              </button>

              <input
                type="text"
                value={drafts[matchId] || ''}
                onChange={event =>
                  setDrafts(current => ({
                    ...current,
                    [matchId]: event.target.value,
                  }))
                }
                placeholder="Aa"
                className="flex-1 px-3 py-2 rounded-full bg-[#F0F2F5] text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0"
              />

              {drafts[matchId]?.trim() ? (
                <button
                  type="submit"
                  disabled={Boolean(sending[matchId])}
                  className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  style={{ color: FB_BLUE }}
                >
                  <Send size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  className="p-1.5 rounded-full hover:bg-gray-100"
                  style={{ color: FB_BLUE }}
                >
                  <ThumbsUp size={20} />
                </button>
              )}
            </form>
          </div>
        )
      })}

      <div className="flex items-end gap-2 pointer-events-auto">
        {openWindows
          .filter(matchId => minimized[matchId])
          .map(matchId => {
            const match = matches.find(item => item.id === matchId)
            if (!match) return null

            return (
              <button
                key={matchId}
                onClick={() => minimizeChatWindow(matchId)}
                className="relative group"
                title={match.counterpart.name}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white"
                  style={{ background: FB_BLUE }}
                >
                  {match.counterpart.name?.[0]?.toUpperCase() || 'U'}
                </div>

                <span
                  onClick={event => {
                    event.stopPropagation()
                    closeChatWindow(matchId)
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white rounded-full items-center justify-center text-xs hidden group-hover:flex"
                >
                  <X size={12} />
                </span>
              </button>
            )
          })}
      </div>

      {dockOpen && (
        <div className="pointer-events-auto w-[328px] h-[455px] bg-white rounded-t-xl shadow-[0_12px_28px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-gray-900">Mensajes</h3>
              <button className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                <ChevronDown size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <IconBtn icon={<Minus size={16} />} title="Minimizar" onClick={toggleChatDock} />
              <IconBtn icon={<X size={16} />} title="Cerrar" onClick={closeChatWidget} />
            </div>
          </div>

          <div className="px-3 py-2 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar en Messenger"
                className="w-full pl-9 pr-3 py-2 rounded-full bg-[#F0F2F5] text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto chat-messenger-scroll">
            <p className="px-4 py-2 text-xs font-semibold text-gray-500">Chats activos</p>

            {filteredMatches.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                No tienes chats de entrega activos.
              </p>
            ) : (
              filteredMatches.map(match => {
                const last = getLastMessage(match.id)
                const isOpen = openWindows.includes(match.id)

                return (
                  <button
                    key={match.id}
                    onClick={() => openChatWindow(match.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F2F2F2] transition-colors text-left ${
                      isOpen ? 'bg-[#E7F3FF]' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base"
                        style={{ background: FB_BLUE }}
                      >
                        {match.counterpart.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">
                          {match.counterpart.name}
                        </p>
                        {last && (
                          <span className="text-[11px] text-gray-500 flex-shrink-0 ml-1">
                            {fmtTime(last.timestamp)}
                          </span>
                        )}
                      </div>

                      <p className="text-[13px] text-gray-500 truncate mt-0.5">
                        {last
                          ? last.isOwn
                            ? `Tú: ${last.text}`
                            : last.text
                          : `${match.offerItem.name} ↔ ${match.requestItem.name}`}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function IconBtn({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
    >
      {icon}
    </button>
  )
}
