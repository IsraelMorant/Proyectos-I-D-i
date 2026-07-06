
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ArrowRight, Zap, ArrowRightLeft, Package } from 'lucide-react'
import Layout from '../components/Layout'
import { CATEGORIES } from '../data/mockData'
import { useApp } from '../context/AppContext'

import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
const CATEGORY_IMAGES = [
  {
    id: 'comp',
    label: 'Equipos de cómputo',
    emoji: '💻',
    desc: 'Laptops, desktops, all-in-ones',
    gradient: 'from-blue-900 to-blue-700',
  },
  {
    id: 'hw',
    label: 'Hardware de computadora',
    emoji: '🖥️',
    desc: 'CPU, GPU, RAM, placas madre',
    gradient: 'from-slate-800 to-blue-900',
  },
  {
    id: 'elec',
    label: 'Componentes electrónicos',
    emoji: '⚡',
    desc: 'Arduino, sensores, módulos',
    gradient: 'from-teal-900 to-blue-800',
  },
  {
    id: 'peri',
    label: 'Periféricos',
    emoji: '🖱️',
    desc: 'Teclados, mouse, monitores',
    gradient: 'from-indigo-900 to-blue-700',
  },
]





export default function Home() {
 const { user } = useApp()
  const navigate  = useNavigate()
  const [search, setSearch] = useState('')
  const [sliderIdx, setSliderIdx] = useState(0)


const [stats, setStats] = useState({
  piezasDisponibles: 0,
  intercambiosCompletados: 0,
  tokensCirculando: 0,
})

const [loadingStats, setLoadingStats] = useState(true)

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/productos?q=${encodeURIComponent(search)}`)
  }

  const prev = () => setSliderIdx(i => Math.max(0, i - 1))
  const next = () => setSliderIdx(i => Math.min(CATEGORY_IMAGES.length - 3, i + 1))

  const visible = CATEGORY_IMAGES.slice(sliderIdx, sliderIdx + 3)

useEffect(() => {
  let active = true

  async function loadStats() {
    const { data, error } = await supabase
      .rpc('obtener_estadisticas_inicio')
      .single()

    if (error) {
      console.error('Error al cargar estadísticas:', error)
      if (active) setLoadingStats(false)
      return
    }

    if (active) {
      setStats({
        piezasDisponibles: Number(data.piezas_disponibles || 0),
        intercambiosCompletados: Number(data.intercambios_completados || 0),
        tokensCirculando: Number(data.tokens_circulando || 0),
      })

      setLoadingStats(false)
    }
  }

  loadStats()

  return () => {
    active = false
  }
}, [])

const formatTokens = (amount) => {
  if (amount >= 1000) {
    const value = amount / 1000
    return `${value % 1 === 0 ? value : value.toFixed(1)}K`
  }

  return amount.toLocaleString('es-MX')
}



const metrics = [
  {
    value: loadingStats
      ? '—'
      : stats.piezasDisponibles.toLocaleString('es-MX'),
    label: 'Piezas disponibles',
    icon: <Package size={20} />,
  },
  {
    value: loadingStats
      ? '—'
      : stats.intercambiosCompletados.toLocaleString('es-MX'),
    label: 'Intercambios completados',
    icon: <ArrowRightLeft size={20} />,
  },
  {
    value: loadingStats
      ? '—'
      : formatTokens(stats.tokensCirculando),
    label: 'Eco-Tokens circulando',
    icon: <Zap size={20} />,
  },
]

  return (
    <Layout>
      {/* ── Greeting ── */}
      <div className="mb-6">
        <p className="text-sm text-brand-muted">
          Buenos días, <span className="font-semibold text-brand-primary">{user?.name?.split(' ')[0]}</span>
        </p>
        <h1 className="text-3xl font-bold text-brand-primary mt-0.5"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ¿Qué buscas hoy?
        </h1>
      </div>

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch}
            className="relative max-w-xl mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted"/>
        <input
          type="text"
          placeholder="Busca piezas, componentes, laptops…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-28 py-3.5 rounded-2xl border border-brand-border
                     bg-white text-sm text-brand-text placeholder-brand-muted shadow-card
                     focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-secondary
                     transition-all duration-200"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2
                     bg-brand-gradient text-white text-sm font-semibold rounded-xl
                     hover:brightness-110 active:scale-95 transition-all"
        >
          Buscar
        </button>
      </form>

      {/* ── Category slider ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-brand-primary">Explorar categorías</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={sliderIdx === 0}
              className="w-8 h-8 rounded-full border border-brand-border flex items-center
                         justify-center text-brand-muted hover:bg-brand-primary
                         hover:text-white hover:border-brand-primary
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16}/>
            </button>
            <button
              onClick={next}
              disabled={sliderIdx >= CATEGORY_IMAGES.length - 3}
              className="w-8 h-8 rounded-full border border-brand-border flex items-center
                         justify-center text-brand-muted hover:bg-brand-primary
                         hover:text-white hover:border-brand-primary
                         disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate(`/productos?cat=${cat.id}`)}
              className="group relative overflow-hidden rounded-2xl h-44 text-left
                         transition-all duration-300 hover:scale-[1.02] hover:shadow-cardHover
                         active:scale-[0.98]"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient}`}/>
              {/* Dot pattern */}
              <div className="absolute inset-0 opacity-10"
                   style={{
                     backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)',
                     backgroundSize: '22px 22px',
                   }}/>

              {/* Content */}
              <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                <span className="text-4xl">{cat.emoji}</span>
                <div>
                  <h3 className="text-white font-bold text-base leading-tight mb-1">
                    {cat.label}
                  </h3>
                  <p className="text-white/60 text-xs">{cat.desc}</p>
                </div>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100
                              transition-opacity duration-200">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight size={13} className="text-white"/>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── CTA button ── */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => navigate('/productos')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-primary
                     text-white text-sm font-semibold hover:bg-brand-primaryLight
                     active:scale-95 transition-all shadow-md hover:shadow-lg"
        >
          Ir a la Bóveda <ArrowRight size={16}/>
        </button>
        <button
          onClick={() => navigate('/publicar')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-brand-primary
                     text-brand-primary text-sm font-semibold hover:bg-brand-primary
                     hover:text-white active:scale-95 transition-all"
        >
          Publicar pieza
        </button>
      </div>

      {/* ── Platform stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
       {metrics.map(({ label, value, icon }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-brand-bg flex items-center
                            justify-center text-brand-secondary flex-shrink-0">
              {icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-primary"
                 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {value}
              </p>
              <p className="text-xs text-brand-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── How it works ── */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-brand-primary mb-6"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          ¿Cómo funciona SwapIT?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Publica tu pieza', desc: 'Sube fotos y asigna un valor en Eco-Tokens a lo que ya no usas.' },
            { step: '02', title: 'El sistema hace match', desc: 'El motor de emparejamiento busca coincidencias automáticamente.' },
            { step: '03', title: 'Acepta el trueque', desc: 'Revisa la propuesta, chat con el otro usuario y coordina la entrega.' },
            { step: '04', title: 'Confirma y califica', desc: 'Entrega en campus, confirma recepción y evalúa la experiencia.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col gap-2">
              <span className="text-3xl font-black text-brand-border"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {step}
              </span>
              <h3 className="text-sm font-bold text-brand-primary">{title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
