'use client'

import { useState } from 'react'

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    )
  }

  const faqData = [
    {
      category: "Products & Ordering",
      questions: [
        {
          question: "What materials do you use in your products?",
          answer: "We use sustainably sourced materials including responsibly harvested woods, recycled metals, and eco-friendly finishes. Each product description includes detailed material information."
        },
        {
          question: "Do you offer custom products?",
          answer: "Yes! We love creating custom pieces tailored to your specific outdoor needs. Contact us with your ideas, and we'll work with you to bring them to life. Custom orders typically take 2-4 weeks depending on complexity."
        },
        {
          question: "Can I see products in person before ordering?",
          answer: "While we don't have a physical storefront, we occasionally participate in outdoor gear shows and maker fairs in the Pacific Northwest. Follow our blog and social media for upcoming events."
        },
        {
          question: "Are your products weather-resistant?",
          answer: "Most of our products are designed for outdoor use and treated with weather-resistant finishes. Specific weatherproofing details are included in each product description."
        }
      ]
    },
    {
      category: "Shipping & Returns",
      questions: [
        {
          question: "Where do you ship?",
          answer: "We ship throughout the United States and Canada. International shipping is available for select products - contact us for details and shipping quotes."
        },
        {
          question: "How long does shipping take?",
          answer: "Standard shipping takes 5-7 business days within the US. Expedited shipping (2-3 business days) is available for most items. Custom orders ship 2-4 weeks after order confirmation."
        },
        {
          question: "What is your return policy?",
          answer: "We offer a 30-day return policy for unused items in original condition. Custom orders are final sale unless there's a defect. Return shipping costs are covered by the customer unless the item is defective."
        },
        {
          question: "Do you offer exchanges?",
          answer: "Yes, we're happy to exchange items within 30 days of purchase. Contact us before sending anything back to arrange the exchange."
        }
      ]
    },
    {
      category: "Care & Maintenance",
      questions: [
        {
          question: "How do I care for wooden products?",
          answer: "Clean with a damp cloth and mild soap when needed. For outdoor items, we recommend reapplying protective finish annually. Detailed care instructions are included with each wooden product."
        },
        {
          question: "What if my product gets damaged?",
          answer: "We stand behind our craftsmanship. If a product fails due to manufacturing defects within the first year, we'll repair or replace it free of charge. Contact us with photos of the damage."
        },
        {
          question: "Can products be repaired?",
          answer: "Absolutely! We believe in making products that last. Many items can be refurbished or repaired. Send us photos and we'll let you know what's possible and provide a repair quote."
        }
      ]
    },
    {
      category: "Wholesale & Business",
      questions: [
        {
          question: "Do you offer wholesale pricing?",
          answer: "Yes, we work with outdoor retailers, guide services, and other businesses. Wholesale pricing is available for orders of 10+ units. Contact us for our wholesale catalog and pricing."
        },
        {
          question: "Can you create products for corporate gifts?",
          answer: "We love creating custom corporate gifts that reflect your company's connection to the outdoors. We can customize existing products or create something entirely new with your branding."
        },
        {
          question: "Do you offer affiliate partnerships?",
          answer: "We partner with outdoor bloggers, guides, and content creators who align with our values. If you&apos;re interested in featuring our products, please reach out through our contact form."
        }
      ]
    }
  ]

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-secondary-700 to-primary-600 text-white">
        <div className="container mx-auto container-padding py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-secondary-100">
              Find answers to common questions about our products, orders, and services.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto container-padding section-padding">
        <div className="max-w-4xl mx-auto">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-secondary-800 mb-8">
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const globalIndex = categoryIndex * 100 + questionIndex
                  const isOpen = openItems.includes(globalIndex)
                  
                  return (
                    <div
                      key={questionIndex}
                      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-inset"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          <div className="flex-shrink-0">
                            <svg
                              className={`w-5 h-5 text-secondary-600 transition-transform duration-200 ${
                                isOpen ? 'transform rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-gray-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-secondary-50 to-primary-50 rounded-2xl p-8 md:p-12 text-center border border-secondary-200 mt-16">
            <h2 className="text-3xl font-bold text-secondary-800 mb-6">
              Still Have Questions?
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Can&apos;t find what you&apos;re looking for? We&apos;re here to help! 
              Reach out with any questions about our products, custom orders, or anything else.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="btn-primary">
                Contact Us
              </a>
              <a
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Visit Our Shop
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}