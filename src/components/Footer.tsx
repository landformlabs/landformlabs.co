import Link from "next/link";
import Image from "next/image";

const navigation = {
  main: [
    { name: "Products", href: "/products" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
  ],
};

export default function Footer() {
  return (
    <footer
      className="bg-basalt text-alpine-mist"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="lg:flex lg:items-start lg:justify-between lg:space-x-12">
          {/* Brand Section - Left Justified */}
          <div className="lg:flex-shrink-0 lg:max-w-md">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image
                src="/square-500.svg"
                alt="Landform Labs"
                width={40}
                height={40}
                className="w-10 h-10 invert"
              />
              <div className="flex flex-col">
                <span className="font-headline font-bold text-xl">
                  Landform Labs
                </span>
                <span className="get-out-there text-xs -mt-1 text-alpine-mist">
                  Get Out There
                </span>
              </div>
            </Link>

            <p className="text-sm text-alpine-mist/80 mb-4">
              Transform your adventures into personalized proof of your epic
              achievements. Get Out There, Amaze Yourself, Own It, Repeat.
            </p>

            {/* Consolidated Contact Info */}
            <div className="space-y-2">
              <p className="text-sm text-alpine-mist/80">
                <a
                  href="mailto:hello@landformlabs.co"
                  className="hover:text-alpine-mist transition-colors duration-200"
                >
                  hello@landformlabs.co
                </a>
              </p>
              <p className="text-sm text-alpine-mist/80">
                <a
                  href="https://landformlabs.etsy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-alpine-mist transition-colors duration-200"
                >
                  landformlabs.etsy.com
                </a>
              </p>
            </div>
          </div>

          {/* Horizontal Navigation Links - Aligned Right */}
          <div className="mt-8 lg:mt-0 lg:flex-shrink-0">
            <nav>
              <ul className="flex flex-wrap gap-6 lg:gap-8 justify-start lg:justify-end">
                {navigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-alpine-mist/80 hover:text-alpine-mist transition-colors duration-200 font-medium"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t border-alpine-mist/20 pt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <Link
                href="/privacy"
                className="text-sm text-alpine-mist/60 hover:text-alpine-mist/80 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-alpine-mist/60 hover:text-alpine-mist/80 transition-colors duration-200"
              >
                Terms of Service
              </Link>
            </div>
            <p className="mt-8 text-sm text-alpine-mist/60 md:mt-0 md:order-1">
              &copy; {new Date().getFullYear()} Landform Labs. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
