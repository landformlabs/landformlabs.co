"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  name: string;
  description: string;
  href: string;
  image: string;
  price: string;
}

const products: Product[] = [
  {
    name: "Route Tiles",
    description: "Transform your GPS routes into stunning 3D art with NFC technology",
    href: "/products#route-tiles",
    image: "/route-tiles.webp",
    price: "From $20",
  },
  {
    name: "Adventure Ornaments",
    description: "Holiday decorations that celebrate your epic adventures",
    href: "/products#route-ornaments",
    image: "/gpx-ornaments.webp",
    price: "$25",
  },
  {
    name: "Mountain Pen Holders",
    description: "Celebrate local peaks with custom 3D-printed mountain organizers",
    href: "/products#mountain-pen-holders",
    image: "/pen-holder.webp",
    price: "$30",
  },
  {
    name: "Custom Keepsakes",
    description: "Personalized proof of your most meaningful outdoor moments",
    href: "/products#custom-prints",
    image: "/custom-print.webp",
    price: "Custom Quote",
  },
];

export default function ProductCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const currentProduct = products[currentIndex];

  return (
    <div className="relative">
      <Link href={currentProduct.href} className="block group">
        <div className="bg-alpine-mist/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-summit-sage/20 max-w-sm mx-auto lg:mx-0 transition-all duration-200 group-hover:shadow-xl group-hover:border-summit-sage/40 cursor-pointer">
          <div className="aspect-square overflow-hidden rounded-lg mb-4 relative">
            <Image
              src={currentProduct.image}
              alt={`${currentProduct.name} - Custom 3D printed outdoor keepsakes`}
              width={400}
              height={400}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />
          </div>
          <h3 className="text-xl font-headline font-bold text-basalt mb-2 group-hover:text-summit-sage transition-colors duration-200">
            {currentProduct.name}
          </h3>
          <p className="text-slate-storm mb-4 text-sm min-h-[2.5rem]">
            {currentProduct.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-basalt">
              {currentProduct.price}
            </span>
            <span className="text-summit-sage group-hover:text-basalt font-semibold text-sm transition-colors duration-200">
              Learn More →
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation Dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? "bg-summit-sage scale-125"
                : "bg-summit-sage/40 hover:bg-summit-sage/60"
            }`}
            aria-label={`Go to product ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}