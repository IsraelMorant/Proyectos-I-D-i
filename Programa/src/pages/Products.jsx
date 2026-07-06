import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Search, SlidersHorizontal, X, ChevronRight, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import ProductCard from '../components/ProductCard'
import { supabase } from '../supabaseClient'
import { FILTER_TAGS } from '../data/mockData'

const CATEGORY_LABELS = {
  comp: 'Equipos de cómputo',
  hw: 'Hardware de computadora',
  elec: 'Componentes electrónicos',
  peri: 'Periféricos',
  cable: 'Cables y conectores',
}

const createEmptyFilters = () => ({
  availability: [],
  categories: [],
  condition: [],
  tokenRange: [],
  tags: [],
})

const normalizeText = (text = '') =>
  String(text)
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

function categoryKeyFromName(category = '') {
  const text = normalizeText(category)

  if (text.includes('hardware')) return 'hw'
  if (text.includes('equipo') || text.includes('computo')) return 'comp'
  if (text.includes('electron')) return 'elec'
  if (text.includes('perifer')) return 'peri'
  if (text.includes('cable') || text.includes('conector')) return 'cable'

  return ''
}

function sameCategory(firstCategory, secondCategory) {
  const firstKey = categoryKeyFromName(firstCategory)
  const secondKey = categoryKeyFromName(secondCategory)

  if (firstKey && secondKey) {
    return firstKey === secondKey
  }

  return normalizeText(firstCategory) === normalizeText(secondCategory)
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

function matchesTag(product, tag) {
  const source = normalizeText(
    `${product.name} ${product.description} ${product.category}`
  )

  const normalizedTag = normalizeText(tag)

  const rules = {
    cpus: /cpu|procesador|ryzen|intel core|core i[3579]/,
    'tarjetas graficas': /gpu|tarjeta grafica|rtx|gtx|radeon/,
    ram: /\bram\b|ddr[345]/,
    'ssd/hdd': /ssd|hdd|disco duro|almacenamiento/,
    laptops: /laptop|notebook|thinkpad|macbook/,
    'arduino/pi': /arduino|raspberry|raspberry pi/,
  }

  const rule = rules[normalizedTag]

  return rule ? rule.test(source) : source.includes(normalizedTag)
}

function matchesCondition(condition, range) {
  const value = Number(condition)

  if (range === 'excellent') return value >= 8 && value <= 10
  if (range === 'good') return value >= 5 && value <= 7
  if (range === 'regular') return value >= 3 && value <= 4

  return true
}

function matchesTokenRange(tokens, range) {
  const value = Number(tokens)

  if (range === '0-500') return value >= 0 && value < 500
  if (range === '500-2000') return value >= 500 && value < 2000
  if (range === '2000-5000') return value >= 2000 && value < 5000
  if (range === '5000+') return value >= 5000

  return true
}

export default function Products() {
  const { openSearchPieceModal } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const categoryParam = searchParams.get('cat') || ''
  const queryParam = searchParams.get('q') || ''
  const categoryLabelFromUrl = CATEGORY_LABELS[categoryParam] || ''

  const [query, setQuery] = useState(queryParam)
  const [activeTag, setActiveTag] = useState('Todos')
  const [filters, setFilters] = useState(() => ({
    ...createEmptyFilters(),
    categories: categoryLabelFromUrl ? [categoryLabelFromUrl] : [],
  }))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const allTags = ['Todos', ...FILTER_TAGS]

  // Sincroniza la Bóveda cuando se entra desde una tarjeta de Inicio:
  // /productos?cat=comp, /productos?cat=hw, etc.
  useEffect(() => {
    setQuery(queryParam)
    setActiveTag('Todos')

    setFilters(previous => ({
      ...previous,
      categories: categoryLabelFromUrl ? [categoryLabelFromUrl] : [],
    }))
  }, [categoryParam, queryParam, categoryLabelFromUrl])

  useEffect(() => {
    let active = true

    async function fetchPublicaciones() {
      try {
        setIsLoading(true)

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
            categorias ( nombre ),
            autor:profiles!publicaciones_id_usuario_fkey ( nombre, correo )
          `)
          .eq('tipo', 'Ofrezco')
          .in('estatus', ['Disponible', 'En Proceso'])

        if (error) throw error

        const formattedProducts = (data || []).map(item => {
          let name = 'Componente'
          let description = item.descripcion || 'Sin descripción'

          const titleMatch = description.match(/^\*\*(.*?)\*\*\n\n([\s\S]*)$/)

          if (titleMatch) {
            name = titleMatch[1]
            description = titleMatch[2]
          }

          const categoryRelation = Array.isArray(item.categorias)
            ? item.categorias[0]
            : item.categorias

          const authorRelation = Array.isArray(item.autor)
            ? item.autor[0]
            : item.autor

          const category = categoryRelation?.nombre || 'Sin categoría'

          return {
            id: item.id_publicacion,
            name,
            description,
            category,
            categoryKey: categoryKeyFromName(category),
            tags: [category],
            condition: Number(item.estado_fisico || 1),
            tokenValue: Number(item.valor_eco_tokens || 0),
            image: item.url_foto || null,
            status: item.estatus || 'Disponible',
            publishedAt: item.fecha_publicacion,
            bgColor: '#dbeafe',
            publishedBy:
              formatDisplayName(
                authorRelation?.nombre ||
                  authorRelation?.correo?.split('@')[0]
              ) || 'Usuario sin nombre',
          }
        })

        if (active) {
          setProducts(formattedProducts)
        }
      } catch (error) {
        console.error('Error al cargar la Bóveda:', error)

        if (active) {
          setProducts([])
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void fetchPublicaciones()

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    let list = products.filter(product => {
      const searchableText = normalizeText(
        `${product.name} ${product.description} ${product.category}`
      )

      if (query && !searchableText.includes(normalizeText(query))) {
        return false
      }

      // Filtro estable de las tarjetas de Inicio.
      if (
        categoryParam &&
        product.categoryKey !== categoryParam
      ) {
        return false
      }

      // "Todos" es una opción visual del Sidebar, no un valor real de estatus.
      const selectedAvailability = (filters.availability || []).filter(
        value => normalizeText(value) !== 'todos'
      )

      if (
        selectedAvailability.length &&
        !selectedAvailability.includes(product.status)
      ) {
        return false
      }

      const selectedCategories = (filters.categories || []).filter(
        value => normalizeText(value) !== 'todos'
      )

      if (
        selectedCategories.length &&
        !selectedCategories.some(category =>
          sameCategory(product.category, category)
        )
      ) {
        return false
      }

      const selectedConditions = (filters.condition || []).filter(
        value => ['excellent', 'good', 'regular'].includes(value)
      )

      if (
        selectedConditions.length &&
        !selectedConditions.some(range =>
          matchesCondition(product.condition, range)
        )
      ) {
        return false
      }

      const selectedTokenRanges = (filters.tokenRange || []).filter(
        value => ['0-500', '500-2000', '2000-5000', '5000+'].includes(value)
      )

      if (
        selectedTokenRanges.length &&
        !selectedTokenRanges.some(range =>
          matchesTokenRange(product.tokenValue, range)
        )
      ) {
        return false
      }

      const selectedTags = (filters.tags || []).filter(
        value => normalizeText(value) !== 'todos'
      )

      if (
        selectedTags.length &&
        !selectedTags.some(tag => matchesTag(product, tag))
      ) {
        return false
      }

      if (
        activeTag !== 'Todos' &&
        activeTag !== 'Nuevos' &&
        activeTag !== 'Más populares' &&
        !matchesTag(product, activeTag)
      ) {
        return false
      }

      if (activeTag === 'Nuevos') {
        const date = new Date(product.publishedAt)

        if (
          Number.isNaN(date.getTime()) ||
          Date.now() - date.getTime() > 7 * 24 * 60 * 60 * 1000
        ) {
          return false
        }
      }

      return true
    })

    if (activeTag === 'Más populares') {
      list = [...list].sort(
        (first, second) =>
          Number(second.tokenValue) - Number(first.tokenValue)
      )
    }

    return list
  }, [products, query, activeTag, filters, categoryParam])

  const clearAllFilters = () => {
    setQuery('')
    setActiveTag('Todos')
    setFilters(createEmptyFilters())
    navigate('/productos')
  }

  return (
    <Layout>
      <nav className="breadcrumb">
        <Link
          to="/"
          className="hover:text-brand-secondary transition-colors"
        >
          Inicio
        </Link>

        <ChevronRight size={12} />

        <span className="text-brand-primary font-medium">
          Bóveda de Intercambio
        </span>
      </nav>

      <div className="flex items-start justify-between mb-4">
        <h1 className="section-title">Bóveda de Intercambio</h1>

        <span className="text-sm text-brand-muted">
          {isLoading ? 'Cargando...' : `${filtered.length} piezas`}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
          />

          <input
            type="text"
            placeholder="Buscar en la Bóveda…"
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-border bg-white
                       text-sm text-brand-text placeholder-brand-muted
                       focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-secondary
                       transition-all"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted
                         hover:text-brand-primary transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(current => !current)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl
                     border border-brand-border bg-white text-sm font-medium
                     text-brand-primary hover:bg-brand-bg transition-colors"
        >
          <SlidersHorizontal size={16} />
          Filtros
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
              ${
                activeTag === tag
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white border border-brand-border text-brand-muted hover:border-brand-primary hover:text-brand-primary'
              }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-6">
        <div className="hidden lg:block w-56 flex-shrink-0">
          <Sidebar filters={filters} onChange={setFilters} />
        </div>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="fixed left-0 top-0 h-full w-72 bg-white z-50 p-6
                            shadow-2xl overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-brand-primary">Filtros</h3>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-brand-muted hover:text-brand-primary"
                >
                  <X size={20} />
                </button>
              </div>

              <Sidebar filters={filters} onChange={setFilters} />
            </div>
          </>
        )}

        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Cargando piezas de la Bóveda...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>

              <p className="text-brand-primary font-semibold mb-1">
                Sin resultados {query ? `para "${query}"` : ''}
              </p>

              <p className="text-sm text-brand-muted mb-4">
                Prueba con otros términos o{' '}
                <button
                  onClick={openSearchPieceModal}
                  className="text-brand-secondary hover:underline"
                >
                  registra una búsqueda
                </button>{' '}
                y te notificamos cuando aparezca.
              </p>

              <button
                onClick={clearAllFilters}
                className="text-sm text-brand-secondary font-semibold hover:underline"
              >
                Ver todas las piezas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
