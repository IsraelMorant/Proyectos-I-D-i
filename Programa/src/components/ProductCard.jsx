import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Star, ArrowRightLeft } from 'lucide-react'

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  const {
    id,
    name,
    category,
    condition,
    tokenValue,
    status = 'Disponible',
    bgColor = '#dbeafe',
    publishedBy = 'Usuario SwapIT',
    image,
  } = product

  const statusCls =
    status === 'Disponible' ? 'badge-status-available' :
    status === 'En Proceso' ? 'badge-status-process' :
    'badge-status-inactive'

  const getIcon = () => {
    const categoryText = (category || '').toLowerCase()

    if (categoryText.includes('equipo')) return '💻'
    if (categoryText.includes('hardware')) return '🖥️'
    if (categoryText.includes('electr')) return '⚡'
    if (categoryText.includes('perif')) return '🖱️'

    return '🔌'
  }

  return (
    <Link to={`/productos/${id}`} className="card-hover block overflow-hidden group">
      {/* Image area */}
      <div
        className="relative h-44 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${bgColor}dd, ${bgColor}88)` }}
      >
        {image && !imageError && (
          <img
            src={image}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Fallback si no hay foto o la foto falla */}
        {(!image || imageError) && (
          <div className="relative z-10 text-center">
            <div className="text-5xl opacity-60 select-none">
              {getIcon()}
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className={statusCls}>{status}</span>
        </div>

        {/* Condition score */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 rounded-full px-2 py-1">
          <Star size={11} className="text-amber-500 fill-amber-500" />
          <span className="text-[11px] font-bold text-brand-primary">
            {condition}/10
          </span>
        </div>
      </div>

      {/* Info area */}
      <div className="p-4">
        <p className="text-[11px] text-brand-muted font-medium uppercase tracking-wide mb-1">
          {category || 'Sin categoría'}
        </p>

        <h3 className="text-sm font-bold text-brand-primary leading-tight mb-3 group-hover:text-brand-secondary transition-colors line-clamp-2">
          {name}
        </h3>

        <div className="flex items-center justify-between pt-3 border-t border-brand-border/50">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-brand-token" />
            <span className="text-sm font-bold text-brand-token">
              {Number(tokenValue || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-brand-muted">Tokens</span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              navigate(`/productos/${id}`)
            }}
          >
            <ArrowRightLeft size={13} />
            Canjear
          </button>
        </div>

        <p className="text-[11px] text-brand-muted mt-2">
          por {publishedBy}
        </p>
      </div>
    </Link>
  )
}