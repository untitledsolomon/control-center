import type { Metadata } from 'next'
import { AppStateProvider } from '@/lib/store'
import { ThemeProvider } from '@/lib/theme'
import { ClientLayout } from '@/components/layout'
import './globals.css'

export const metadata: Metadata = {
  title: 'DAWN Control',
  description: 'DAWN AI Agent Control Center — Regent Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppStateProvider>
            <ClientLayout>{children}</ClientLayout>
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
