import { useState } from 'react'
import { Star, CheckCircle } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../context/AppContext'
import { supabase } from '../supabaseClient'

export default function RatingModal() {
  const { ratingModal, closeRatingModal, showToast } = useApp()
  const { isOpen, userName, matchId } = ratingModal

  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (loading) return

    closeRatingModal()

    setTimeout(() => {
      setRating(0)
      setHover(0)
      setComment('')
      setError('')
      setDone(false)
    }, 300)
  }

  const submit = async (e) => {
    e.preventDefault()

    if (!rating) {
      setError('Selecciona una calificación de 1 a 5 estrellas.')
      return
    }

    if (!matchId) {
      setError('No se identificó el intercambio a calificar.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: rpcError } = await supabase.rpc(
        'registrar_evaluacion',
        {
          p_match_id: matchId,
          p_calificacion: rating,
          p_comentario: comment.trim() || null,
        }
      )

      if (rpcError) throw rpcError

      // Avisa a MatchDetail que esta cuenta ya calificó.
      window.dispatchEvent(
        new CustomEvent('swapit-rating-saved', {
          detail: { matchId },
        })
      )

      showToast(`Calificación enviada a ${userName}`)
      setDone(true)
    } catch (err) {
      console.error('Error al registrar evaluación:', err)

      const message =
        err.message || 'No se pudo guardar la calificación.'

      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Calificar intercambio"
      subtitle={
        userName
          ? `¿Cómo fue tu experiencia con ${userName}?`
          : undefined
      }
      size="sm"
    >
      {done ? (
        <div className="text-center py-6">
          <div
            className="w-14 h-14 bg-emerald-50 rounded-full flex items-center
                       justify-center mx-auto mb-3"
          >
            <CheckCircle
              size={28}
              className="text-brand-success"
            />
          </div>

          <p className="font-semibold text-brand-primary mb-1">
            ¡Gracias por tu calificación!
          </p>

          <p className="text-sm text-brand-muted mb-5">
            Tu opinión ayuda a mantener la confianza en la comunidad SwapIT.
          </p>

          <button
            onClick={handleClose}
            className="btn-primary max-w-xs mx-auto"
          >
            Cerrar
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setRating(n)
                  setError('')
                }}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Calificar con ${n} estrellas`}
              >
                <Star
                  size={32}
                  className={
                    n <= (hover || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-brand-border'
                  }
                />
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-brand-muted">
            {rating === 0
              ? 'Selecciona una calificación'
              : rating >= 4
                ? '¡Excelente experiencia!'
                : rating >= 3
                  ? 'Buena experiencia'
                  : 'Experiencia mejorable'}
          </p>

          <div>
            <label className="field-label">
              Comentario opcional
            </label>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="¿Cómo fue la entrega, el estado de la pieza, la comunicación…?"
              className="field-input resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!rating || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <span
                className="w-4 h-4 border-2 border-white/30 border-t-white
                           rounded-full animate-spin"
              />
            ) : (
              'Enviar calificación'
            )}
          </button>
        </form>
      )}
    </Modal>
  )
}