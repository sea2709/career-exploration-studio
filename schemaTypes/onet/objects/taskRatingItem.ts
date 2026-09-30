import {defineField, defineType} from 'sanity'
import {BarChartIcon} from '@sanity/icons/BarChart'
import {domainMetadataFields, ratingStatisticsFields} from '../shared/fields'

/** One row of MySQL table task_ratings, embedded in onetTaskItem.ratings */
export const onetTaskRatingItem = defineType({
  name: 'onetTaskRatingItem',
  title: 'Task Rating',
  type: 'object',
  icon: BarChartIcon,
  fields: [
    defineField({
      name: 'scale',
      title: 'Scale',
      type: 'reference',
      to: [{type: 'onetScale'}],
      description: 'IM (importance), RT (relevance) or FT (frequency)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'ratingCategory',
      title: 'Rating Category',
      type: 'reference',
      to: [{type: 'onetRatingCategory'}],
      description: 'Frequency category (FT scale only)',
    }),
    defineField({
      name: 'dataValue',
      title: 'Data Value',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    ...ratingStatisticsFields,
    ...domainMetadataFields,
  ],
  preview: {
    select: {
      scaleId: 'scale.scaleId',
      category: 'ratingCategory.categoryDescription',
      dataValue: 'dataValue',
    },
    prepare({scaleId, category, dataValue}) {
      return {
        title: [scaleId ?? 'Scale', category].filter(Boolean).join(' · '),
        subtitle: `${dataValue ?? '—'}`,
      }
    },
  },
})
