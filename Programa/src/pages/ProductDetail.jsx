import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Zap,
  Star,
  ArrowRightLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../supabaseClient'
import { useApp } from '../context/AppContext'

function getCategoryName(categorias) {
  if (Array.isArray(categorias)) {
    return categorias[0]?.nombre || 'Sin categoría'
  }

  return categorias?.nombre || 'Sin categoría'
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
  let name = 'Componente'
  let description = item.descripcion || 'Sin descripción'

  const match = description.match(/^\*\*(.*?)\*\*\n\n([\s\S]*)$/)

  if (match) {
    name = match[1]
    description = match[2]
  }

  const author = Array.isArray(item.autor)
    ? item.autor[0]
    : item.autor

  const publishedBy = formatDisplayName(
    author?.nombre || author?.correo?.split('@')[0]
  )

  return {
    id: item.id_publicacion,
    ownerId: item.id_usuario,
    categoryId: item.id_categoria,
    name,
    description,
    category: getCategoryName(item.categorias),
    condition: item.estado_fisico ?? 1,
    tokenValue: Number(item.valor_eco_tokens ?? 0),
    image: item.url_foto,
    status: item.estatus || 'Disponible',
    publishedBy: publishedBy || 'Usuario sin nombre',
    publishedAt: item.fecha_publicacion
      ? new Date(item.fecha_publicacion).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Recién publicado',
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

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, showToast } = useApp()

  const [product, setProduct] = useState(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const [offerSelectorOpen, setOfferSelectorOpen] = useState(false)
  const [myAvailablePieces, setMyAvailablePieces] = useState([])
  const [loadingMyPieces, setLoadingMyPieces] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState('')

  useEffect(() => {
    let active = true

    async function loadProduct() {
      setLoading(true)
      setImageError(false)

      const { data, error } = await supabase
        .from('publicaciones')
        .select(`
          id_publicacion,
          id_usuario,
          id_categoria,
          descripcion,
          estado_fisico,
          valor_eco_tokens,
          url_foto,
          estatus,
          fecha_publicacion,
          categorias ( nombre ),
          autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo )
        `)
        .eq('id_publicacion', id)
        .single()

      if (error || !data) {
        console.error('Error al buscar la publicación:', error)

        if (active) {
          setProduct(null)
          setLoading(false)
        }

        return
      }

      const formattedProduct = parsePublication(data)

      if (active) {
        setProduct(formattedProduct)
      }

      const { data: similarData, error: similarError } = await supabase
        .from('publicaciones')
        .select(`
          id_publicacion,
          id_usuario,
          id_categoria,
          descripcion,
          estado_fisico,
          valor_eco_tokens,
          url_foto,
          estatus,
          fecha_publicacion,
          categorias ( nombre )
        `)
        .eq('id_categoria', data.id_categoria)
        .eq('tipo', 'Ofrezco')
        .eq('estatus', 'Disponible')
        .neq('id_publicacion', id)
        .limit(3)

      if (similarError) {
        console.error('Error al cargar piezas similares:', similarError)
      }

      if (active) {
        setSimilarProducts((similarData || []).map(parsePublication))
        setLoading(false)
      }
    }

    loadProduct()

    return () => {
      active = false
    }
  }, [id])

  const closeOfferSelector = () => {
    if (exchangeLoading) return

    setOfferSelectorOpen(false)
    setSelectedOfferId('')
  }

  const openOfferSelector = async () => {
    if (!user?.id) {
      showToast('Inicia sesión para proponer un intercambio.', 'error')
      return
    }

    if (product.ownerId === user.id) {
      showToast(
        'No puedes proponer un intercambio por tu propia publicación.',
        'error'
      )
      return
    }

    setOfferSelectorOpen(true)
    setSelectedOfferId('')
    setLoadingMyPieces(true)

    try {
      const { data, error } = await supabase
        .from('publicaciones')
        .select(`
          id_publicacion,
          id_usuario,
          id_categoria,
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
        .eq('estatus', 'Disponible')
        .order('fecha_publicacion', { ascending: false })

      if (error) throw error

      setMyAvailablePieces((data || []).map(parsePublication))
    } catch (error) {
      console.error('Error al cargar tus piezas disponibles:', error)
      showToast(
        error.message || 'No se pudieron cargar tus piezas disponibles.',
        'error'
      )
      setMyAvailablePieces([])
    } finally {
      setLoadingMyPieces(false)
    }
  }

  const handleExchange = async () => {
    if (!user?.id || !selectedOfferId) {
      showToast('Selecciona la pieza que ofrecerás.', 'error')
      return
    }

    setExchangeLoading(true)

    try {
      const { data, error } = await supabase.rpc(
        'proponer_intercambio_directo',
        {
          p_publicacion_objetivo: product.id,
          p_publicacion_contraoferta: selectedOfferId,
        }
      )

      if (error) throw error

      const matchId = Array.isArray(data)
        ? data[0]?.id_match || data[0]
        : data

      if (!matchId) {
        throw new Error('No se recibió el identificador del match creado.')
      }

      showToast('¡Propuesta enviada! Espera la respuesta de la contraparte.')
      setOfferSelectorOpen(false)
      setSelectedOfferId('')
      navigate(`/match/${matchId}`)
    } catch (error) {
      console.error('Error al proponer intercambio:', error)
      showToast(
        error.message || 'No se pudo crear la propuesta de intercambio.',
        'error'
      )
    } finally {
      setExchangeLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-28 text-brand-muted">
          <Loader2 size={32} className="animate-spin mb-4" />
          <p>Cargando pieza...</p>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-brand-primary font-semibold mb-4">
            Pieza no encontrada
          </p>

          <Link
            to="/productos"
            className="text-brand-secondary hover:underline text-sm"
          >
            Volver a la Bóveda
          </Link>
        </div>
      </Layout>
    )
  }

  const conditionLabel =
    product.condition >= 8
      ? 'Excelente'
      : product.condition >= 5
        ? 'Bueno'
        : 'Regular'

  const statusClass =
    product.status === 'Disponible'
      ? 'badge-status-available'
      : product.status === 'En Proceso'
        ? 'badge-status-process'
        : 'badge-status-inactive'

  const isOwnProduct = product.ownerId === user?.id

  return (
    <Layout>
      <nav className="breadcrumb">
        <Link to="/" className="hover:text-brand-secondary transition-colors">
          Inicio
        </Link>

        <ChevronRight size={12} />

        <Link
          to="/productos"
          className="hover:text-brand-secondary transition-colors"
        >
          Bóveda
        </Link>

        <ChevronRight size={12} />

        <span className="text-brand-primary font-medium truncate max-w-40">
          {product.name}
        </span>
      </nav>

      <button
        onClick={() => navigate('/productos')}
        className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-primary mb-5"
      >
        <ArrowLeft size={16} />
        Volver a la Bóveda
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex gap-4">
          <div className="hidden sm:flex flex-col gap-2">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-brand-secondary shadow-md bg-brand-bg">
              {product.image && !imageError ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-2xl">
                  {getIcon(product.category)}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 relative rounded-2xl overflow-hidden h-80 sm:h-96 shadow-card border border-brand-border/50 bg-brand-bg">
            {product.image && !imageError ? (
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-40">
                {getIcon(product.category)}
              </div>
            )}

            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, white 2px, transparent 0)',
                backgroundSize: '28px 28px',
              }}
            />

            <div className="absolute top-4 left-4">
              <span className={statusClass}>{product.status}</span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 rounded-full px-3 py-1.5">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-brand-primary">
                {product.condition}/10
              </span>
              <span className="text-xs text-brand-muted">{conditionLabel}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
  <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold">
    {product.publishedBy?.[0]?.toUpperCase() || 'U'}
  </div>

  <div>
    <p className="text-xs font-semibold text-brand-primary">
      {product.publishedBy}
    </p>
    <p className="text-[11px] text-brand-muted">
      Publicado {product.publishedAt}
    </p>
  </div>
</div>
          <h1
            className="text-2xl font-bold text-brand-primary mb-2 leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-brand-token" />

            <span
              className="text-3xl font-black text-brand-token"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {Number(product.tokenValue).toLocaleString()}
            </span>

            <span className="text-sm text-brand-muted font-medium">
              Eco-Tokens
            </span>
          </div>

          <p className="text-xs text-brand-muted mb-6 pb-6 border-b border-brand-border/50">
            Entrega en campus BUAP FCC
          </p>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
              Descripción
            </h3>

            <p className="text-sm text-brand-text leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mb-6 space-y-2">
            {[
              ['Estado físico', `${product.condition}/10 – ${conditionLabel}`],
              ['Categoría', product.category],
              ['Modalidad', 'Trueque directo o Eco-Tokens'],
              ['Entrega', 'En campus FCC – BUAP'],
            ].map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between text-sm py-1.5 border-b border-brand-border/30 last:border-0"
              >
                <span className="text-brand-muted">{key}</span>
                <span className="font-medium text-brand-primary">{value}</span>
              </div>
            ))}
          </div>

          {product.status !== 'Disponible' ? (
            <div className="w-full py-3 rounded-xl bg-brand-border/40 text-center text-sm font-semibold text-brand-muted">
              Pieza en proceso de intercambio
            </div>
          ) : isOwnProduct ? (
            <div className="w-full py-3 rounded-xl bg-blue-50 border border-blue-200 text-center text-sm font-semibold text-brand-secondary">
              Esta es tu publicación
            </div>
          ) : (
            <button
              onClick={openOfferSelector}
              disabled={exchangeLoading}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exchangeLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowRightLeft size={16} />
                  Proponer intercambio
                </>
              )}
            </button>
          )}

          <p className="text-xs text-center text-brand-muted mt-3">
            La propuesta quedará pendiente hasta que ambas personas la acepten.
          </p>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="mt-10">
          <h2
            className="text-lg font-bold text-brand-primary mb-4"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Piezas similares
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarProducts.map(similar => (
              <Link
                key={similar.id}
                to={`/productos/${similar.id}`}
                className="card-hover flex items-center gap-4 p-4"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-brand-bg">
                  {similar.image ? (
                    <img
                      src={similar.image}
                      alt={similar.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-2xl">
                      {getIcon(similar.category)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-primary truncate">
                    {similar.name}
                  </p>

                  <p className="text-xs text-brand-token font-medium flex items-center gap-1 mt-0.5">
                    <Zap size={10} />
                    {Number(similar.tokenValue).toLocaleString()} Tokens
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className="text-brand-muted ml-auto flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      {offerSelectorOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
          onClick={closeOfferSelector}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-brand-border">
              <div>
                <h2 className="text-xl font-bold text-brand-primary">
                  Elige la pieza que ofrecerás
                </h2>
                <p className="text-sm text-brand-muted mt-1">
                  Quieres recibir: <span className="font-semibold">{product.name}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeOfferSelector}
                disabled={exchangeLoading}
                className="p-2 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-bg disabled:opacity-40"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {loadingMyPieces ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand-muted">
                  <Loader2 size={28} className="animate-spin mb-3" />
                  <p className="text-sm">Cargando tus piezas disponibles...</p>
                </div>
              ) : myAvailablePieces.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="font-semibold text-brand-primary mb-2">
                    No tienes piezas disponibles para ofrecer
                  </p>
                  <p className="text-sm text-brand-muted mb-5">
                    Primero publica una pieza en tu inventario y después podrás usarla en un intercambio.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/publicar')}
                    className="btn-primary max-w-xs mx-auto"
                  >
                    Publicar una pieza
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">
                    Tus piezas disponibles
                  </p>

                  <div className="space-y-3">
                    {myAvailablePieces.map(piece => {
                      const selected = selectedOfferId === piece.id

                      return (
                        <button
                          key={piece.id}
                          type="button"
                          onClick={() => setSelectedOfferId(piece.id)}
                          className={`w-full text-left rounded-xl border-2 p-3 flex items-center gap-3 transition-all ${
                            selected
                              ? 'border-brand-secondary bg-blue-50 shadow-sm'
                              : 'border-brand-border hover:border-brand-secondary/50'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                            {piece.image ? (
                              <img
                                src={piece.image}
                                alt={piece.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="h-full flex items-center justify-center text-2xl">
                                {getIcon(piece.category)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-brand-primary truncate">
                              {piece.name}
                            </p>
                            <p className="text-xs text-brand-muted mt-1">
                              {piece.category} · Estado {piece.condition}/10
                            </p>
                            <p className="text-xs text-brand-token font-semibold flex items-center gap-1 mt-1">
                              <Zap size={11} />
                              {piece.tokenValue.toLocaleString('es-MX')} Eco-Tokens
                            </p>
                          </div>

                          <span
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selected
                                ? 'border-brand-secondary bg-brand-secondary'
                                : 'border-brand-border'
                            }`}
                          >
                            {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {selectedOfferId && (() => {
                    const selectedPiece = myAvailablePieces.find(
                      piece => piece.id === selectedOfferId
                    )

                    const difference = Math.abs(
                      Number(product.tokenValue) -
                      Number(selectedPiece?.tokenValue || 0)
                    )

                    return (
                      <div className="mt-5 rounded-xl border border-brand-border bg-brand-bg p-4 text-sm">
                        <p className="font-semibold text-brand-primary">
                          Intercambio propuesto
                        </p>
                        <p className="text-brand-muted mt-1">
                          Ofrecerás <strong>{selectedPiece?.name}</strong> por{' '}
                          <strong>{product.name}</strong>.
                        </p>
                        <p className="text-brand-muted mt-1">
                          {difference === 0
                            ? 'Las piezas tienen el mismo valor: no habrá compensación adicional.'
                            : Number(product.tokenValue) > Number(selectedPiece?.tokenValue || 0)
                              ? `Además pagarás ${difference.toLocaleString('es-MX')} Eco-Tokens al finalizar.`
                              : `La contraparte pagará ${difference.toLocaleString('es-MX')} Eco-Tokens al finalizar.`}
                        </p>
                      </div>
                    )
                  })()}

                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={closeOfferSelector}
                      disabled={exchangeLoading}
                      className="flex-1 py-3 rounded-xl border-2 border-brand-border text-sm font-semibold text-brand-muted hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={handleExchange}
                      disabled={!selectedOfferId || exchangeLoading}
                      className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {exchangeLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ArrowRightLeft size={16} />
                          Enviar propuesta
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}