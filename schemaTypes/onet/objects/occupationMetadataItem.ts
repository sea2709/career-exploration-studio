import {defineField, defineType} from 'sanity'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'

/** One row of MySQL table occupation_level_metadata, embedded in onetOccupation.surveyMetadata */
export const onetOccupationMetadataItem = defineType({
  name: 'onetOccupationMetadataItem',
  title: 'Survey Metadata',
  type: 'object',
  icon: InfoOutlineIcon,
  fields: [
    defineField({
      name: 'item',
      title: 'Item',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'response',
      title: 'Response',
      type: 'string',
    }),
    defineField({
      name: 'n',
      title: 'Sample Size (N)',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'percent',
      title: 'Percent',
      type: 'number',
    }),
    defineField({
      name: 'dateUpdated',
      title: 'Date Updated',
      type: 'date',
    }),
  ],
  preview: {
    select: {item: 'item', response: 'response', percent: 'percent'},
    prepare({item, response, percent}) {
      return {
        title: [item, response].filter(Boolean).join(': '),
        subtitle: percent != null ? `${percent}%` : undefined,
      }
    },
  },
})
