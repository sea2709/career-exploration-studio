import {defineField, defineType} from 'sanity'
import {ActivityIcon} from '@sanity/icons/Activity'
import {domainMetadataFields} from '../shared/fields'

/** One row of MySQL table tasks_to_dwas, embedded in onetTaskItem.dwas */
export const onetTaskDwaItem = defineType({
  name: 'onetTaskDwaItem',
  title: 'Detailed Work Activity',
  type: 'object',
  icon: ActivityIcon,
  fields: [
    defineField({
      name: 'dwa',
      title: 'Detailed Work Activity',
      type: 'reference',
      to: [{type: 'onetContentModelElement'}],
      validation: (rule) => rule.required(),
    }),
    ...domainMetadataFields,
  ],
  preview: {
    select: {title: 'dwa.elementName', subtitle: 'dwa.elementId'},
  },
})
