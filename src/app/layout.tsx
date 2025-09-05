import type { Metadata } from "next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Landform Labs",
    default: "Landform Labs - Turn Your Adventures Into Awesome Desk Décor",
  },
  icons: {
    icon: "/square-500.svg",
    shortcut: "/square-500.svg",
    apple: "/square-500.svg",
  },
  description:
    "Transform your favorite outdoor memories into beautiful, personalized proof of your epic adventures. From custom route prints to mountain-shaped desk accessories, we help outdoor enthusiasts keep their achievements alive.",
  keywords: [
    "3D printing",
    "outdoor gear",
    "custom route prints",
    "adventure memorabilia",
    "GPS route art",
    "hiking gifts",
    "cycling gifts",
    "mountain decor",
    "trail ornaments",
    "outdoor enthusiast gifts",
  ],
  authors: [{ name: "Landform Labs" }],
  creator: "Landform Labs",
  publisher: "Landform Labs",
  metadataBase: new URL("https://landformlabs.co"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://landformlabs.co",
    siteName: "Landform Labs",
    title: "Landform Labs - Turn Your Adventures Into Awesome Desk Décor",
    description:
      "Transform your favorite outdoor memories into beautiful, personalized proof of your epic adventures.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Landform Labs - Adventure-inspired 3D printed keepsakes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Landform Labs - Turn Your Adventures Into Awesome Desk Décor",
    description:
      "Transform your favorite outdoor memories into beautiful, personalized proof of your epic adventures.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-body antialiased min-h-screen relative">
        <GoogleAnalytics />
        {children}

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Landform Labs",
              url: "https://landformlabs.co",
              logo: "https://landformlabs.co/logo.png",
              description:
                "We create custom 3D printed proof that celebrates outdoor adventures, from route prints to mountain-shaped desk accessories.",
              foundingDate: "2024",
              sameAs: ["https://landformlabs.etsy.com"],
              contactPoint: {
                "@type": "ContactPoint",
                email: "hello@landformlabs.co",
                contactType: "Customer Service",
              },
              address: {
                "@type": "PostalAddress",
                addressCountry: "US",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
