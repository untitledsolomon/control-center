import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/store/AppContext'
import { Sidebar } from '@/components/Sidebar'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { QuickActionBar } from '@/components/QuickActionBar'

export const metadata: Metadata = {
  title: 'DAWN Control Center',
  description: 'Mission control for the DAWN AI agent system',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AppProvider>
          <div className="flex h-screen overflow-hidden bg-[#0d1117]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-dawn-950/20 via-transparent to-transparent pointer-events-none" />
              <div className="relative z-10 p-6 lg:p-8">
                {children}
              </div>
            </main>
            <NotificationsPanel />
          </div>
          <QuickActionBar />
        </AppProvider>
      </body>
    </html>
  )
}
