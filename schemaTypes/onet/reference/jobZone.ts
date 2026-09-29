import {defineField, defineType} from 'sanity'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import {importKeyField} from '../shared/fields'

/** Maps to MySQL table: job_zone_reference */
export const onetJobZone = defineType({
  name: 'onetJobZone',
  title: 'O*NET Job Zone',
  type: 'document',
  icon: StackCompactIcon,
  fields: [
    importKeyField,
    defineField({
      name: 'jobZone',
      title: 'Job Zone',
      type: 'number',
      description: 'Job zone number (1–5)',
      validation: (rule) => rule.required().integer().min(1).max(5),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'education',
      title: 'Education',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'jobTraining',
      title: 'Job Training',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'examples',
      title: 'Examples',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'svpRange',
      title: 'SVP Range',
      type: 'string',
      description: 'Specific vocational preparation range',
    }),
  ],
  preview: {
    select: {jobZone: 'jobZone', title: 'name'},
    prepare({jobZone, title}) {
      return {
        title: `Zone ${jobZone}: ${title}`,
      }
    },
  },
})
