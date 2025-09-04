"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "FAQ", href: "/faq" },
  { name: "Testimonials", href: "/testimonials" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-alpine-mist/95 backdrop-blur-md shadow-sm border-b border-summit-sage/20">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/square-500.svg"
                alt="Landform Labs"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <div className="flex flex-col">
                <span className="font-headline font-bold text-xl text-basalt">
                  Landform Labs
                </span>
                <span className="get-out-there text-xs -mt-1">
                  Get Out There
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="font-headline font-medium text-basalt hover:text-summit-sage transition-colors duration-200 focus-ring rounded-md px-3 py-2"
                >
                  {item.name}
                </Link>
              ))}

              {/* CTA Button */}
              <Link href="/products" className="btn-primary">
                Shop Now
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-basalt hover:text-summit-sage focus-ring rounded-md p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-alpine-mist/95 backdrop-blur-md border-t border-summit-sage/20">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block font-headline font-medium text-basalt hover:text-summit-sage hover:bg-summit-sage/5 focus-ring rounded-md px-3 py-2 transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-2">
                <Link
                  href="/products"
                  className="btn-primary w-full text-center block"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
