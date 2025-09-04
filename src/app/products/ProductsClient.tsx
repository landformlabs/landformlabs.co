'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

interface Product {
  _id?: string
  id?: number
  name: string
  description: string
  shortDescription?: string
  price: string
  category: string
  images?: any[]
  image?: string
  etsyUrl: string
  inStock?: boolean
  featured?: boolean
  slug?: { current: string }
}

interface ProductsClientProps {
  sanityProducts: Product[]
  categories: string[]
}

export default function ProductsClient({ sanityProducts, categories }: ProductsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Sample hardcoded products for fallback/demo
  const fallbackProducts: Product[] = [
    {
      id: 1,
      name: 'Trail Marker Set',
      description: 'Handcrafted trail markers made from sustainable materials, perfect for marking your favorite outdoor routes.',
      price: '$45.00',
      category: 'Navigation',
      image: '/api/placeholder/300/300',
      etsyUrl: 'https://landformlabs.etsy.com',
    },
    {
      id: 2,
      name: 'Wilderness Journal',
      description: 'Weather-resistant journal for documenting your outdoor adventures, featuring topographic map covers.',
      price: '$28.00',
      category: 'Documentation',
      image: '/api/placeholder/300/300',
      etsyUrl: 'https://landformlabs.etsy.com',
    }
  ]

  const products = sanityProducts.length > 0 ? sanityProducts : fallbackProducts
  
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory)

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      // Sanity image
      return urlFor(product.images[0]).width(400).height(400).url()
    }
    // Fallback image
    return product.image || '/api/placeholder/300/300'
  }

  const getProductDescription = (product: Product) => {
    return product.shortDescription || product.description
  }

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-4 mb-16">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-8 py-4 rounded-xl border-2 transition-all duration-300 font-adventure font-semibold ${
              selectedCategory === category
                ? 'bg-secondary-600 text-white border-secondary-600 shadow-lg'
                : 'border-secondary-300 text-secondary-700 hover:bg-secondary-600 hover:text-white hover:border-secondary-600 hover:shadow-lg'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {filteredProducts.map((product) => (
          <div
            key={product._id || product.id}
            className="adventure-card overflow-hidden relative group"
          >
            <div className="aspect-square bg-gradient-to-br from-accent-100 to-secondary-100 flex items-center justify-center overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={getProductImage(product)}
                  alt={product.images[0].alt || product.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-secondary-400 to-primary-400 rounded-xl flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">LL</span>
                </div>
              )}
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-adventure font-semibold text-accent-600 bg-accent-100 px-4 py-2 rounded-full transform rotate-1">
                  {product.category}
                </span>
                <span className="text-xl font-display font-bold text-secondary-800">
                  {product.price}
                </span>
                {product.inStock === false && (
                  <span className="text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full ml-2">
                    Out of Stock
                  </span>
                )}
              </div>
              
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-4 group-hover:text-secondary-800 transition-colors duration-300">
                {product.name}
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                {getProductDescription(product)}
              </p>
              
              <a
                href={product.etsyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-center transition-all duration-300 ${
                  product.inStock === false
                    ? 'btn-secondary opacity-50 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {product.inStock === false ? 'Currently Unavailable' : 'Get Out There'}
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}