# Sanity Studio Setup Guide for Landform Labs

This guide will walk you through setting up Sanity Studio to manage your product catalog.

## Quick Start

### 1. Create a Sanity Account and Project

1. Go to [sanity.io](https://sanity.io) and create a free account
2. Create a new project:
   - Choose a project name (e.g., "Landform Labs")
   - Select "Clean project with no predefined schemas"
   - Choose the "Free" plan
3. Note down your Project ID from the project dashboard

### 2. Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Sanity credentials:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id-here
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
   ```

### 3. Run the Studio

You have two options to access Sanity Studio:

**Option A: Embedded Studio (Recommended)**
```bash
npm run dev
```
Then visit: `http://localhost:3000/studio`

**Option B: Standalone Studio**
```bash
npm run studio
```
This will start the studio on a separate port.

### 4. Add Your First Product

1. Open the Studio interface
2. Click "Products" in the sidebar
3. Click "Create" and fill out the product form:
   - **Product Name**: e.g., "Trail Marker Set"
   - **Description**: Detailed product description
   - **Price**: e.g., "$45.00"
   - **Category**: Choose from dropdown
   - **Images**: Upload product photos
   - **Etsy URL**: Link to your Etsy listing
   - **Featured**: Check if you want it on homepage

4. Click "Publish" to save

## What You Get

### Content Management
- **Products**: Manage your entire product catalog
- **Blog Posts**: Write and publish blog content
- **Testimonials**: Collect and display customer reviews
- **Site Settings**: Global site configuration

### Features
- **Real-time Updates**: Changes appear on your website immediately
- **Image Optimization**: Automatic image resizing and CDN delivery
- **SEO Fields**: Built-in SEO optimization for each product
- **Content Versioning**: Track changes and revert if needed

### Product Schema Fields

Your product schema includes:
- Basic info (name, description, price, category)
- Multiple images with alt text for SEO
- Etsy integration (direct product links)
- Stock status and featured flags
- SEO metadata
- Product specifications
- Tags for better searchability

## Cost Breakdown

### Free Tier Includes:
- Unlimited admin users (just you)
- 500 API requests/month
- 1GB bandwidth/month
- 10GB storage
- Basic image transformations

### When You Might Need to Upgrade:
- High traffic (more than 1000s of visitors/month)
- Multiple content editors
- Advanced features

For most small businesses like Landform Labs, the free tier is sufficient.

## Next Steps

1. **Populate Products**: Add all your Etsy products to Sanity
2. **Update Images**: Replace placeholder images with real product photos
3. **SEO Optimization**: Fill out SEO fields for better search rankings
4. **Blog Content**: Start publishing outdoor-related blog posts
5. **Testimonials**: Add customer reviews to build trust

## Troubleshooting

### Studio Won't Load
- Check that your `.env.local` has the correct Project ID
- Ensure you're using the right dataset name
- Try clearing browser cache

### Products Not Showing
- Verify products are "Published" in Studio
- Check browser console for API errors
- Confirm environment variables are set correctly

### Need Help?
- Check the [Sanity Documentation](https://www.sanity.io/docs)
- Visit your project dashboard at sanity.io/manage
- Contact support through the Sanity dashboard

## Migration from Hardcoded Data

Your site will automatically:
1. Use Sanity data when products exist in the CMS
2. Fall back to hardcoded data if Sanity is empty
3. Allow you to migrate products gradually

This means you can start using the site immediately, even before adding all products to Sanity.