import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroWireframe from "@/components/HeroWireframe";

const features = [
  {
    name: "Route Tiles",
    description:
      "Transform your favorite GPS routes into stunning 3D printed art with NFC technology.",
    href: "/products#route-tiles",
    image: "/route-tiles.webp",
  },
  {
    name: "Adventure Ornaments",
    description:
      "Holiday decorations that celebrate your epic adventures, perfect for trees or windows.",
    href: "/products#route-ornaments",
    image: "/gpx-ornaments.webp",
  },
  {
    name: "Custom Keepsakes",
    description:
      "Personalized proof of your most meaningful outdoor moments and achievements.",
    href: "/products#custom-prints",
    image: "/custom-print.webp",
  },
  {
    name: "Desk Accessories",
    description:
      "Mountain-shaped pen holders and organizers that bring adventure to your workspace.",
    href: "/products#mountain-pen-holders",
    image: "/pen-holder.webp",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <HeroWireframe />
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
              <div className="pt-20 mx-auto max-w-7xl px-4 sm:pt-24 sm:px-6 md:pt-28 lg:pt-32 lg:px-8 xl:pt-40">
                <div className="text-left">
                  <h1 className="hero-mantra text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8">
                    GET OUT THERE
                  </h1>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-headline font-bold text-basalt max-w-4xl leading-tight">
                    Transform your adventures into personalized proof of your
                    epic achievements
                  </h2>
                  <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <Link
                      href="/products"
                      className="btn-primary text-lg px-8 py-4"
                    >
                      Shop
                    </Link>
                    <Link
                      href="/about"
                      className="btn-secondary text-lg px-8 py-4"
                    >
                      Our Story
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Mantra Section */}
        <div className="min-h-[300px] bg-summit-sage flex items-center justify-center py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-4">
                <span className="brand-mantra text-3xl md:text-4xl text-alpine-mist">
                  Get Out There
                </span>
              </div>
              <h2 className="text-2xl font-headline font-bold text-alpine-mist sm:text-3xl">
                Amaze Yourself, Own It, Repeat
              </h2>
              <p className="mt-4 text-lg text-alpine-mist/90">
                We&rsquo;re here for the &ldquo;Own It&rdquo; part. After
                you&rsquo;ve gotten out there and amazed yourself, you deserve
                something tangible to prove it happened.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-24 bg-alpine-mist/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <p className="mt-2 text-3xl leading-8 font-headline font-bold tracking-tight text-basalt sm:text-4xl">
                Your Adventures, Beautifully Crafted
              </p>
              <p className="mt-4 max-w-2xl text-xl text-slate-storm lg:mx-auto">
                You took the time to train and prepare. We take the time to make
                sure you have unique proof of your accomplishments.
              </p>
            </div>

            <div className="mt-20">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-4">
                {features.map((feature) => (
                  <Link
                    key={feature.name}
                    href={feature.href}
                    className="relative group hover:bg-summit-sage/5 p-6 rounded-lg transition-colors duration-200"
                  >
                    <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-summit-sage/5">
                      <Image
                        src={feature.image}
                        alt={feature.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <dt>
                      <p className="text-lg leading-6 font-headline font-semibold text-basalt group-hover:text-summit-sage transition-colors duration-200">
                        {feature.name}
                      </p>
                    </dt>
                    <dd className="mt-2 text-base text-slate-storm">
                      {feature.description}
                    </dd>
                  </Link>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-basalt">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-headline font-bold text-alpine-mist sm:text-4xl">
              <span className="block">Ready to Own Your Adventures?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-alpine-mist/90">
              Your most epic moments deserve more than a fading memory.
              Let&rsquo;s turn those GPS breadcrumbs into something awesome.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent border-2 border-alpine-mist text-alpine-mist hover:bg-alpine-mist hover:text-basalt font-headline font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Visit Our Etsy
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
