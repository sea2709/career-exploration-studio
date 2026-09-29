import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons/Tag'

/** One row of MySQL table job_titles, embedded in onetOccupation.jobTitles */
export const onetJobTitleItem = defineType({
  name: 'onetJobTitleItem',
  title: 'Job Title',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'jobTitle',
      title: 'Job Title',
      type: 'string',
      validation: (rule) => rule.required().max(250),
    }),
    defineField({
      name: 'shortTitle',
      title: 'Short Title',
      type: 'string',
      validation: (rule) => rule.max(150),
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'string',
      description: 'Comma-delimited source codes (see O*NET job_titles documentation)',
    }),
  ],
  preview: {
    select: {title: 'jobTitle', subtitle: 'shortTitle'},
  },
})
