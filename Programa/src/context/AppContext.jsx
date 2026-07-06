import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AppContext = createContext(null)

const MOCK_USER = {
  id: 'user-001',
  name: 'Usuario SwapIT',
  email: '',
  avatar: null,
  reputation: 0,
  reviewCount: 0,
  tokens: 0,
  verified: true,
  joinedAt: null,
}

const EMPTY_CHAT_WIDGET = {
  dockOpen: false,
  openWindows: [],
  minimized: {},
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuth, setIsAuth] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [toast, setToast] = useState(null)

  // Mantiene el nombre anterior para no romper componentes existentes:
  // ahora representa el número real de notificaciones sin leer.
  const [pendingMatches, setPendingMatches] = useState(0)
  const [notifications, setNotifications] = useState([])

  const [addProductModal, setAddProductModal] = useState({
    isOpen: false,
    editId: null,
  })
  const [buyTokensModalOpen, setBuyTokensModalOpen] = useState(false)
  const [searchPieceModalOpen, setSearchPieceModalOpen] = useState(false)
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    userName: '',
    matchId: null,
  })

  const [chatWidget, setChatWidget] = useState(EMPTY_CHAT_WIDGET)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3500)
  }, [])

  const register = useCallback(async (email, password) => {
    return supabase.auth.signUp({ email, password })
  }, [])

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data.user) {
      setUser({
        ...MOCK_USER,
        id: data.user.id,
        email: data.user.email,
        name: data.user.email?.split('@')[0] || 'Usuario SwapIT',
      })
      setIsAuth(true)
    }

    return { data, error }
  }, [])

  const logout = useCallback(() => {
    void supabase.auth.signOut()
    setUser(null)
    setIsAuth(false)
    setNotifications([])
    setPendingMatches(0)
    setChatWidget(EMPTY_CHAT_WIDGET)
  }, [])

  const addTokens = useCallback((amount) => {
    setUser(current =>
      current ? { ...current, tokens: current.tokens + amount } : current
    )
  }, [])

  const setTokenBalance = useCallback((amount) => {
    setUser(current =>
      current ? { ...current, tokens: Number(amount) || 0 } : current
    )
  }, [])

  const spendTokens = useCallback((amount) => {
    setUser(current =>
      current
        ? { ...current, tokens: Math.max(0, current.tokens - amount) }
        : current
    )
  }, [])

  const openAddProductModal = useCallback((editId = null) => {
    setAddProductModal({ isOpen: true, editId })
  }, [])

  const closeAddProductModal = useCallback(() => {
    setAddProductModal({ isOpen: false, editId: null })
  }, [])

  const openBuyTokensModal = useCallback(() => setBuyTokensModalOpen(true), [])
  const closeBuyTokensModal = useCallback(() => setBuyTokensModalOpen(false), [])

  const openSearchPieceModal = useCallback(
    () => setSearchPieceModalOpen(true),
    []
  )
  const closeSearchPieceModal = useCallback(
    () => setSearchPieceModalOpen(false),
    []
  )

  const openRatingModal = useCallback((userName, matchId) => {
    setRatingModal({ isOpen: true, userName, matchId })
  }, [])

  const closeRatingModal = useCallback(() => {
    setRatingModal({ isOpen: false, userName: '', matchId: null })
  }, [])

  const toggleChatDock = useCallback(() => {
    setChatWidget(current => ({
      ...current,
      dockOpen: !current.dockOpen,
    }))
  }, [])

  const openChatWidget = useCallback((matchId = null) => {
    setChatWidget(current => {
      const next = { ...current, dockOpen: true }

      if (matchId && !current.openWindows.includes(matchId)) {
        next.openWindows = [...current.openWindows, matchId]
        next.minimized = { ...current.minimized, [matchId]: false }
      }

      return next
    })
  }, [])

  const closeChatWidget = useCallback(() => {
    setChatWidget(EMPTY_CHAT_WIDGET)
  }, [])

  const openChatWindow = useCallback((matchId) => {
    setChatWidget(current => ({
      ...current,
      dockOpen: true,
      openWindows: current.openWindows.includes(matchId)
        ? current.openWindows
        : [...current.openWindows, matchId],
      minimized: {
        ...current.minimized,
        [matchId]: false,
      },
    }))
  }, [])

  const closeChatWindow = useCallback((matchId) => {
    setChatWidget(current => ({
      ...current,
      openWindows: current.openWindows.filter(id => id !== matchId),
      minimized: {
        ...current.minimized,
        [matchId]: false,
      },
    }))
  }, [])

  const minimizeChatWindow = useCallback((matchId) => {
    setChatWidget(current => ({
      ...current,
      minimized: {
        ...current.minimized,
        [matchId]: !current.minimized[matchId],
      },
    }))
  }, [])

  const sendChatMessage = useCallback(async (matchId, text) => {
    const content = text.trim()

    if (!content) {
      return { data: null, error: new Error('Escribe un mensaje.') }
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return {
        data: null,
        error: new Error('Debes iniciar sesión para enviar mensajes.'),
      }
    }

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id_chat')
      .eq('id_match', matchId)
      .eq('activo', true)
      .maybeSingle()

    if (chatError || !chat) {
      return {
        data: null,
        error: new Error('El chat aún no está habilitado para este match.'),
      }
    }

    return supabase
      .from('mensajes')
      .insert({
        id_chat: chat.id_chat,
        id_remitente: authUser.id,
        contenido: content,
      })
      .select('id_mensaje, id_chat, id_remitente, contenido, fecha_envio')
      .single()
  }, [])

  const confirmDelivery = useCallback(
    async (matchId) => {
      const { data, error } = await supabase.rpc('confirmar_entrega_match', {
        p_match_id: matchId,
      })

      if (error) {
        showToast(error.message || 'No se pudo confirmar la entrega.', 'error')
        return { data: null, error }
      }

      const result = Array.isArray(data) ? data[0] : data

      showToast(
        result?.finalizado
          ? 'Intercambio finalizado y Eco-Tokens liquidados.'
          : 'Confirmaste la entrega. Falta la confirmación de la contraparte.'
      )

      return { data: result, error: null }
    },
    [showToast]
  )

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      setPendingMatches(0)
      return
    }

    const { data, error } = await supabase
      .from('notificaciones')
      .select('id_notificacion, tipo_evento, mensaje, leida, fecha')
      .eq('id_usuario', user.id)
      .order('fecha', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error al cargar notificaciones:', error)
      return
    }

    const nextNotifications = data || []
    setNotifications(nextNotifications)
    setPendingMatches(nextNotifications.filter(item => !item.leida).length)
  }, [user?.id])

  const markNotificationAsRead = useCallback(async (notificationId) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id_notificacion', notificationId)

    if (error) {
      console.error('No se pudo marcar la notificación:', error)
      return
    }

    setNotifications(current =>
      current.map(item =>
        item.id_notificacion === notificationId
          ? { ...item, leida: true }
          : item
      )
    )

    setPendingMatches(current => Math.max(0, current - 1))
  }, [])

  useEffect(() => {
    let active = true

    async function applySession(session) {
      if (!active) return

      if (!session?.user) {
        setUser(null)
        setIsAuth(false)
        setAuthReady(true)
        return
      }

      const [
        { data: wallet, error: walletError },
        { data: profile, error: profileError },
      ] = await Promise.all([
        supabase
          .from('billeteras')
          .select('saldo_eco_tokens')
          .eq('id_usuario', session.user.id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('nombre')
          .eq('id', session.user.id)
          .maybeSingle(),
      ])

      if (walletError) console.error('Error al cargar billetera:', walletError)
      if (profileError) console.error('Error al cargar perfil:', profileError)

      if (!active) return

      setUser({
        ...MOCK_USER,
        id: session.user.id,
        email: session.user.email,
        name:
          profile?.nombre ||
          session.user.user_metadata?.nombre ||
          session.user.email?.split('@')[0] ||
          'Usuario SwapIT',
        tokens: wallet?.saldo_eco_tokens ?? 0,
      })

      setIsAuth(true)
      setAuthReady(true)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Error al recuperar sesión:', error)
      void applySession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined

    void refreshNotifications()

    const channel = supabase
      .channel(`notificaciones-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `id_usuario=eq.${user.id}`,
        },
        () => {
          void refreshNotifications()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, refreshNotifications])

  return (
    <AppContext.Provider
      value={{
        register,
        user,
        authReady,
        isAuth,
        toast,
        login,
        logout,
        addTokens,
        setTokenBalance,
        spendTokens,
        showToast,

        pendingMatches,
        setPendingMatches,
        notifications,
        refreshNotifications,
        markNotificationAsRead,

        addProductModal,
        openAddProductModal,
        closeAddProductModal,
        buyTokensModalOpen,
        openBuyTokensModal,
        closeBuyTokensModal,
        searchPieceModalOpen,
        openSearchPieceModal,
        closeSearchPieceModal,
        ratingModal,
        openRatingModal,
        closeRatingModal,

        chatWidget,
        toggleChatDock,
        openChatWidget,
        closeChatWidget,
        openChatWindow,
        closeChatWindow,
        minimizeChatWindow,
        sendChatMessage,
        confirmDelivery,
      }}
    >
      {children}

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl
                      shadow-xl text-sm font-medium text-white min-w-64 text-center
                      ${toast.type === 'success'
                        ? 'bg-brand-success'
                        : toast.type === 'error'
                          ? 'bg-brand-danger'
                          : 'bg-brand-primary'}`}
        >
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useApp must be used inside AppProvider')
  }

  return context
}
