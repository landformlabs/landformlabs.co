import type { Metadata } from "next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Landform Labs",
    default: "Landform Labs - Turn Your Adventures Into Tangible Proof",
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
    title: "Landform Labs - Turn Your Adventures Into Tangible Proof",
    description:
      "Transform your favorite outdoor memories into beautiful, personalized proof of your epic adventures.",
    images: [
      {
        url: "/route-tiles.webp",
        width: 1200,
        height: 630,
        alt: "Landform Labs - Adventure-inspired 3D printed keepsakes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Landform Labs - Turn Your Adventures Into Tangible Proof",
    description:
      "Transform your favorite outdoor memories into beautiful, personalized proof of your epic adventures.",
    images: ["/route-tiles.webp"],
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
      <head>
        {/* Optimize Google Fonts loading for better performance */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin=""
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Preload and load Google Fonts for optimal performance */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          as="style"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Trispace:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          as="style"
          crossOrigin=""
        />

        {/* Load the stylesheets immediately after preload */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Trispace:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          crossOrigin=""
        />
      </head>
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
              logo: "https://landformlabs.co/square-500.svg",
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
