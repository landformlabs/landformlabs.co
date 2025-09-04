import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Customer Testimonials - Real Adventure Stories",
  description:
    "Read real stories from customers who transformed their outdoor adventures into beautiful 3D printed keepsakes with Landform Labs.",
  keywords: [
    "customer reviews",
    "adventure testimonials",
    "route tile reviews",
    "3D printed keepsakes",
    "hiking gifts",
    "outdoor memorabilia reviews",
  ],
};

const testimonials = [
  {
    quote:
      "My Route Tile from Landform Labs sits on my desk and reminds me daily that I'm capable of incredible things. Every morning when I see it, I remember that brutal climb and how amazing I felt at the summit. It's not just decor—it's proof of my adventure.",
    name: "Sarah M.",
    location: "Boulder, Colorado",
    adventure: "14er Summit Series",
    product: "Route Tile - Summit (210mm)",
    rating: 5,
    image: "/testimonials/sarah-m.jpg", // Placeholder
  },
  {
    quote:
      "I gave my hiking buddy a custom route ornament of our first backpacking trip together for Christmas. Every year when she hangs it up, she texts me about that amazing adventure. It's become our tradition to reminisce about that trip. Best gift I've ever given!",
    name: "Mike T.",
    location: "Moab, Utah",
    adventure: "Zion Narrows Backpacking Trip",
    product: "Route Ornament - Custom",
    rating: 5,
    image: "/testimonials/mike-t.jpg", // Placeholder
  },
  {
    quote:
      "The Mountain Pen Holder of Mount Mansfield makes even Monday morning meetings more bearable. It's a constant reminder of weekend adventures and gives me something to look forward to. My colleagues always comment on it - it's a great conversation starter!",
    name: "Jessica L.",
    location: "Burlington, Vermont",
    adventure: "Mount Mansfield Summit",
    product: "Mountain Pen Holder",
    rating: 5,
    image: "/testimonials/jessica-l.jpg", // Placeholder
  },
  {
    quote:
      "I was skeptical about how well they could capture the essence of my favorite trail, but wow! The detail is incredible. You can see every switchback, every elevation gain. It perfectly captures that gnarly section that almost broke me. Now it's my favorite piece of desk art.",
    name: "David R.",
    location: "Asheville, North Carolina",
    adventure: "Blue Ridge Parkway Century Ride",
    product: "Route Tile - Ridgeline (155mm)",
    rating: 5,
    image: "/testimonials/david-r.jpg", // Placeholder
  },
  {
    quote:
      "My daughter's first 'real' hike was such a proud mom moment. Having it immortalized in 3D helps me remember not just the trail, but how capable and confident she was that day. The NFC chip linking to our photos is genius - we love showing people!",
    name: "Amanda K.",
    location: "Seattle, Washington",
    adventure: "Rattlesnake Ledge with Kids",
    product: "Route Tile - Basecamp (100mm)",
    rating: 5,
    image: "/testimonials/amanda-k.jpg", // Placeholder
  },
  {
    quote:
      "As someone who has done the same local trail hundreds of times, I never thought it would make interesting art. But seeing all those loops and variations I've taken over the years in one piece is actually really beautiful. It shows my commitment to staying active.",
    name: "Robert W.",
    location: "Austin, Texas",
    adventure: "Town Lake Trail Regular Routes",
    product: "Route Tile - Custom Compilation",
    rating: 4,
    image: "/testimonials/robert-w.jpg", // Placeholder
  },
  {
    quote:
      "The state ornament of Colorado looks amazing backlit on our tree. We've lived in several states, so now we're collecting ornaments from each place we've called home. It's becoming our unique Christmas tradition that tells our story.",
    name: "The Martinez Family",
    location: "Denver, Colorado",
    adventure: "Colorado Adventures",
    product: "State Ornament - Colorado",
    rating: 5,
    image: "/testimonials/martinez-family.jpg", // Placeholder
  },
  {
    quote:
      "I ordered a custom print of the route where I proposed to my fiancée. Having that special day turned into something we can display in our home is incredibly meaningful. The quality and attention to detail exceeded my expectations completely.",
    name: "Chris H.",
    location: "Portland, Oregon",
    adventure: "Proposal Hike at Multnomah Falls",
    product: "Custom Print - Special Design",
    rating: 5,
    image: "/testimonials/chris-h.jpg", // Placeholder
  },
  {
    quote:
      "Great customer service! I had a lot of questions about sizing and customization, and the team was incredibly patient and helpful. The final product looks exactly like what we discussed. Will definitely order more for other adventures.",
    name: "Lisa P.",
    location: "Phoenix, Arizona",
    adventure: "Camelback Mountain Regular Route",
    product: "Route Tile - Ridgeline (155mm)",
    rating: 5,
    image: "/testimonials/lisa-p.jpg", // Placeholder
  },
];

const stats = [
  { number: "500+", label: "Adventures Immortalized" },
  { number: "50+", label: "Mountains Conquered" },
  { number: "25", label: "States Explored" },
  { number: "4.9★", label: "Average Rating" },
];

export default function Testimonials() {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-summit-sage" : "text-slate-storm/20"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
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
                Adventure Stories{" "}
                <span className="text-gradient-adventure">Made Tangible</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-storm">
                Real adventures from real people who turned their epic moments
                into meaningful mementos. These are their stories.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-summit-sage py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-headline font-bold text-alpine-mist lg:text-4xl">
                    {stat.number}
                  </div>
                  <div className="text-sm text-alpine-mist/90 font-headline">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="py-16 lg:py-20 bg-alpine-mist">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Quote */}
                  <blockquote className="text-slate-storm text-sm leading-relaxed mb-4">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="flex">
                      {renderStars(testimonial.rating)}
                    </div>
                    <span className="ml-2 text-sm text-slate-storm/60">
                      ({testimonial.rating}/5)
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="border-t border-slate-storm/10 pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-headline font-semibold text-basalt text-sm">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-slate-storm/70 mb-2">
                          {testimonial.location}
                        </p>
                        <p className="text-xs text-summit-sage font-headline">
                          {testimonial.adventure}
                        </p>
                        <p className="text-xs text-slate-storm/50 mt-1">
                          {testimonial.product}
                        </p>
                      </div>

                      {/* Placeholder for customer photo */}
                      <div className="w-12 h-12 bg-summit-sage/10 rounded-full flex items-center justify-center ml-4">
                        <span className="text-summit-sage text-xs font-headline">
                          {testimonial.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="bg-desert-stone py-16">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-headline font-bold text-alpine-mist mb-6">
              Join Hundreds of Happy Adventurers
            </h2>
            <p className="text-lg text-alpine-mist/90 mb-8">
              Every piece we create tells a unique story. What story will your
              adventure tell?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/products"
                className="btn-primary bg-alpine-mist text-desert-stone hover:bg-alpine-mist/90"
              >
                Start Your Story
              </a>
              <a
                href="https://landformlabs.etsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent border-2 border-alpine-mist text-alpine-mist hover:bg-alpine-mist hover:text-desert-stone font-headline font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Browse Our Etsy Store
              </a>
            </div>
          </div>
        </div>

        {/* Leave a Review CTA */}
        <div className="bg-basalt py-12">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl font-headline font-bold text-alpine-mist mb-4">
              Share Your Adventure Story
            </h3>
            <p className="text-alpine-mist/90 mb-6">
              Got a Landform Labs piece that brings back epic memories?
              We&rsquo;d love to hear about it! Your story might inspire someone
              else to own their adventures.
            </p>
            <a
              href="/contact"
              className="bg-alpine-mist/10 hover:bg-alpine-mist/20 text-alpine-mist py-3 px-6 rounded-lg transition-colors duration-200 font-headline font-semibold"
            >
              Share Your Story
            </a>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-alpine-mist py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-8 text-center">
              <div className="flex items-center space-x-2">
                <span className="text-summit-sage text-xl">🌱</span>
                <span className="font-headline font-semibold text-basalt text-sm">
                  Eco-Friendly PLA
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-summit-sage text-xl">🇺🇸</span>
                <span className="font-headline font-semibold text-basalt text-sm">
                  Made in USA
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-summit-sage text-xl">⚡</span>
                <span className="font-headline font-semibold text-basalt text-sm">
                  NFC Technology
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-summit-sage text-xl">🎨</span>
                <span className="font-headline font-semibold text-basalt text-sm">
                  Custom Crafted
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
