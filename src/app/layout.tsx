import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import WireframeLandscape from '@/components/WireframeLandscape'

export const metadata: Metadata = {
  title: {
    default: 'Landform Labs - Nature-Inspired Innovation',
    template: '%s | Landform Labs'
  },
  description: 'Crafting innovative solutions inspired by nature. Discover outdoor products that bridge technology and the natural world.',
  keywords: ['outdoor products', 'nature-inspired', 'innovation', 'handcrafted', 'outdoor gear'],
  authors: [{ name: 'Landform Labs' }],
  creator: 'Landform Labs',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://landformlabs.co',
    siteName: 'Landform Labs',
    title: 'Landform Labs - Nature-Inspired Innovation',
    description: 'Crafting innovative solutions inspired by nature. Discover outdoor products that bridge technology and the natural world.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landform Labs - Nature-Inspired Innovation',
    description: 'Crafting innovative solutions inspired by nature. Discover outdoor products that bridge technology and the natural world.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        {GA_MEASUREMENT_ID && <GoogleAnalytics GA_MEASUREMENT_ID={GA_MEASUREMENT_ID} />}
        <WireframeLandscape />
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}