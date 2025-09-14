"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type SkyState =
  | "dawn"
  | "morning"
  | "day"
  | "afternoon"
  | "sunset"
  | "twilight"
  | "night";

const getSkyState = (): SkyState => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 10) return "morning";
  if (hour >= 10 && hour < 15) return "day";
  if (hour >= 15 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 19) return "sunset";
  if (hour >= 19 && hour < 21) return "twilight";
  return "night";
};

const skyGradients = {
  dawn: "linear-gradient(135deg, #ff9a8b 0%, #a8e6cf 25%, #ffd3a5 50%, #fd9853 100%)",
  morning: "linear-gradient(135deg, #83a4d4 0%, #b6fbff 50%, #ffffff 100%)",
  day: "linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #ffffff 100%)",
  afternoon: "linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #ffffff 100%)",
  sunset:
    "linear-gradient(135deg, #fa709a 0%, #fee140 25%, #ff6b6b 50%, #4ecdc4 100%)",
  twilight:
    "linear-gradient(135deg, #667db6 0%, #0082c8 25%, #667db6 50%, #0082c8 100%)",
  night:
    "linear-gradient(135deg, #2c3e50 0%, #34495e 25%, #2c3e50 50%, #34495e 100%)",
};

const textOverlays = {
  dawn: "rgba(247, 249, 247, 0.85)",
  morning: "rgba(247, 249, 247, 0.8)",
  day: "rgba(247, 249, 247, 0.75)",
  afternoon: "rgba(247, 249, 247, 0.8)",
  sunset: "rgba(247, 249, 247, 0.85)",
  twilight: "rgba(247, 249, 247, 0.9)",
  night: "rgba(247, 249, 247, 0.9)",
};

export default function NotFound() {
  const [skyState, setSkyState] = useState<SkyState>("day");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSkyState(getSkyState());

    const interval = setInterval(() => {
      setSkyState(getSkyState());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-start justify-center relative overflow-hidden pt-20 sm:pt-24 md:pt-32">
        {/* Dynamic Sky Background */}
        <div
          className="absolute inset-0 transition-all duration-[30s] ease-in-out"
          style={{
            background: skyGradients[skyState],
          }}
        />

        {/* Wireframe Mountain Layer */}
        <div
          className="absolute inset-0 transition-opacity duration-[30s] ease-in-out"
          style={{
            backgroundImage: 'url("/wireframe-timp-transparent.webp")',
            backgroundSize: "cover",
            backgroundPosition: "center 70%",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Text Readability Overlay */}
        <div
          className="absolute inset-0 transition-all duration-[30s] ease-in-out"
          style={{
            background: `linear-gradient(135deg, ${textOverlays[skyState]} 0%, ${textOverlays[skyState]} 50%, transparent 100%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-left px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="hero-mantra text-6xl md:text-7xl lg:text-8xl font-bold -mb-2">
              LOST IN THE
            </h1>
            <h1 className="hero-mantra text-6xl md:text-7xl lg:text-8xl font-bold mb-8">
              WILDERNESS
            </h1>
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-headline font-bold text-basalt max-w-2xl leading-tight mb-8">
            Looks like you&rsquo;ve wandered off the beaten path
          </h2>
          
          <p className="text-lg md:text-xl text-slate-storm mb-12 max-w-xl">
            Don&rsquo;t worry, even the best adventurers get turned around sometimes. 
            Let&rsquo;s get you back to familiar territory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-start">
            <Link
              href="/"
              className="btn-primary text-lg px-8 py-4"
            >
              Return to Basecamp
            </Link>
            <Link
              href="/products"
              className="btn-secondary text-lg px-8 py-4"
            >
              Explore Products
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}