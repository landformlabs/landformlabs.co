/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.etsystatic.com'],
  },
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
}

module.exports = nextConfig