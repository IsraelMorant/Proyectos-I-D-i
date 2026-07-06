import { useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showLogo = false,
  showBack = false,
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    full: 'max-w-3xl',
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6
                 bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh]
                    flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200
                    ${className}`}
        onClick={e => e.stopPropagation()}
      >
        {(title || showLogo || showBack) && (
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-brand-border/60
                          flex-shrink-0">
            {showBack && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl border border-brand-border flex items-center
                           justify-center text-brand-muted hover:bg-brand-bg transition-colors"
                aria-label="Cerrar"
              >
                <ArrowLeft size={16}/>
              </button>
            )}

            {showLogo && (
              <div className="flex items-center gap-2 flex-1 justify-center">
                <SwapLogo/>
                <span className="font-bold text-brand-primary text-lg"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  SwapIT
                </span>
              </div>
            )}

            {title && !showLogo && (
              <div className="flex-1 min-w-0">
                <h2 id="modal-title" className="text-lg font-bold text-brand-primary truncate"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-brand-muted mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            )}

            {title && showLogo && (
              <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <h2 id="modal-title" className="text-xs font-bold text-brand-muted uppercase
                                                 tracking-widest mt-12">
                  {title}
                </h2>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-brand-muted
                         hover:bg-brand-bg hover:text-brand-primary transition-colors ml-auto"
              aria-label="Cerrar modal"
            >
              <X size={18}/>
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}

function SwapLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="#0B2D4E"/>
      <circle cx="16" cy="16" r="11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <path d="M10 14 L16 9 L22 14" stroke="white" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M22 18 L16 23 L10 18" stroke="#2196F3" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="16" cy="16" r="2.5" fill="white" opacity="0.9"/>
    </svg>
  )
}