# Landform Labs Website

A production-ready e-commerce website for Landform Labs - creators of custom 3D-printed adventure keepsakes from GPS data. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

Landform Labs transforms outdoor memories into tangible keepsakes by creating custom 3D prints from GPS route data. This website showcases products, tells the brand story, and integrates with Etsy for e-commerce functionality.

## Features

**Core Functionality**
- Responsive design optimized for all devices
- Product showcase with detailed specifications and pricing
- Integrated contact forms with validation
- Comprehensive FAQ system
- Privacy policy and legal compliance
- SEO optimization with proper meta tags

**Technical Features**
- Next.js 14 with App Router for optimal performance
- Static site generation for fast loading
- Image optimization and compression
- Google Analytics integration ready
- Professional error handling and validation
- Production-ready build optimization

**Brand Experience**
- Adventure-focused design with custom color palette
- Dynamic sky backgrounds that change with time of day
- Professional typography using custom font combinations
- Optimized images showcasing product quality

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **Image Optimization**: Next.js built-in optimization
- **Analytics**: Google Analytics 4 (configurable)
- **Deployment**: Vercel recommended

## Prerequisites

- Node.js 18 or later
- npm or yarn package manager
- Git for version control

## Quick Start

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd landformlabs.co
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://landformlabs.co
```

5. Start development server
```bash
npm run dev
```

6. Open browser to `http://localhost:3000`

## Project Structure

```
landformlabs.co/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about/             # Company story and mission
│   │   ├── contact/           # Contact forms and information
│   │   ├── faq/               # Frequently asked questions
│   │   ├── privacy/           # Privacy policy
│   │   ├── products/          # Product catalog and details
│   │   ├── globals.css        # Global styles and Tailwind imports
│   │   ├── layout.tsx         # Root layout with SEO and analytics
│   │   └── page.tsx           # Homepage with hero and features
│   └── components/            # Reusable React components
│       ├── DynamicSky.tsx     # Time-based background component
│       ├── Footer.tsx         # Site footer with navigation
│       ├── GoogleAnalytics.tsx # GA4 integration component
│       ├── Header.tsx         # Site header and navigation
│       └── HeroWireframe.tsx   # Hero section wireframe graphic
├── public/                    # Static assets
│   ├── [product-images]/     # Optimized product photography
│   ├── llms.txt              # AI assistant optimization
│   └── robots.txt            # Search engine directives
├── .env.local.example        # Environment variables template
└── [config files]           # Next.js, TypeScript, Tailwind config
```

## Configuration

### Environment Variables

Create `.env.local` with the following variables:

```env
# Google Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://landformlabs.co

# Contact Form (for production form handling)
NEXT_PUBLIC_FORM_ENDPOINT=your-form-handler-url
```

### Google Analytics Setup

1. Create a Google Analytics 4 property
2. Copy the Measurement ID (starts with G-)
3. Add to environment variables
4. The GoogleAnalytics component will automatically initialize tracking

### Contact Form Configuration

The contact form currently displays a demo message. For production:

1. Choose a form handling service (Formspree, Netlify Forms, etc.)
2. Update the form endpoint in environment variables
3. Modify form submission logic in `src/app/contact/page.tsx`

## Design System

### Color Palette

The site uses a custom adventure-inspired color palette:

- **Alpine Mist** (#f7f9f7): Primary background and light elements
- **Summit Sage** (#6b8e6b): Primary brand color for buttons and accents
- **Basalt** (#2c3e50): Primary text and dark elements
- **Desert Stone** (#d4a574): Secondary accent color
- **Slate Storm** (#64748b): Secondary text and subtle elements

### Typography

- **Headlines**: Custom font stack emphasizing impact and readability
- **Body Text**: Optimized for reading comfort across devices
- **UI Elements**: Consistent sizing and spacing throughout

### Responsive Design

- Mobile-first approach with progressive enhancement
- Optimized for devices from 320px to 4K displays
- Touch-friendly interface elements
- Accessible navigation and interaction patterns

## Content Management

### Static Content Updates

Most content is managed through TypeScript files for type safety and performance:

- **Homepage**: `src/app/page.tsx`
- **Product Information**: `src/app/products/page.tsx`
- **Company Story**: `src/app/about/page.tsx`
- **FAQ Content**: `src/app/faq/page.tsx`

### Image Management

Product images are optimized for web delivery:

- Compressed to under 300KB each while maintaining quality
- Multiple formats supported (JPEG, PNG, WebP)
- Responsive sizing through Next.js Image component
- Lazy loading for improved performance

## Development Workflow

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Create production build
npm run start    # Run production server locally
npm run lint     # Check code quality with ESLint
```

### Code Quality

The project maintains high code quality through:

- TypeScript for type safety
- ESLint for code consistency
- Proper HTML entity escaping for security
- Responsive design testing
- Performance optimization

### Performance Optimizations

- Static site generation for fast loading
- Image optimization reducing payload by 80%
- Code splitting and tree shaking
- Efficient CSS delivery
- Minimal JavaScript bundle size

## Deployment

### Vercel (Recommended)

Vercel provides optimal hosting for Next.js applications:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every git push
4. Configure custom domain (landformlabs.co)

### Alternative Platforms

The site can be deployed to any Node.js hosting platform:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

### Custom Domain Setup

1. Configure DNS records to point to hosting provider
2. Add domain in hosting platform dashboard
3. Enable HTTPS (automatic with most providers)
4. Test all functionality on live domain

## SEO and Analytics

### Search Engine Optimization

- Comprehensive meta tags for all pages
- Structured data for product information
- XML sitemap generation
- Optimized page loading speeds
- Mobile-friendly design certification

### Analytics Integration

- Google Analytics 4 ready for detailed tracking
- Privacy-compliant implementation
- Custom event tracking capabilities
- E-commerce integration preparation

### AI Assistant Optimization

- LLMs.txt file for improved AI assistant responses
- Structured content for better AI understanding
- Clear navigation and content hierarchy

## Business Integration

### Etsy Store Integration

- Direct links to Etsy product listings
- Consistent branding between website and store
- Clear call-to-action buttons for purchasing
- Product information synchronized

### Contact and Support

- Professional contact forms with validation
- Multiple contact methods clearly displayed
- FAQ system addressing common questions
- Privacy policy and terms compliance

## Maintenance and Updates

### Regular Maintenance Tasks

- Monitor site performance and loading speeds
- Update product information and pricing
- Review and respond to contact form submissions
- Update FAQ content based on customer questions

### Content Updates

- Product images and descriptions
- Company story and mission updates
- New FAQ entries
- Blog posts (structure ready for implementation)

## Security and Privacy

### Data Protection

- No sensitive data stored in client-side code
- Environment variables for configuration
- Privacy policy compliance
- Secure form handling practices

### Performance Monitoring

- Core Web Vitals optimization
- Image loading performance
- JavaScript bundle analysis
- Mobile performance testing

## Support and Documentation

### Getting Help

For technical issues or questions:

- Check the FAQ section for common questions
- Review this documentation for setup guidance
- Contact: hello@landformlabs.co for business inquiries

### Contributing

When making changes to the codebase:

1. Test thoroughly on multiple devices
2. Run the build process to check for errors
3. Ensure all images are optimized
4. Update this documentation if needed

## License and Usage

This website is proprietary software for Landform Labs. All rights reserved.

---

**About Landform Labs**

Landform Labs creates custom 3D-printed keepsakes from GPS route data, turning your outdoor adventures into beautiful, tangible memories. From route tiles to ornaments to desk accessories, we help outdoor enthusiasts own their epic moments.

**Get Out There, Amaze Yourself, Own It, Repeat.**