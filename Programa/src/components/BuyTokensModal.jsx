import { useState } from 'react'
import { Zap, ArrowRight, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import { TOKEN_PACKAGES } from '../data/mockData'
import { useApp } from '../context/AppContext'
import { supabase } from '../supabaseClient'

export default function BuyTokensModal() {
const {
  buyTokensModalOpen,
  closeBuyTokensModal,
  user,
  setTokenBalance,
  showToast,
} = useApp()

  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [paid, setPaid]         = useState(false)

  const selectedPkg = TOKEN_PACKAGES.find(p => p.id === selected)

  const handleClose = () => {
    closeBuyTokensModal()
    setTimeout(() => { setSelected(null); setPaid(false) }, 300)
  }
const handlePay = async () => {
  if (!selectedPkg) return

  setLoading(true)

  try {
    const { data, error } = await supabase.rpc(
      'simular_compra_tokens',
      { p_tokens: selectedPkg.tokens }
    )

    if (error) throw error

    const result = Array.isArray(data) ? data[0] : data

    if (!result?.nuevo_saldo) {
      throw new Error('No se pudo obtener el nuevo saldo.')
    }

    setTokenBalance(result.nuevo_saldo)

    showToast(
      `+${selectedPkg.tokens.toLocaleString()} Eco-Tokens añadidos a tu billetera`
    )

    setPaid(true)
  } catch (error) {
    console.error('Error al comprar tokens:', error)
    showToast(
      error.message || 'No se pudo procesar la compra.',
      'error'
    )
  } finally {
    setLoading(false)
  }
}

  return (
    <Modal
      isOpen={buyTokensModalOpen}
      onClose={handleClose}
      showLogo
      showBack
      title="Añade tokens a tu cuenta"
      size="lg"
      className="!max-w-4xl"
    >
      {paid ? (
        <div className="text-center py-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center
                          justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-brand-success"/>
          </div>
          <h3 className="font-bold text-brand-primary text-xl mb-2">¡Pago exitoso!</h3>
          <p className="text-sm text-brand-muted mb-6">
            {selectedPkg?.tokens.toLocaleString()} Eco-Tokens han sido agregados a tu cuenta.
          </p>
          <button onClick={handleClose} className="btn-secondary max-w-xs mx-auto">
            Cerrar
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-6
                         text-center max-w-lg mx-auto leading-relaxed">
            Los tokens son la moneda virtual de la plataforma. Con ellos puedes
            comprar y completar el valor de otros productos en intercambios asimétricos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: packages */}
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">
                Paquetes disponibles
              </p>
              <div className="space-y-2">
                {TOKEN_PACKAGES.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                      ${selected === pkg.id
                        ? 'border-brand-secondary bg-blue-50'
                        : 'border-brand-border hover:border-brand-secondary/50'}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(pkg.id)}
                      className="flex-1 text-left text-sm font-medium text-brand-primary"
                    >
                      Añadir {pkg.tokens.toLocaleString()} tokens
                      <span className="block text-xs text-brand-muted font-normal mt-0.5">
                        {pkg.label} · ${pkg.price} MXN
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(pkg.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                        ${selected === pkg.id
                          ? 'bg-brand-secondary text-white'
                          : 'bg-brand-bg text-brand-muted border border-brand-border hover:bg-brand-bgDark'}`}
                    >
                      Añadir
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: summary */}
            <div>
              <p className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">
                Saldo de tu cuenta
              </p>
              <div className="border-2 border-brand-border rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Balance actual</span>
                  <span className="text-lg font-bold text-brand-primary flex items-center gap-1.5">
                    <Zap size={16} className="text-brand-token"/>
                    {user?.tokens?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-muted">Tokens a añadir</span>
                  <span className="text-sm font-semibold text-brand-success">
                    {selected ? `+${selectedPkg?.tokens?.toLocaleString()}` : '—'}
                  </span>
                </div>
                <div className="border-t border-brand-border pt-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-brand-primary">Total después de la compra</span>
                  <span className="text-xl font-black text-brand-primary flex items-center gap-1.5"
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <Zap size={18} className="text-brand-token"/>
                    {selected
                      ? ((user?.tokens ?? 0) + (selectedPkg?.tokens ?? 0)).toLocaleString()
                      : (user?.tokens ?? 0).toLocaleString()}
                  </span>
                </div>
                {selected && (
                  <p className="text-xs text-brand-muted text-center">
                    Monto a pagar: <strong>${selectedPkg?.price} MXN</strong>
                  </p>
                )}
              </div>

              <button
                onClick={handlePay}
                disabled={!selected || loading}
                className="w-full mt-4 py-3.5 rounded-xl bg-brand-bg border-2 border-brand-border
                           text-brand-primary font-semibold text-sm
                           hover:bg-brand-primary hover:text-white hover:border-brand-primary
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-brand-muted/30 border-t-brand-primary
                                   rounded-full animate-spin"/>
                ) : (
                  <>Simular pago <ArrowRight size={16}/></>
                )}
              </button>

              <p className="text-[11px] text-center text-brand-muted mt-3">
                Demostración académica: compra simulada
              </p>
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}