'use client'
import { X } from 'lucide-react'

export default function Modal({
  title, onClose, children, wide = false
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(27,26,28,.45)',
        zIndex: 50, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', padding: 16, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, width: '100%',
          maxWidth: wide ? 780 : 560, marginTop: 28, marginBottom: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid #E4DDD6',
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7A736C', padding: 6, borderRadius: 8, display: 'inline-flex' }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  )
}
