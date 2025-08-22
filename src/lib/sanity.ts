import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// These will be set up when you create your Sanity project
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // set to false if you want to ensure fresh data
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// GROQ queries for different content types
export const queries = {
  // Blog posts
  allPosts: `*[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    "author": author->name,
    "categories": categories[]->title,
    mainImage,
    body
  }`,
  
  postBySlug: `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    "author": author->name,
    "categories": categories[]->title,
    mainImage,
    body
  }`,

  // Products (if you want to manage them via CMS)
  allProducts: `*[_type == "product"] | order(_createdAt desc) {
    _id,
    name,
    slug,
    description,
    price,
    category,
    images,
    etsyUrl,
    featured
  }`,

  // Testimonials
  allTestimonials: `*[_type == "testimonial"] | order(_createdAt desc) {
    _id,
    customerName,
    content,
    rating,
    product,
    location,
    image
  }`,

  // Site settings
  siteSettings: `*[_type == "siteSettings"][0] {
    title,
    description,
    keywords,
    socialMedia,
    contactInfo
  }`
}