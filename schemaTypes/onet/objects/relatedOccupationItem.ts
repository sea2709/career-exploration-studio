import {defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'

/** One row of MySQL table related_occupations, embedded in onetOccupation.relatedOccupations */
export const onetRelatedOccupationItem = defineType({
  name: 'onetRelatedOccupationItem',
  title: 'Related Occupation',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'occupation',
      title: 'Occupation',
      type: 'reference',
      to: [{type: 'onetOccupation'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'relatednessTier',
      title: 'Relatedness Tier',
      type: 'string',
      options: {
        list: [
          {title: 'Primary-Short', value: 'Primary-Short'},
          {title: 'Primary-Long', value: 'Primary-Long'},
          {title: 'Supplemental', value: 'Supplemental'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'relatedIndex',
      title: 'Related Index',
      type: 'number',
      description: 'Order of related mappings based on expert review',
      validation: (rule) => rule.required().integer().min(1).max(20),
    }),
  ],
  preview: {
    select: {title: 'occupation.title', tier: 'relatednessTier', index: 'relatedIndex'},
    prepare({title, tier, index}) {
      return {
        title: title ?? 'Occupation',
        subtitle: [index != null ? `#${index}` : null, tier].filter(Boolean).join(' · '),
      }
    },
  },
})
