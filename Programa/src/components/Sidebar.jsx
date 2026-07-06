import { FILTER_TAGS } from '../data/mockData'

const CATEGORIES = [
  { value: 'Equipos de cómputo', label: 'Equipos de cómputo' },
  { value: 'Hardware de computadora', label: 'Hardware' },
  { value: 'Componentes electrónicos', label: 'Componentes electrónicos' },
  { value: 'Periféricos', label: 'Periféricos' },
  { value: 'Cables y conectores', label: 'Cables' },
]

function FilterOption({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer text-xs text-brand-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3.5 h-3.5 rounded border-brand-border accent-brand-secondary"
      />
      {label}
    </label>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div className="border-b border-brand-border/60 pb-4 mb-4">
      <h3 className="text-xs font-bold uppercase text-brand-primary mb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function Sidebar({ filters, onChange }) {
  const toggle = (key, value) => {
    const current = filters[key] || []

    onChange({
      ...filters,
      [key]: current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value],
    })
  }

  const resetGroup = (key) => {
    onChange({
      ...filters,
      [key]: [],
    })
  }

  const clearAll = () => {
    onChange({
      availability: [],
      categories: [],
      condition: [],
      tokenRange: [],
      tags: [],
    })
  }

  return (
    <aside className="text-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase text-brand-primary">
          Filtros
        </h2>

        <button
          onClick={clearAll}
          className="text-xs text-brand-secondary hover:underline"
        >
          Limpiar
        </button>
      </div>

      <FilterGroup title="Disponibilidad">
        <FilterOption
          label="Todos"
          checked={(filters.availability || []).length === 0}
          onChange={() => resetGroup('availability')}
        />
        <FilterOption
          label="Disponible"
          checked={(filters.availability || []).includes('Disponible')}
          onChange={() => toggle('availability', 'Disponible')}
        />
        <FilterOption
          label="En proceso"
          checked={(filters.availability || []).includes('En Proceso')}
          onChange={() => toggle('availability', 'En Proceso')}
        />
      </FilterGroup>

      <FilterGroup title="Categoría">
        {CATEGORIES.map(category => (
          <FilterOption
            key={category.value}
            label={category.label}
            checked={(filters.categories || []).includes(category.value)}
            onChange={() => toggle('categories', category.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Estado físico">
        <FilterOption
          label="Excelente (8-10)"
          checked={(filters.condition || []).includes('excellent')}
          onChange={() => toggle('condition', 'excellent')}
        />
        <FilterOption
          label="Bueno (5-7)"
          checked={(filters.condition || []).includes('good')}
          onChange={() => toggle('condition', 'good')}
        />
        <FilterOption
          label="Regular (3-4)"
          checked={(filters.condition || []).includes('regular')}
          onChange={() => toggle('condition', 'regular')}
        />
      </FilterGroup>

      <FilterGroup title="Rango de Tokens">
        <FilterOption
          label="0-500"
          checked={(filters.tokenRange || []).includes('0-500')}
          onChange={() => toggle('tokenRange', '0-500')}
        />
        <FilterOption
          label="500-2000"
          checked={(filters.tokenRange || []).includes('500-2000')}
          onChange={() => toggle('tokenRange', '500-2000')}
        />
        <FilterOption
          label="2000-5000"
          checked={(filters.tokenRange || []).includes('2000-5000')}
          onChange={() => toggle('tokenRange', '2000-5000')}
        />
        <FilterOption
          label="5000+"
          checked={(filters.tokenRange || []).includes('5000+')}
          onChange={() => toggle('tokenRange', '5000+')}
        />
      </FilterGroup>

      <FilterGroup title="Etiquetas">
        {FILTER_TAGS.map(tag => (
          <FilterOption
            key={tag}
            label={tag}
            checked={(filters.tags || []).includes(tag)}
            onChange={() => toggle('tags', tag)}
          />
        ))}
      </FilterGroup>
    </aside>
  )
}