import { Metadata } from 'next'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Products - Custom 3D Printed Adventure Mementos',
  description: 'Transform your GPS routes and favorite trails into beautiful 3D printed keepsakes. Route tiles, ornaments, pen holders, and custom prints available.',
  keywords: [
    'route tiles',
    'GPS route art',
    '3D printed ornaments',
    'mountain pen holders',
    'custom adventure prints',
    'outdoor gifts',
    'hiking memorabilia'
  ]
}

const products = [
  {
    id: 'route-tiles',
    name: 'Route Tiles',
    description: 'Customized square tiles featuring your unique GPS route in stunning 3D detail. Perfect for displaying your favorite hikes, bike rides, or runs.',
    features: [
      'Premium PLA plastic construction',
      'Built-in stand for easy display',
      'Embedded NFC chip links to your activity',
      'Available in multiple sizes'
    ],
    sizes: [
      { name: 'Basecamp', size: '100mm x 100mm', price: '$20' },
      { name: 'Ridgeline', size: '155mm x 155mm', price: '$40' },
      { name: 'Summit', size: '210mm x 210mm', price: '$60' }
    ],
    colors: [
      'Black (Standard)',
      'Red', 
      'Blue'
    ],
    etsy: 'https://landformlabs.etsy.com/listing/1772130512',
    image: '/route-tiles.JPG'
  },
  {
    id: 'route-ornaments',
    name: 'Route Ornaments',
    description: 'These ornaments feature your favorite GPS route in a compact, decorative form. Perfect for holiday trees, backpacks, or as a unique gift.',
    features: [
      'Premium white PLA plastic',
      'Stylistic ribbon for hanging',
      'Engraved route allows backlight to shine through',
      'Customizable with text labels'
    ],
    pricing: '$25',
    etsy: 'https://landformlabs.etsy.com/listing/1813900470',
    image: '/gpx-ornaments.jpeg'
  },
  {
    id: 'state-ornaments',
    name: 'State Ornaments',
    description: 'These ornaments feature the topographical profile of a given state. They look magnificent backlit on a Christmas tree or hanging in a window.',
    features: [
      'Premium white PLA plastic',
      'Stylistic ribbon for hanging',
      'Beautiful when backlit',
      'Customizable with text labels'
    ],
    pricing: '$10',
    etsy: null,
    image: '/state-ornaments.jpeg'
  },
  {
    id: 'mountain-pen-holders',
    name: 'Mountain Pen Holder',
    description: 'Celebrate local peaks or your favorite mountain ridge with a custom 3D-printed mountain pen holder.',
    features: [
      'Premium PLA plastic construction',
      'Designed for pens to fit naturally into landscape',
      'Custom mountain profiles available',
      'Perfect desk accessory'
    ],
    pricing: '$30',
    etsy: 'https://landformlabs.etsy.com/listing/1786366140',
    image: '/pen-holder.jpg'
  },
  {
    id: 'custom-prints',
    name: 'Custom Prints',
    description: 'Have a specific route, landmark, or design in mind? We can create custom 3D prints based on your GPS data or design ideas.',
    features: [
      'Fully customizable designs',
      'Work with any GPS data format',
      'Personal consultation included',
      'Unique one-of-a-kind pieces'
    ],
    pricing: 'Contact for Quote',
    etsy: 'https://landformlabs.etsy.com/listing/1819645585',
    image: '/route-tiles.JPG'
  }
]

export default function Products() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-4">
                <span className="brand-mantra text-2xl md:text-3xl">Get Out There</span>
              </div>
              <h1 className="text-4xl font-inter font-bold text-basalt sm:text-5xl lg:text-6xl">
                Your Adventures,{' '}
                <span className="text-gradient-adventure">Beautifully Crafted</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Transform your favorite outdoor memories into stunning 3D printed keepsakes. 
                Each piece is custom-made to celebrate your unique adventures.
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-alpine-mist py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-20">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  id={product.id}
                  className={`lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center ${
                    index % 2 === 1 ? 'lg:grid-flow-row-dense' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="bg-summit-sage/10 rounded-lg aspect-square overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className={`mt-8 lg:mt-0 ${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                    <h2 className="text-3xl font-inter font-bold text-basalt lg:text-4xl">
                      {product.name}
                    </h2>
                    <p className="mt-4 text-lg text-slate-storm leading-relaxed">
                      {product.description}
                    </p>

                    {/* Features */}
                    <div className="mt-6">
                      <h3 className="font-inter font-semibold text-basalt">Features:</h3>
                      <ul className="mt-2 space-y-2">
                        {product.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <span className="text-summit-sage mr-2">✓</span>
                            <span className="text-slate-storm text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sizing (Route Tiles only) */}
                    {product.sizes && (
                      <div className="mt-6">
                        <h3 className="font-inter font-semibold text-basalt">Available Sizes:</h3>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {product.sizes.map((size, sizeIndex) => (
                            <div key={sizeIndex} className="bg-summit-sage/5 rounded-lg p-4 text-center">
                              <h4 className="font-inter font-semibold text-basalt">{size.name}</h4>
                              <p className="text-sm text-slate-storm">{size.size}</p>
                              <p className="text-lg font-inter font-bold text-summit-sage">{size.price}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Color Options */}
                        <div className="mt-4">
                          <h4 className="font-inter font-semibold text-basalt text-sm">Route Colors:</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {product.colors.map((color, colorIndex) => (
                              <span 
                                key={colorIndex} 
                                className="bg-summit-sage/10 text-summit-sage px-3 py-1 rounded-full text-xs font-inter"
                              >
                                {color}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simple Pricing */}
                    {product.pricing && (
                      <div className="mt-6">
                        <span className="text-2xl font-inter font-bold text-summit-sage">
                          {product.pricing}
                        </span>
                      </div>
                    )}

                    {/* CTA Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      {product.etsy && (
                        <a
                          href={product.etsy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-center"
                        >
                          Order on Etsy
                        </a>
                      )}
                      <a
                        href="/contact"
                        className="btn-secondary text-center"
                      >
                        Ask Questions
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-summit-sage py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-inter font-bold text-alpine-mist sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-alpine-mist/90 max-w-2xl mx-auto">
                Getting your adventure turned into awesome desk décor is easier than that last summit push.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-alpine-mist rounded-full mx-auto">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="mt-4 text-xl font-inter font-semibold text-alpine-mist">
                  Share Your Route
                </h3>
                <p className="mt-2 text-alpine-mist/90">
                  Send us a link to your Strava, Garmin Connect, or Komoot activity, 
                  or email the .gpx file directly to sales@landformlabs.co
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-alpine-mist rounded-full mx-auto">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="mt-4 text-xl font-inter font-semibold text-alpine-mist">
                  We Create Magic
                </h3>
                <p className="mt-2 text-alpine-mist/90">
                  Our team transforms your GPS data into beautiful 3D art. 
                  We&rsquo;ll work with you to perfect every detail.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 bg-alpine-mist rounded-full mx-auto">
                  <span className="text-2xl">🎁</span>
                </div>
                <h3 className="mt-4 text-xl font-inter font-semibold text-alpine-mist">
                  Own Your Adventure
                </h3>
                <p className="mt-2 text-alpine-mist/90">
                  Receive your custom piece in 1-2 weeks. Display it proudly 
                  and remember: you&rsquo;re more badass than you think.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-basalt py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-inter font-bold text-alpine-mist sm:text-4xl">
              Ready to Turn Your Adventures Into Art?
            </h2>
            <p className="mt-4 text-lg text-alpine-mist/90">
              Don&rsquo;t let your most epic moments live only in your camera roll. 
              Let&rsquo;s create something awesome together.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Browse Our Etsy Store
              </a>
              <a
                href="/contact"
                className="bg-transparent border-2 border-alpine-mist text-alpine-mist hover:bg-alpine-mist hover:text-basalt font-inter font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Start Custom Order
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}