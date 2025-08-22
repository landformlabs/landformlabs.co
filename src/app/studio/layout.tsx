import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Landform Labs Studio',
  description: 'Content management for Landform Labs',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}