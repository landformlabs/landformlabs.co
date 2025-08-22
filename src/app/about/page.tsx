import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - Our Story & Mission',
  description: 'Learn about Landform Labs\' mission to create nature-inspired products that connect people with the outdoors through innovative design.',
}

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-b from-white to-accent-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-800 to-primary-700 text-white">
        <div className="container mx-auto container-padding py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Story
            </h1>
            <p className="text-xl text-secondary-100">
              Born from a love of the outdoors and a passion for thoughtful design
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto container-padding section-padding">
        {/* Mission Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed">
              To create innovative products that bridge the gap between technology and nature, 
              helping people connect more deeply with the outdoor world around them.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At Landform Labs, we believe that the best innovations are inspired by nature itself. 
                Every product we create starts with observing the natural world and understanding 
                how we can enhance, rather than replace, our connection to it.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Whether it&apos;s a trail marker that helps you navigate like early explorers or a 
                weather station that connects you to the rhythms of the earth, our products are 
                designed to deepen your outdoor experience.
              </p>
            </div>
            <div className="bg-gradient-to-br from-secondary-100 to-primary-100 rounded-2xl p-8 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-4xl font-bold">LL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 text-center mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-secondary-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-secondary-800 mb-4">Sustainability</h3>
              <p className="text-gray-600">
                We use sustainable materials and ethical manufacturing processes, 
                respecting the environment that inspires our work.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-accent-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-accent-800 mb-4">Quality</h3>
              <p className="text-gray-600">
                Every product is carefully crafted to last, designed to be your trusted 
                companion on countless outdoor adventures.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary-800 mb-4">Innovation</h3>
              <p className="text-gray-600">
                We constantly explore new ways to enhance outdoor experiences through 
                thoughtful design and creative problem-solving.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div id="story" className="mb-20">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 text-center mb-12">
              How We Started
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  Landform Labs was born during a multi-day hiking trip in the Pacific Northwest. 
                  As we navigated challenging terrain using traditional tools, we realized there 
                  was an opportunity to create products that enhanced rather than complicated the 
                  outdoor experience.
                </p>
                <p>
                  What started as sketches around a campfire evolved into our first product: 
                  handcrafted trail markers that helped fellow hikers while respecting the 
                  natural environment. The positive response from the outdoor community 
                  encouraged us to expand our vision.
                </p>
                <p>
                  Today, we continue to draw inspiration from every outdoor adventure, whether 
                  it&apos;s a weekend camping trip or a month-long wilderness expedition. Each 
                  experience informs our design process and helps us create products that truly 
                  serve the outdoor community.
                </p>
                <div className="text-center pt-8">
                  <p className="text-secondary-800 font-semibold text-xl">
                    &quot;Design inspired by nature, crafted for adventure.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-2xl p-8 md:p-12 text-center border border-secondary-200">
          <h2 className="text-3xl font-bold text-secondary-800 mb-6">
            Join Our Journey
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            We&apos;re always excited to connect with fellow outdoor enthusiasts. 
            Follow our story, share your adventures, and be part of the Landform Labs community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="btn-primary">
              Get In Touch
            </a>
            <a href="/blog" className="btn-secondary">
              Read Our Blog
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}