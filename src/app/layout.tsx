import type { Metadata } from "next";
import { Poppins, Trispace, EB_Garamond } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
});

const trispace = Trispace({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-trispace",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Landform Labs",
    default: "Landform Labs - Turn Your Adventures Into Tangible Proof",
  },
  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#7a8471",
      },
    ],
  },
  manifest: "/site.webmanifest",
  description:
    "Transform your outdoor adventures into beautiful 3D-printed keepsakes. Upload your GPS data and create custom route tiles, ornaments, and desk accessories that celebrate your epic journeys.",
  keywords: [
    "3D printing",
    "GPS route",
    "outdoor adventure",
    "custom prints",
    "hiking",
    "cycling",
    "running",
    "trail",
    "mountain",
    "keepsakes",
    "personalized",
    "route tile",
    "ornament",
    "desk accessories",
  ],
  authors: [{ name: "Landform Labs", url: "https://landformlabs.co" }],
  creator: "Landform Labs",
  publisher: "Landform Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://landformlabs.co"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Landform Labs - Turn Your Adventures Into Tangible Proof",
    description:
      "Transform your outdoor adventures into beautiful 3D-printed keepsakes. Upload your GPS data and create custom route tiles, ornaments, and desk accessories.",
    url: "https://landformlabs.co",
    siteName: "Landform Labs",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Landform Labs - Custom 3D printed adventure keepsakes",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Landform Labs - Turn Your Adventures Into Tangible Proof",
    description:
      "Transform your outdoor adventures into beautiful 3D-printed keepsakes. Upload your GPS data and create custom route tiles, ornaments, and desk accessories.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="msapplication-TileColor" content="#7a8471" />
        <meta name="theme-color" content="#7a8471" />
        {/* Fonts are now optimized via next/font/google */}
      </head>
      <body
        className={`${trispace.variable} ${poppins.variable} ${ebGaramond.variable} font-body antialiased min-h-screen relative`}
      >
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
