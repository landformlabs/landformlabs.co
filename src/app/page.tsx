export default function Home() {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Clean, simple white background */}
      
      
      {/* Hero Section */}
      <div className="relative z-10">
        <div className="container mx-auto container-padding section-padding">
          <div className="text-center max-w-6xl mx-auto">
            {/* Main Headline */}
            <div className="mb-8">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-dynamic mb-4">
                <span className="text-adventure block transform -rotate-1">GET OUT</span>
                <span className="text-secondary-800 block transform rotate-1">THERE</span>
              </h1>
            </div>
            
            {/* Brand Tagline */}
            <div className="mb-12">
              <p className="text-2xl md:text-3xl lg:text-4xl font-adventure font-semibold text-gray-700 mb-6 leading-tight">
                <span className="text-accent-600">Amaze Yourself,</span>
                <span className="text-secondary-600 mx-3">Own It,</span>
                <span className="text-primary-600">Repeat.</span>
              </p>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                We craft innovative outdoor solutions that push you beyond your comfort zone. 
                Every product is designed to fuel your next adventure and help you discover what you&apos;re truly capable of.
              </p>
            </div>
            
            {/* Dynamic CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <button className="btn-adventure group">
                <span className="relative z-10">Start Your Adventure</span>
              </button>
              <button className="btn-secondary group">
                <span className="relative z-10">Discover Our Story</span>
              </button>
            </div>

            {/* Adventure Philosophy Cards */}
            <div className="grid md:grid-cols-3 gap-8 mt-20">
              <div className="adventure-card relative p-10 skew-element compass-accent" data-elevation="2,847m">
                <div className="unskew-element">
                  <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl mb-8 mx-auto flex items-center justify-center transform rotate-12 elevation-badge coordinate-grid">
                    <div className="w-10 h-10 bg-white rounded-lg transform -rotate-12"></div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-secondary-800 mb-6 trail-marker">Push Boundaries</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Every product is engineered to challenge your limits and expand what you thought possible in the outdoors.
                  </p>
                </div>
              </div>
              
              <div className="adventure-card relative p-10 transform rotate-1 compass-accent" data-elevation="3,142m">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl mb-8 mx-auto flex items-center justify-center transform -rotate-6 elevation-badge">
                  <div className="w-10 h-10 bg-white rounded-lg transform rotate-6"></div>
                </div>
                <h3 className="text-2xl font-display font-bold text-accent-800 mb-6 trail-marker">Own Your Journey</h3>
                <p className="text-gray-600 leading-relaxed">
                  Take control of your adventure with gear that adapts to your style and enhances your unique outdoor experience.
                </p>
              </div>
              
              <div className="adventure-card relative p-10 skew-element compass-accent" data-elevation="4,205m">
                <div className="unskew-element">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl mb-8 mx-auto flex items-center justify-center transform rotate-12 elevation-badge">
                    <div className="w-10 h-10 bg-white rounded-lg transform -rotate-12"></div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-primary-800 mb-6 trail-marker">Never Stop Exploring</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Built for the relentless explorer who knows that every ending is just the beginning of the next adventure.
                  </p>
                </div>
              </div>
            </div>

            {/* Coming Soon Section */}
            <div className="mt-24 relative">
              <div className="angled-section bg-gradient-adventure p-16 text-white text-center topographic-pattern">
                <div className="max-w-4xl mx-auto relative z-10">
                  <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                    Your Next Adventure Starts Here
                  </h2>
                  <p className="text-xl md:text-2xl mb-8 opacity-90">
                    We&apos;re crafting something extraordinary. Join the journey and be the first to experience 
                    gear that will redefine how you explore the world.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="bg-white text-secondary-600 font-bold py-4 px-8 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1">
                      Get Early Access
                    </button>
                    <button className="border-2 border-white text-white font-bold py-4 px-8 rounded-lg hover:bg-white hover:text-secondary-600 transition-all duration-300 transform hover:-translate-y-1">
                      Follow Our Progress
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}