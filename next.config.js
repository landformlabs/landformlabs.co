/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.etsystatic.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["@heroicons/react"],
  },
};

module.exports = nextConfig;
