import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Testimonials - What Our Customers Say',
  description: 'Read reviews and feedback from outdoor enthusiasts who use Landform Labs products on their adventures.',
}

export default function TestimonialsPage() {
  const testimonials = [
    {
      _id: '1',
      customerName: 'Sarah Chen',
      content: 'The trail markers have been a game-changer for our family hiking trips. They\'re beautifully made and have helped us mark our favorite routes. My kids love finding them on the trail!',
      rating: 5,
      product: 'Trail Marker Set',
      location: 'Portland, OR',
      image: null,
      date: '2024-01-20'
    },
    {
      _id: '2',
      customerName: 'Mike Rodriguez',
      content: 'I\'ve been using the weather station mini for 6 months now, and it\'s incredibly accurate. The build quality is outstanding - it survived a week in the North Cascades without any issues.',
      rating: 5,
      product: 'Weather Station Mini',
      location: 'Seattle, WA',
      image: null,
      date: '2024-01-18'
    },
    {
      _id: '3',
      customerName: 'Jessica Taylor',
      content: 'The wilderness journal has become an essential part of my backpacking gear. The weather-resistant pages have saved my notes through some pretty harsh conditions. Love the topographic cover design!',
      rating: 5,
      product: 'Wilderness Journal',
      location: 'Bend, OR',
      image: null,
      date: '2024-01-15'
    },
    {
      _id: '4',
      customerName: 'David Park',
      content: 'Ordered a custom compass mount for our expedition, and the team at Landform Labs exceeded expectations. The attention to detail and quick turnaround were impressive.',
      rating: 5,
      product: 'Custom Order',
      location: 'Vancouver, BC',
      image: null,
      date: '2024-01-12'
    },
    {
      _id: '5',
      customerName: 'Emily Watson',
      content: 'The camp light diffuser is brilliant! It transforms my harsh headlamp into perfect ambient lighting for camp. So simple yet so effective. Wish I had discovered this years ago.',
      rating: 5,
      product: 'Camp Light Diffuser',
      location: 'Boulder, CO',
      image: null,
      date: '2024-01-10'
    },
    {
      _id: '6',
      customerName: 'Alex Johnson',
      content: 'These topographic coasters are conversation starters at every gathering. The laser engraving is precise and the quality is exceptional. Perfect gift for any outdoor enthusiast.',
      rating: 4,
      product: 'Topographic Coaster Set',
      location: 'Missoula, MT',
      image: null,
      date: '2024-01-08'
    },
    {
      _id: '7',
      customerName: 'Lisa Martinez',
      content: 'The field sketching kit is compact yet comprehensive. I\'ve taken it on three backpacking trips now, and it\'s helped me capture so many beautiful moments from the trail.',
      rating: 5,
      product: 'Field Sketching Kit',
      location: 'Denver, CO',
      image: null,
      date: '2024-01-05'
    },
    {
      _id: '8',
      customerName: 'Tom Anderson',
      content: 'Outstanding customer service and product quality. Had an issue with shipping, and the team resolved it immediately. The product exceeded my expectations. Highly recommend!',
      rating: 5,
      product: 'Trail Marker Set',
      location: 'Spokane, WA',
      image: null,
      date: '2024-01-03'
    }
  ]

  const averageRating = testimonials.reduce((sum, testimonial) => sum + testimonial.rating, 0) / testimonials.length

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'text-accent-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  return (
    <div className="bg-gradient-to-b from-white to-accent-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-700 to-primary-600 text-white">
        <div className="container mx-auto container-padding py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Customer Stories
            </h1>
            <p className="text-xl text-secondary-100 mb-8">
              Hear from outdoor enthusiasts who use our products on their adventures.
            </p>
            
            {/* Rating Summary */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {renderStars(Math.round(averageRating))}
                </div>
                <span className="text-2xl font-bold">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-secondary-200">
                Based on {testimonials.length} reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto container-padding section-padding">
        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex mr-2">
                  {renderStars(testimonial.rating)}
                </div>
                <span className="text-sm text-gray-500 ml-auto">
                  {new Date(testimonial.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Content */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                &quot;{testimonial.content}&quot;
              </blockquote>

              {/* Customer Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.customerName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.location}
                  </div>
                </div>
                
                {/* Product Badge */}
                <div className="ml-4">
                  <span className="inline-block text-xs font-medium text-secondary-600 bg-secondary-100 px-3 py-1 rounded-full">
                    {testimonial.product}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-800 mb-2">98%</div>
            <div className="text-gray-600">Customer Satisfaction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-800 mb-2">500+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-800 mb-2">4.9</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-800 mb-2">1000+</div>
            <div className="text-gray-600">Adventures Supported</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-2xl p-8 md:p-12 text-center border border-secondary-200">
          <h2 className="text-3xl font-bold text-secondary-800 mb-6">
            Join Our Community
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Become part of the Landform Labs family. Share your outdoor adventures 
            and discover products that enhance your connection with nature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/products" className="btn-primary">
              Shop Products
            </a>
            <a href="/contact" className="btn-secondary">
              Share Your Story
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}