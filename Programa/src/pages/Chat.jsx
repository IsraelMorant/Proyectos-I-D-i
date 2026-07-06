import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, ArrowLeft, CheckCircle, Info, ArrowRightLeft } from 'lucide-react'
import Layout from '../components/Layout'
import { MATCHES, CHAT_MESSAGES } from '../data/mockData'
import { useApp } from '../context/AppContext'

export default function Chat() {
  const { matchId }    = useParams()
  const { user, showToast } = useApp()

  const match    = MATCHES.find(m => m.id === matchId)
  const [msgs, setMsgs]     = useState(CHAT_MESSAGES.filter(m => m.matchId === matchId))
  const [text, setText]     = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading]     = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setMsgs(prev => [...prev, {
      id: `msg-${Date.now()}`,
      matchId,
      sender: 'Tú',
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isOwn: true,
    }])
    setText('')
  }

  const handleConfirm = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setConfirmed(true)
    showToast('¡Entrega confirmada! No olvides calificar al usuario.')
    setLoading(false)
  }

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  if (!match) return (
    <Layout>
      <div className="text-center py-20">
        <p className="text-brand-primary font-semibold mb-4">Chat no encontrado</p>
        <Link to="/matches" className="text-brand-secondary hover:underline text-sm">
          Ver mis matches
        </Link>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-xl flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>

        {/* ── Header ── */}
        <div className="card p-4 mb-3 flex items-center gap-3 flex-shrink-0">
          <Link to={`/match/${matchId}`}
                className="w-8 h-8 rounded-xl border border-brand-border flex items-center
                           justify-center text-brand-muted hover:bg-brand-bg transition-colors">
            <ArrowLeft size={15}/>
          </Link>
          <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center
                          justify-center text-white font-bold flex-shrink-0">
            {match.counterpart.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-primary">{match.counterpart.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-brand-muted">
              <ArrowRightLeft size={11}/>
              <span className="truncate">
                {match.offerItem.name} ↔ {match.requestItem.name}
              </span>
            </div>
          </div>
          <span className="badge-status-available flex-shrink-0">{match.status}</span>
        </div>

        {/* ── Match info banner ── */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200
                        rounded-xl px-4 py-2.5 mb-3 flex-shrink-0">
          <Info size={14} className="text-brand-secondary flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-brand-secondary">
            Coordina aquí el punto y horario de entrega en campus FCC–BUAP.
            Cuando hayas recibido la pieza, confirma la entrega.
          </p>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {msgs.length === 0 && (
            <p className="text-center text-sm text-brand-muted py-8">
              Aún no hay mensajes. ¡Empieza a coordinar la entrega!
            </p>
          )}
          {msgs.map((msg) => (
            <div key={msg.id}
                 className={`flex flex-col ${msg.isOwn ? 'items-end' : 'items-start'}`}>
              {!msg.isOwn && (
                <p className="text-xs text-brand-muted mb-1 ml-1">{msg.sender}</p>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${msg.isOwn
                    ? 'bg-brand-primary text-white rounded-br-sm'
                    : 'bg-white border border-brand-border text-brand-text rounded-bl-sm'
                  }`}
              >
                {msg.text}
              </div>
              <p className="text-[10px] text-brand-muted mt-1 mx-1">{fmt(msg.timestamp)}</p>
            </div>
          ))}
          <div ref={bottomRef}/>
        </div>

        {/* ── Confirm delivery ── */}
        {!confirmed && (
          <div className="flex-shrink-0 mt-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-3 rounded-xl border-2 border-brand-success text-brand-success
                         font-semibold text-sm hover:bg-emerald-50 transition-colors
                         flex items-center justify-center gap-2
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-emerald-300 border-t-brand-success rounded-full animate-spin"/>
                : <><CheckCircle size={16}/> Confirmar entrega recibida</>
              }
            </button>
          </div>
        )}

        {confirmed && (
          <div className="flex-shrink-0 mt-3 p-4 bg-emerald-50 border border-emerald-200
                          rounded-xl flex items-center gap-3">
            <CheckCircle size={20} className="text-brand-success flex-shrink-0"/>
            <div>
              <p className="text-sm font-semibold text-brand-success">¡Entrega confirmada!</p>
              <p className="text-xs text-emerald-700">
                En espera de que {match.counterpart.name} también confirme.
              </p>
            </div>
          </div>
        )}

        {/* ── Input ── */}
        <form onSubmit={send}
              className="flex-shrink-0 mt-3 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 px-4 py-3 rounded-xl border border-brand-border bg-white
                       text-sm text-brand-text placeholder-brand-muted
                       focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-secondary
                       transition-all"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-11 h-11 rounded-xl bg-brand-gradient text-white flex items-center
                       justify-center shadow-md hover:brightness-110 active:scale-95
                       transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16}/>
          </button>
        </form>
      </div>
    </Layout>
  )
}
