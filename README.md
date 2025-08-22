# Landform Labs Website

A modern, nature-inspired website for Landform Labs built with Next.js, TypeScript, and Tailwind CSS.

## 🌲 Features

- **Modern Design**: Earthy color palette with Poppins font reflecting outdoor brand identity
- **Responsive**: Mobile-first design optimized for all devices
- **SEO Optimized**: Built-in SEO with meta tags, structured data, and LLMs.txt
- **CMS Ready**: Sanity.io integration for blog and content management
- **E-commerce Integration**: Seamless Etsy store integration
- **Analytics**: Google Analytics 4 integration
- **Performance**: Optimized for Core Web Vitals and fast loading

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **CMS**: Sanity.io (optional)
- **Analytics**: Google Analytics 4
- **Deployment**: Vercel (recommended)

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd landformlabs.co
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update the environment variables:
   - `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Your Google Analytics 4 measurement ID
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`: Your Sanity project ID (optional)
   - `NEXT_PUBLIC_SANITY_DATASET`: Your Sanity dataset (usually 'production')

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

### Colors
- **Primary (Sky Blue)**: #0174c2 to #0d426c
- **Secondary (Forest Green)**: #367936 to #214121  
- **Accent (Earth Tones)**: #a3694a to #5a3b30

### Typography
- **Font**: Poppins (Google Fonts)
- **Headings**: Bold weights for impact
- **Body**: Regular weights for readability

### Components
- Reusable button styles (`.btn-primary`, `.btn-secondary`, `.btn-accent`)
- Consistent spacing with utility classes
- Responsive grid layouts

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── blog/              # Blog listing page
│   ├── contact/           # Contact form page
│   ├── faq/               # FAQ page
│   ├── products/          # Products showcase page
│   ├── testimonials/      # Customer testimonials
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── Header.tsx         # Site header with navigation
│   ├── Footer.tsx         # Site footer
│   └── GoogleAnalytics.tsx # GA4 integration
├── lib/                   # Utility functions
│   └── sanity.ts          # Sanity CMS client
public/
├── llms.txt              # AI optimization file
└── [static assets]       # Images, icons, etc.
```

## 🔧 Configuration

### Google Analytics
Add your GA4 measurement ID to `.env.local`:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Sanity CMS (Optional)
1. Create a Sanity project at [sanity.io](https://sanity.io)
2. Add your project details to `.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```
3. Uncomment Sanity queries in blog pages to enable dynamic content

### Contact Form
The contact form currently shows a demo. To enable real form submission:
1. Set up a form handling service (Netlify Forms, Formspree, etc.)
2. Update the form action in `src/app/contact/page.tsx`
3. Add form endpoint to environment variables

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Other Platforms
The site can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔍 SEO Features

- **Meta Tags**: Comprehensive meta tags for all pages
- **Structured Data**: JSON-LD for better search engine understanding
- **Sitemap**: Auto-generated sitemap.xml
- **LLMs.txt**: AI optimization file for better AI assistant responses
- **Performance**: Optimized images and Core Web Vitals

## 🎯 Content Management

### Static Content
Most content is currently static and can be updated by editing the TypeScript files in the `src/app` directory.

### Dynamic Content (Sanity CMS)
Blog posts and other dynamic content can be managed through Sanity Studio:
1. Set up Sanity project
2. Configure schemas for posts, products, testimonials
3. Enable dynamic content in the relevant pages

## 🛠 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📧 Support

For questions or issues with this website:
- Email: hello@landformlabs.co
- Create an issue in the repository

## 🌟 Features Implemented

✅ Responsive design with mobile-first approach
✅ Custom color palette reflecting outdoor brand
✅ Comprehensive page structure (Home, Products, About, Contact, Blog, FAQ, Testimonials)
✅ Etsy integration for e-commerce
✅ SEO optimization with meta tags and structured data
✅ Google Analytics 4 integration
✅ Contact form with validation
✅ FAQ with collapsible sections
✅ Customer testimonials with ratings
✅ Blog structure ready for CMS
✅ LLMs.txt for AI optimization
✅ Environment configuration
✅ Deployment ready

## 🎨 Brand Guidelines

The website reflects Landform Labs' connection to the outdoors through:
- Earthy color palette (greens, blues, tans)
- Natural imagery and iconography
- Outdoor-focused content and messaging
- Sustainable and eco-friendly brand values
- Community-centered approach

---

Built with ❤️ for outdoor enthusiasts by the Landform Labs team.