import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Pulse',
  description: 'Un réseau social qui n\'existe qu\'une heure par jour.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
