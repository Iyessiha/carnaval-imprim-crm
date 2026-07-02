export const dynamic = 'force-dynamic'
import PWAInstall from '@/components/PWAInstall'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PWAInstall />
    </>
  )
}
