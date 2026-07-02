'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({
  title, onClose, children, wide = false
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  // Bloquer le scroll body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="modal-wrap"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(27,26,28,.45)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-inner"
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: wide ? 780 : 520,
          marginTop: 28,
          marginBottom: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E4DDD6',
          position: 'sticky', top: 0,
          background: '#fff', borderRadius: '16px 16px 0 0', zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1B1A1C' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: '#F6F4F1', border: 'none', cursor: 'pointer',
              borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center',
              color: '#7A736C', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 20px 24px', overflowY: 'auto', maxHeight: '80vh' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
