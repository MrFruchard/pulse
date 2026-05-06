import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Pulse',
  description: "Un réseau social qui n'existe qu'une heure par jour.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-bg text-text min-h-screen antialiased font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
