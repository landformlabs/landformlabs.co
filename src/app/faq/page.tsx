"use client";

import { useState } from "react";
import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Note: Metadata export cannot be used in client components
// This would need to be moved to a separate metadata file in production

const faqs = [
  {
    category: "Materials & Quality",
    questions: [
      {
        question: "What materials are used for the 3D prints?",
        answer:
          "We use high-quality PLA plastic for all our 3D prints, ensuring durability and a premium feel and finish. PLA is eco-friendly and biodegradable, making it a great choice for environmentally conscious adventurers.",
      },
      {
        question: "How durable are the prints?",
        answer:
          "Our PLA prints are designed for indoor use and normal handling. They&rsquo;re quite durable for desk display, but we don&rsquo;t recommend leaving them in direct sunlight for extended periods or exposing them to extreme temperatures.",
      },
      {
        question: "What colors are available?",
        answer:
          "Route Tiles are available in Black (standard), Red, and Blue. Route Ornaments and State Ornaments come in premium white PLA for the best backlit effect. Custom prints can often accommodate special color requests - just ask!",
      },
    ],
  },
  {
    category: "Ordering & Customization",
    questions: [
      {
        question: "How do I submit my GPS data for a custom route print?",
        answer:
          "The easiest way to share is to provide a link to your activity on platforms like Strava, Garmin Connect, or Komoot. If you prefer, you can also email the .gpx file directly to sales@landformlabs.co",
      },
      {
        question:
          "I don&rsquo;t have GPS data. Can I still order a custom print?",
        answer:
          "Absolutely! If you have a specific route in mind but don&rsquo;t have the GPS data, we can help you recreate it. Just provide us with the details of the route, and we&rsquo;ll work with you to create a custom print.",
      },
      {
        question: "Can I customize the text on ornaments?",
        answer:
          "Yes! Both Route Ornaments and State Ornaments can be customized with text labels. This could be the trail name, date of your adventure, location, or any meaningful text you&rsquo;d like to include.",
      },
      {
        question: "What if my route is too complex or detailed?",
        answer:
          "Don&rsquo;t worry! Part of our process involves optimizing your route data to create the most beautiful and printable version. We&rsquo;ll clean up any GPS noise while preserving the character and key features of your adventure.",
      },
    ],
  },
  {
    category: "NFC Technology",
    questions: [
      {
        question: "How does the NFC feature work?",
        answer:
          "Each route tile comes with an embedded NFC chip. Simply tap your NFC-enabled smartphone to the tile in the corner indicated by the NFC icon on the back and it will link to your activity page (or whatever link you arranged during the order process).",
      },
      {
        question: "What phones support NFC?",
        answer:
          "Most modern smartphones support NFC, including recent iPhones and Android devices. The NFC feature is optional and doesn&rsquo;t affect the display or durability of your route tile if you don&rsquo;t use it.",
      },
      {
        question: "Can I change what the NFC chip links to?",
        answer:
          "The NFC chip is programmed during manufacturing with the link you specify. While the chip itself can&rsquo;t be reprogrammed easily, we can set it to link to any URL you provide during the ordering process.",
      },
    ],
  },
  {
    category: "Shipping & Timeline",
    questions: [
      {
        question: "What is the turnaround time for custom orders?",
        answer:
          "Turnaround time for custom orders is typically 1-2 weeks, depending on the complexity of the design and our current order volume. We will provide you with an estimated delivery date as we work through the details of the order.",
      },
      {
        question: "Do you ship internationally?",
        answer:
          "Yes! We ship worldwide from our US-based facility. International shipping times vary by location, and customers are responsible for any customs duties or taxes in their country.",
      },
      {
        question: "How is my order packaged?",
        answer:
          "We take great care in packaging your custom pieces. Each item is wrapped in protective materials and shipped in sturdy boxes to ensure they arrive safely. Ornaments include their hanging ribbons, and Route Tiles include their display stands.",
      },
    ],
  },
  {
    category: "Returns & Support",
    questions: [
      {
        question: "Do you accept returns or exchanges?",
        answer:
          "Due to the custom nature of our products, we do not accept returns or exchanges. However, if there is an issue with your order, please contact us at support@landformlabs.co and we will do our best to resolve it.",
      },
      {
        question: "What if there&rsquo;s a problem with my order?",
        answer:
          "We stand behind our work! If there&rsquo;s any issue with the quality, accuracy, or condition of your order, contact us immediately at support@landformlabs.co. We&rsquo;ll work with you to make it right.",
      },
      {
        question: "My NFC chip isn&rsquo;t working. What should I do?",
        answer:
          "First, make sure NFC is enabled on your phone and try tapping different spots on the tile. If it still doesn&rsquo;t work, contact us at support@landformlabs.co with your order details and we&rsquo;ll help troubleshoot or arrange a replacement.",
      },
    ],
  },
  {
    category: "Pricing & Payment",
    questions: [
      {
        question:
          "Why are custom pieces more expensive than mass-produced items?",
        answer:
          "Each piece is individually crafted based on your unique GPS data. This involves data processing, custom design work, individual 3D printing, quality control, and hand-finishing. You&rsquo;re not just buying a product - you&rsquo;re getting a personalized work of art that celebrates your specific adventure.",
      },
      {
        question: "Do you offer discounts for multiple items?",
        answer:
          "We occasionally offer promotions through our Etsy store and email list. For large custom orders or corporate requests, contact us directly at sales@landformlabs.co to discuss pricing.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "Through our Etsy store, we accept all major credit cards, PayPal, and other payment methods supported by Etsy. For direct orders, we can work with you on payment options - just reach out to discuss.",
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <div className="bg-alpine-mist py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold text-basalt sm:text-5xl lg:text-6xl">
                Frequently Asked{" "}
                <span className="text-gradient-adventure">Questions</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Everything you need to know about turning your epic adventures
                into awesome desk décor. Don&rsquo;t see your question?{" "}
                <a
                  href="/contact"
                  className="text-summit-sage font-headline font-semibold hover:text-summit-sage/80"
                >
                  Just ask us!
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Content */}
        <div className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-16">
                <h2 className="text-2xl font-headline font-bold text-basalt mb-8 pb-2 border-b-2 border-summit-sage/20">
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((faq, questionIndex) => {
                    const itemId = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems.includes(itemId);

                    return (
                      <div
                        key={questionIndex}
                        className="border border-slate-storm/10 rounded-lg"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-summit-sage/5 transition-colors duration-200 focus-ring rounded-lg"
                          aria-expanded={isOpen}
                        >
                          <h3 className="font-headline font-semibold text-basalt pr-8">
                            {faq.question}
                          </h3>
                          <svg
                            className={`flex-shrink-0 w-6 h-6 text-summit-sage transition-transform duration-200 ${
                              isOpen ? "transform rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p
                              className="text-slate-storm leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Still Have Questions Section */}
        <div className="bg-summit-sage py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-headline font-bold text-alpine-mist mb-6">
              Still Have Questions?
            </h2>
            <p className="text-lg text-alpine-mist/90 mb-8">
              We&rsquo;re here to help! Whether you need clarification on
              something above or have a totally new question, don&rsquo;t
              hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/contact"
                className="btn-primary bg-alpine-mist text-summit-sage hover:bg-alpine-mist/90"
              >
                Contact Us
              </a>
              <a
                href="mailto:hello@landformlabs.co"
                className="bg-transparent border-2 border-alpine-mist text-alpine-mist hover:bg-alpine-mist hover:text-summit-sage font-headline font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Email Us Directly
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-basalt py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-headline font-bold text-alpine-mist">
                Quick Links
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-center">
              <a
                href="/products"
                className="bg-alpine-mist/10 hover:bg-alpine-mist/20 text-alpine-mist py-3 px-4 rounded-lg transition-colors duration-200"
              >
                View Products
              </a>
              <a
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-alpine-mist/10 hover:bg-alpine-mist/20 text-alpine-mist py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Browse Etsy Store
              </a>
              <a
                href="/about"
                className="bg-alpine-mist/10 hover:bg-alpine-mist/20 text-alpine-mist py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Our Story
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
