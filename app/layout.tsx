import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Cykelfest – Olovslunds Trädgårdsförening',
  description: 'Anmäl dig till Cykelfesten i Olovslund – en social och rörlig middag för grannar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={`${geist.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-fest-purple focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold"
        >
          Hoppa till huvudinnehåll
        </a>
        {children}
        <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
      </body>
    </html>
  )
}
