import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: () => '⭐',
  fields: [
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'content',
      title: 'Testimonial Content',
      type: 'text',
      rows: 4,
      validation: rule => rule.required()
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      options: {
        list: [
          { title: '5 Stars', value: 5 },
          { title: '4 Stars', value: 4 },
          { title: '3 Stars', value: 3 },
          { title: '2 Stars', value: 2 },
          { title: '1 Star', value: 1 }
        ]
      },
      validation: rule => rule.required().min(1).max(5)
    }),
    defineField({
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'product' }],
      description: 'Which product is this testimonial for?'
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Customer location (optional)'
    }),
    defineField({
      name: 'image',
      title: 'Customer Photo',
      type: 'image',
      description: 'Optional customer photo',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
        }
      ]
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show prominently on homepage',
      initialValue: false
    }),
    defineField({
      name: 'verified',
      title: 'Verified Purchase',
      type: 'boolean',
      description: 'Is this from a verified purchase?',
      initialValue: false
    })
  ],
  preview: {
    select: {
      title: 'customerName',
      subtitle: 'content',
      media: 'image',
      rating: 'rating'
    },
    prepare({ title, subtitle, media, rating }) {
      const stars = '⭐'.repeat(rating || 0)
      return {
        title: `${title} ${stars}`,
        subtitle: subtitle?.substring(0, 60) + '...',
        media
      }
    }
  }
})