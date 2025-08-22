import type { Metadata } from 'next'
// import { client, queries } from '@/lib/sanity'

export const metadata: Metadata = {
  title: 'Blog - Outdoor Stories & Insights',
  description: 'Read about our latest adventures, product development insights, and outdoor tips from the Landform Labs team.',
}

export default async function BlogPage() {
  // For now, we'll use static content. Replace with Sanity data when ready:
  // const posts = await client.fetch(queries.allPosts)

  const samplePosts = [
    {
      _id: '1',
      title: 'Designing for the Trail: Our Approach to Outdoor Product Development',
      slug: { current: 'designing-for-the-trail' },
      publishedAt: '2024-01-15',
      excerpt: 'How we use real outdoor experiences to inform every design decision, from initial concept to final product.',
      author: 'Landform Labs Team',
      categories: ['Design', 'Process'],
      mainImage: null,
    },
    {
      _id: '2',
      title: 'Sustainable Materials in Outdoor Gear: What We\'ve Learned',
      slug: { current: 'sustainable-materials-outdoor-gear' },
      publishedAt: '2024-01-08',
      excerpt: 'Exploring eco-friendly alternatives to traditional outdoor gear materials and their real-world performance.',
      author: 'Landform Labs Team',
      categories: ['Sustainability', 'Materials'],
      mainImage: null,
    },
    {
      _id: '3',
      title: 'Pacific Northwest Winter Testing: Field Notes',
      slug: { current: 'pacific-northwest-winter-testing' },
      publishedAt: '2024-01-01',
      excerpt: 'Our latest products get put through their paces in the challenging winter conditions of the Pacific Northwest.',
      author: 'Landform Labs Team',
      categories: ['Testing', 'Adventure'],
      mainImage: null,
    },
    {
      _id: '4',
      title: 'The Story Behind Our Trail Marker System',
      slug: { current: 'story-behind-trail-marker-system' },
      publishedAt: '2023-12-20',
      excerpt: 'From a simple need on a backcountry hike to our most popular product - the journey of creating our trail markers.',
      author: 'Landform Labs Team',
      categories: ['Product Story', 'Design'],
      mainImage: null,
    },
  ]

  const categories = ['All', 'Design', 'Process', 'Sustainability', 'Materials', 'Testing', 'Adventure', 'Product Story']

  return (
    <div className="bg-gradient-to-b from-white to-accent-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-700 to-primary-600 text-white">
        <div className="container mx-auto container-padding py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Stories from the Trail
            </h1>
            <p className="text-xl text-secondary-100">
              Adventures, insights, and behind-the-scenes looks at how we create products inspired by nature.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto container-padding section-padding">
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              className="px-5 py-2 text-sm rounded-full border-2 border-secondary-300 text-secondary-700 hover:bg-secondary-600 hover:text-white hover:border-secondary-600 transition-all duration-200 font-medium"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {samplePosts.map((post) => (
            <article
              key={post._id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              {/* Featured Image Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-secondary-100 to-primary-100 flex items-center justify-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-primary-400 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>
              
              <div className="p-6">
                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.map((category) => (
                    <span
                      key={category}
                      className="text-xs font-medium text-accent-600 bg-accent-100 px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                
                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  <a
                    href={`/blog/${post.slug.current}`}
                    className="hover:text-secondary-600 transition-colors duration-200"
                  >
                    {post.title}
                  </a>
                </h2>
                
                {/* Excerpt */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                
                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{post.author}</span>
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-2xl p-8 md:p-12 text-center border border-secondary-200">
          <h2 className="text-3xl font-bold text-secondary-800 mb-6">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Get notified when we publish new stories, product updates, and outdoor insights.
          </p>
          
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-colors"
              required
            />
            <button
              type="submit"
              className="btn-primary whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          
          <p className="text-sm text-gray-500 mt-4">
            No spam, just outdoor stories and product updates. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  )
}