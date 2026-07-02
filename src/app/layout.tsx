import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Carnaval Imprim — CRM',
  description: 'Gestion clients, devis, factures, production — Carnaval Imprim Abidjan',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
