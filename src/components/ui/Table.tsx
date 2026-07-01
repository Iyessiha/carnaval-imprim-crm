'use client'

export const th: React.CSSProperties = {
  textAlign: 'left', padding: '11px 16px',
  fontSize: 11, fontWeight: 700, color: '#7A736C',
  textTransform: 'uppercase', letterSpacing: '.3px',
  whiteSpace: 'nowrap', background: '#F6F4F1',
}

export const td: React.CSSProperties = {
  padding: '13px 16px', fontSize: 13,
  borderTop: '1px solid #E4DDD6', verticalAlign: 'middle',
}

export function TableWrap({ children, minWidth = 680 }: {
  children: React.ReactNode
  minWidth?: number
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth }}>
          {children}
        </table>
      </div>
    </div>
  )
}

export function EmptyRow({ text, cols }: { text: string; cols: number }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: 48, textAlign: 'center', color: '#7A736C', fontSize: 14 }}>
        {text}
      </td>
    </tr>
  )
}
