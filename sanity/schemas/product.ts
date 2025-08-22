import { defineField, defineType } from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: () => '🏔️', // Mountain icon for Landform Labs
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      description: 'The name of your product as it appears on your site',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly version of the product name',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: rule => rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed description of the product',
      rows: 4,
      validation: rule => rule.required()
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      description: 'Brief description for product cards (optional)',
      rows: 2,
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'string',
      description: 'Product price (e.g., "$45.00")',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Product category for filtering',
      options: {
        list: [
          { title: 'Navigation', value: 'Navigation' },
          { title: 'Documentation', value: 'Documentation' },
          { title: 'Lighting', value: 'Lighting' },
          { title: 'Home & Camp', value: 'Home & Camp' },
          { title: 'Instruments', value: 'Instruments' },
        ],
        layout: 'dropdown'
      },
      validation: rule => rule.required()
    }),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true, // Allows cropping
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              description: 'Important for SEO and accessibility',
              validation: rule => rule.required()
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              description: 'Optional caption for the image'
            }
          ]
        }
      ],
      description: 'Upload multiple product images. First image will be the main one.',
      validation: rule => rule.required().min(1).error('At least one image is required')
    }),
    defineField({
      name: 'etsyUrl',
      title: 'Etsy Product URL',
      type: 'url',
      description: 'Direct link to this product on your Etsy shop',
      validation: rule => rule.required().uri({
        scheme: ['http', 'https']
      })
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      description: 'Show this product prominently on the homepage',
      initialValue: false
    }),
    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      description: 'Is this product currently available?',
      initialValue: true
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', type: 'string', title: 'Label' },
            { name: 'value', type: 'string', title: 'Value' }
          ]
        }
      ],
      description: 'Technical specifications or features (optional)'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Keywords for better searchability (optional)',
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Custom title for search engines (optional)',
      validation: rule => rule.max(60).warning('Should be under 60 characters for optimal SEO')
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Custom description for search engines (optional)',
      validation: rule => rule.max(160).warning('Should be under 160 characters for optimal SEO')
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'images.0',
      price: 'price'
    },
    prepare({ title, subtitle, media, price }) {
      return {
        title,
        subtitle: `${subtitle} - ${price}`,
        media
      }
    }
  }
})