// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'comp', label: 'Equipos de cómputo',       color: '#1565C0', emoji: '💻' },
  { id: 'hw',   label: 'Hardware de computadora',  color: '#0B2D4E', emoji: '🖥️'  },
  { id: 'elec', label: 'Componentes electrónicos', color: '#155070', emoji: '⚡' },
  { id: 'peri', label: 'Periféricos',              color: '#1A4A7A', emoji: '🖱️' },
  { id: 'cable','label': 'Cables y conectores',    color: '#0D3852', emoji: '🔌' },
]

// ──────────────────────────────────────────────
// Filter tags for Products page
// ──────────────────────────────────────────────
export const FILTER_TAGS = [
  'Nuevos', 'Más populares', 'CPUs', 'Tarjetas gráficas',
  'Placas madre', 'RAM', 'SSD/HDD', 'Laptops', 'Arduino/Pi',
]

// ──────────────────────────────────────────────
// Products (Bóveda de Intercambio)
// ──────────────────────────────────────────────
export const PRODUCTS = [
  {
    id: 'p-001',
    name: 'Placa Madre ASUS B560',
    category: 'hw',
    description: 'Placa base ASUS Prime B560M-A, socket LGA1200, sin daños visibles. Compatible con Intel 10ª y 11ª gen. Incluye caja y tornillos originales.',
    condition: 8,
    tokenValue: 1800,
    status: 'Disponible',
    bgColor: '#1a3a5c',
    publishedBy: 'Fernando G.',
    publishedAt: '2026-06-20',
    tags: ['Placas madre', 'Intel'],
  },
  {
    id: 'p-002',
    name: 'Laptop ThinkPad E15',
    category: 'comp',
    description: 'Lenovo ThinkPad E15 Gen 2, Ryzen 5 4500U, 8 GB RAM, SSD 256 GB. Pantalla sin rayaduras. Batería al 85%.',
    condition: 7,
    tokenValue: 7500,
    status: 'Disponible',
    bgColor: '#0d2035',
    publishedBy: 'Israel M.',
    publishedAt: '2026-06-18',
    tags: ['Laptops', 'AMD'],
  },
  {
    id: 'p-003',
    name: 'Servo Motor TowerPro MG996R',
    category: 'elec',
    description: 'Servo de alto torque 10 kg·cm. Perfecto estado, apenas usado en prototipo académico. Incluye brazo y tornillería.',
    condition: 9,
    tokenValue: 320,
    status: 'Disponible',
    bgColor: '#2563eb',
    publishedBy: 'Oziel S.',
    publishedAt: '2026-06-22',
    tags: ['Arduino/Pi', 'Componentes electrónicos'],
  },
  {
    id: 'p-004',
    name: 'GPU NVIDIA GTX 1060 6 GB',
    category: 'hw',
    description: 'Tarjeta gráfica MSI GTX 1060 Gaming X 6 GB. Funcional al 100%, thermal paste cambiada hace 3 meses. Sin artifacts.',
    condition: 8,
    tokenValue: 3200,
    status: 'Disponible',
    bgColor: '#155070',
    publishedBy: 'Fernando G.',
    publishedAt: '2026-06-19',
    tags: ['Tarjetas gráficas', 'NVIDIA'],
  },
  {
    id: 'p-005',
    name: 'Kit RAM DDR4 16 GB (2×8)',
    category: 'hw',
    description: 'Kingston HyperX Fury 3200 MHz DDR4 CL16. Totalmente funcional, probado con MemTest. Latencia perfecta.',
    condition: 9,
    tokenValue: 900,
    status: 'Disponible',
    bgColor: '#1A4A7A',
    publishedBy: 'Israel M.',
    publishedAt: '2026-06-21',
    tags: ['RAM'],
  },
  {
    id: 'p-006',
    name: 'Arduino Mega 2560',
    category: 'elec',
    description: 'Placa Arduino Mega 2560 Rev3 original, todos los pines operativos. Ideal para proyectos de sistemas embebidos. Cable USB incluido.',
    condition: 10,
    tokenValue: 550,
    status: 'En Proceso',
    bgColor: '#0a7c4a',
    publishedBy: 'Oziel S.',
    publishedAt: '2026-06-17',
    tags: ['Arduino/Pi'],
  },
  {
    id: 'p-007',
    name: 'SSD Samsung 860 EVO 500 GB',
    category: 'hw',
    description: 'SSD SATA 2.5" con 82% de vida útil según S.M.A.R.T. Velocidad de lectura/escritura óptima. Sin sectores defectuosos.',
    condition: 7,
    tokenValue: 650,
    status: 'Disponible',
    bgColor: '#374151',
    publishedBy: 'Fernando G.',
    publishedAt: '2026-06-23',
    tags: ['SSD/HDD'],
  },
  {
    id: 'p-008',
    name: 'CPU Intel Core i5-10400',
    category: 'hw',
    description: '6 núcleos / 12 hilos, 2.9 GHz base / 4.3 GHz boost. Disipador stock incluido. Probado en POST, sin dobladuras en pines.',
    condition: 8,
    tokenValue: 2100,
    status: 'Disponible',
    bgColor: '#0B2D4E',
    publishedBy: 'Israel M.',
    publishedAt: '2026-06-24',
    tags: ['CPUs', 'Intel'],
  },
]

// ──────────────────────────────────────────────
// Matches / Propuestas de trueque
// ──────────────────────────────────────────────
export const MATCHES = [
  {
    id: 'm-001',
    status: 'Propuesto',
    offerItem: PRODUCTS[0],
    requestItem: PRODUCTS[4],
    compensation: 900,
    compensationDirection: 'you-pay', // tú pagas la diferencia
    counterpart: { name: 'Israel M.', reputation: 4.9 },
    proposedAt: '2026-06-27T14:30:00Z',
    expiresAt:  '2026-06-29T14:30:00Z',
  },
  {
    id: 'm-002',
    status: 'En Proceso',
    offerItem: PRODUCTS[2],
    requestItem: PRODUCTS[5],
    compensation: 230,
    compensationDirection: 'you-receive',
    counterpart: { name: 'Fernando G.', reputation: 4.6 },
    proposedAt: '2026-06-25T10:00:00Z',
    expiresAt:  null,
  },
]

// ──────────────────────────────────────────────
// Chat messages
// ──────────────────────────────────────────────
export const CHAT_MESSAGES = [
  {
    id: 'msg-001',
    matchId: 'm-002',
    sender: 'Fernando G.',
    text: 'Hola, ¿cuándo podemos hacer el intercambio?',
    timestamp: '2026-06-25T10:15:00Z',
    isOwn: false,
  },
  {
    id: 'msg-002',
    matchId: 'm-002',
    sender: 'Tú',
    text: 'Mañana después de las clases de 3–5, ¿te viene bien en el edificio FCC?',
    timestamp: '2026-06-25T10:22:00Z',
    isOwn: true,
  },
  {
    id: 'msg-003',
    matchId: 'm-002',
    sender: 'Fernando G.',
    text: 'Perfecto. Nos vemos en la entrada principal. ¿Llevas los componentes en caja?',
    timestamp: '2026-06-25T10:30:00Z',
    isOwn: false,
  },
  {
    id: 'msg-004',
    matchId: 'm-002',
    sender: 'Tú',
    text: 'Sí, empacado bien y con sus accesorios. ¡Hasta mañana! 👍',
    timestamp: '2026-06-25T10:35:00Z',
    isOwn: true,
  },
  {
    id: 'msg-005',
    matchId: 'm-001',
    sender: 'Israel M.',
    text: 'Hola, vi tu propuesta de trueque. ¿La placa madre sigue disponible?',
    timestamp: '2026-06-27T14:45:00Z',
    isOwn: false,
  },
  {
    id: 'msg-006',
    matchId: 'm-001',
    sender: 'Tú',
    text: 'Sí, está en perfecto estado. ¿Te interesa el intercambio por el kit RAM?',
    timestamp: '2026-06-27T15:02:00Z',
    isOwn: true,
  },
]

// ──────────────────────────────────────────────
// Token packages
// ──────────────────────────────────────────────
export const TOKEN_PACKAGES = [
  { id: 'tk-1',  tokens:   60,   price:    60, label: 'Starter'  },
  { id: 'tk-2',  tokens:  120,   price:   115, label: 'Básico'   },
  { id: 'tk-3',  tokens:  300,   price:   270, label: 'Popular'  },
  { id: 'tk-4',  tokens:  600,   price:   510, label: 'Pro'      },
  { id: 'tk-5',  tokens: 1200,   price:   960, label: 'Máximo'   },
]

// ──────────────────────────────────────────────
// Transaction history
// ──────────────────────────────────────────────
export const TRANSACTIONS = [
  { id: 'tx-1', type: 'purchase',  amount: +600, description: 'Compra paquete Pro',           date: '2026-06-20' },
  { id: 'tx-2', type: 'spend',     amount: -320, description: 'Intercambio: Servo Motor',     date: '2026-06-22' },
  { id: 'tx-3', type: 'receive',   amount: +550, description: 'Trueque finalizado con Oziel', date: '2026-06-24' },
  { id: 'tx-4', type: 'purchase',  amount: +1200,description: 'Compra paquete Máximo',       date: '2026-06-26' },
]
