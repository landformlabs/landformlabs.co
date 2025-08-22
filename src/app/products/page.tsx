import type { Metadata } from 'next'
import { client, queries } from '@/lib/sanity'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
  title: 'Products - Nature-Inspired Innovation',
  description: 'Discover our collection of handcrafted outdoor products, designed with nature in mind. Shop directly through our Etsy store.',
}

async function getProducts() {
  try {
    const products = await client.fetch(queries.allProducts)
    return products || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export default async function ProductsPage() {
  const sanityProducts = await getProducts()
  
  // Get unique categories from products, plus 'All'
  const productCategories = sanityProducts.length > 0 
    ? [...new Set(sanityProducts.map((product: any) => product.category).filter(Boolean))] as string[]
    : ['Navigation', 'Documentation', 'Lighting', 'Home & Camp', 'Instruments']
  
  const categories = ['All', ...productCategories]

  return (
    <div className="bg-gradient-to-b from-white to-accent-50 exploration-grid">
      {/* Hero Section */}
      <div className="relative angled-section bg-gradient-adventure text-white overflow-hidden topographic-pattern">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-white rounded-full blur-xl"></div>
        </div>
        <div className="relative z-10 container mx-auto container-padding py-24">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-display font-black text-dynamic mb-8">
              <span className="block transform -rotate-1">GEAR THAT</span>
              <span className="block transform rotate-1">INSPIRES</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 font-medium leading-relaxed opacity-95">
              Every piece designed to push your limits, expand your horizons, and fuel your passion for the outdoors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-adventure"
              >
                Shop The Collection
              </a>
              <button className="border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-secondary-600 transition-all duration-300 transform hover:-translate-y-1">
                Get Early Access
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto container-padding section-padding">
        <ProductsClient sanityProducts={sanityProducts} categories={categories} />

        {/* CTA Section */}
        <div className="relative angled-section bg-gradient-dawn p-16 md:p-20 text-center border-2 border-secondary-200 overflow-hidden exploration-grid">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-secondary-400 to-primary-400 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-r from-accent-400 to-secondary-400 rounded-full blur-lg"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-800 mb-8">
              Ready for Something <span className="text-adventure">Custom?</span>
            </h2>
            <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Every adventure is unique. Let&apos;s craft something that&apos;s perfectly tailored to your next expedition and pushes you to new heights.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="/contact"
                className="btn-adventure"
              >
                Start Your Custom Journey
              </a>
              <a
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Explore Full Collection
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}