import type { Metadata } from 'next'
import { AppStateProvider } from '@/lib/store'
import { ClientLayout } from '@/components/layout'
import './globals.css'

export const metadata: Metadata = {
  title: 'DAWN Control',
  description: 'DAWN AI Agent Control Center — Regent Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppStateProvider>
      </body>
    </html>
  )
}
