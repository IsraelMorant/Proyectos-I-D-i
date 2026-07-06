import { useState } from 'react'
import { Zap, TrendingUp, TrendingDown, ArrowUpRight, CreditCard, CheckCircle } from 'lucide-react'
import Layout from '../components/Layout'
import { TOKEN_PACKAGES, TRANSACTIONS } from '../data/mockData'
import { useApp } from '../context/AppContext'

export default function Wallet() {
  const { user, addTokens, showToast, openBuyTokensModal } = useApp()

  const [selected, setSelected]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [paid, setPaid]           = useState(false)

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    const pkg = TOKEN_PACKAGES.find(p => p.id === selected)
    addTokens(pkg.tokens)
    showToast(`+${pkg.tokens} Eco-Tokens añadidos a tu billetera`)
    setPaid(true)
    setLoading(false)
  }

  const txIcon = (type) => {
    if (type === 'purchase') return <ArrowUpRight size={14} className="text-brand-success"/>
    if (type === 'receive')  return <ArrowUpRight size={14} className="text-brand-success"/>
    return <TrendingDown size={14} className="text-brand-danger"/>
  }

  const selectedPkg = TOKEN_PACKAGES.find(p => p.id === selected)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title">Billetera</h1>
          <p className="text-sm text-brand-muted mt-0.5">Gestiona tus Eco-Tokens</p>
        </div>
        <button
          onClick={openBuyTokensModal}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient
                     text-white text-sm font-semibold shadow-md hover:brightness-110
                     active:scale-95 transition-all"
        >
          <Zap size={16}/> Comprar tokens
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Left: Balance + history ── */}
        <div className="space-y-5">
          {/* Balance card */}
          <div className="rounded-2xl bg-brand-gradient p-6 text-white shadow-card relative overflow-hidden">
            {/* Dot pattern */}
            <div className="absolute inset-0 circuit-bg opacity-100"/>
            <div className="relative z-10">
              <p className="text-sm text-white/60 mb-1">Saldo actual</p>
              <div className="flex items-end gap-2 mb-1">
                <Zap size={28} className="text-yellow-300 mb-1"/>
                <span className="text-5xl font-black"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {user?.tokens?.toLocaleString()}
                </span>
              </div>
              <p className="text-white/60 text-sm">Eco-Tokens disponibles</p>
              <p className="text-white/40 text-xs mt-3">1 MXN = 1 Eco-Token · tasa fija</p>
            </div>
          </div>

          {/* Transaction history */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-brand-primary mb-4">
              Historial de transacciones
            </h3>
            <div className="space-y-3">
              {TRANSACTIONS.map(tx => (
                <div key={tx.id}
                     className="flex items-center gap-3 py-2 border-b border-brand-border/40
                                last:border-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                    ${tx.amount > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-primary truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-brand-muted">{tx.date}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0
                    ${tx.amount > 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Buy tokens ── */}
        <div>
          <div className="card p-6">
            {paid ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center
                                justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-brand-success"/>
                </div>
                <h3 className="font-bold text-brand-primary text-lg mb-2">
                  ¡Pago exitoso!
                </h3>
                <p className="text-sm text-brand-muted mb-5">
                  {selectedPkg?.tokens.toLocaleString()} Eco-Tokens han sido agregados a tu cuenta.
                </p>
                <button
                  onClick={() => { setPaid(false); setSelected(null) }}
                  className="btn-secondary"
                >
                  Comprar más Tokens
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={18} className="text-brand-token"/>
                  <h2 className="text-lg font-bold text-brand-primary"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Añade Eco-Tokens
                  </h2>
                </div>
                <p className="text-xs text-brand-muted mb-5">
                  Úsalos para complementar intercambios asimétricos o canjear piezas directamente.
                </p>

                {/* Packages */}
                <div className="space-y-2.5 mb-6">
                  {TOKEN_PACKAGES.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelected(pkg.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5
                                  rounded-xl border-2 text-left transition-all duration-150
                                  ${selected === pkg.id
                                    ? 'border-brand-secondary bg-blue-50 shadow-sm'
                                    : 'border-brand-border hover:border-brand-secondary/50 bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                          ${selected === pkg.id ? 'bg-brand-secondary' : 'bg-brand-bg'}`}>
                          <Zap size={16} className={selected === pkg.id ? 'text-white' : 'text-brand-token'}/>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-primary">
                            {pkg.tokens.toLocaleString()} Tokens
                          </p>
                          <p className="text-xs text-brand-muted">{pkg.label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-primary">
                          ${pkg.price} MXN
                        </p>
                        {pkg.price < pkg.tokens && (
                          <p className="text-[10px] text-brand-success font-medium">
                            Ahorra ${pkg.tokens - pkg.price}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Summary */}
                {selected && (
                  <div className="bg-brand-bg rounded-xl p-4 mb-5 space-y-2">
                    <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">
                      Resumen de compra
                    </h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-muted">Saldo actual</span>
                      <span className="font-medium text-brand-primary">
                        {user?.tokens?.toLocaleString()} Tokens
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-muted">Tokens a añadir</span>
                      <span className="font-medium text-brand-success">
                        +{selectedPkg?.tokens?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-brand-border pt-2 mt-1">
                      <span className="font-bold text-brand-primary">Total después</span>
                      <span className="font-bold text-brand-primary flex items-center gap-1">
                        <Zap size={12} className="text-brand-token"/>
                        {((user?.tokens ?? 0) + (selectedPkg?.tokens ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={!selected || loading}
                  className="btn-primary flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  ) : (
                    <><CreditCard size={16}/>
                      {selected
                        ? `Pagar $${selectedPkg?.price} MXN`
                        : 'Selecciona un paquete'
                      }
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-brand-muted mt-3">
                  Los pagos se procesan de forma segura via MercadoPago / Conekta.
                  Los datos bancarios nunca son almacenados en SwapIT.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
