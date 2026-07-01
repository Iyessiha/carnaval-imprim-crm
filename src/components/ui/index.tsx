'use client'
import React from 'react'

// ── Bouton primaire ─────────────────────────────────────────────
export function BtnPrimary({ children, onClick, disabled, type = 'button' }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: disabled ? '#E4DDD6' : '#C2117A', color: '#fff',
      border: 'none', padding: '10px 16px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', transition: 'background .15s',
    }}>
      {children}
    </button>
  )
}

// ── Bouton ghost ─────────────────────────────────────────────────
export function BtnGhost({ children, onClick, disabled }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: '#fff', color: '#1B1A1C', border: '1px solid #E4DDD6',
      padding: '10px 16px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

// ── Bouton icône ─────────────────────────────────────────────────
export function BtnIcon({ children, onClick, danger, title }: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
  title?: string
}) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'transparent', border: 'none',
      cursor: 'pointer', color: danger ? '#D14343' : '#7A736C',
      padding: 6, borderRadius: 8, display: 'inline-flex', alignItems: 'center',
    }}>
      {children}
    </button>
  )
}

// ── Input ────────────────────────────────────────────────────────
export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E4DDD6', borderRadius: 10,
  fontSize: 14, outline: 'none', background: '#fff',
  fontFamily: 'inherit', color: '#1B1A1C',
}

export const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#7A736C', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '.3px',
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}
