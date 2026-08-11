import type { Metadata } from 'next'
import './globals.css'
import './dashboard.css'
import BackButton from './components/back-button'
import AppShell from './components/app-shell'

export const metadata: Metadata = {
  title: 'Handball Performance OS',
  description: 'Plataforma de análise, scouting e performance para andebol.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>
        <AppShell>
          <BackButton />
          {children}
        </AppShell>
      </body>
    </html>
  )
}
