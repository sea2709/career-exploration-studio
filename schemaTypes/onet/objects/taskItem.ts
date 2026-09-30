import {defineArrayMember, defineField, defineType} from 'sanity'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {domainMetadataFields} from '../shared/fields'

/** One row of MySQL table task_statements, embedded in onetOccupation.tasks */
export const onetTaskItem = defineType({
  name: 'onetTaskItem',
  title: 'Task',
  type: 'object',
  icon: CheckmarkCircleIcon,
  fields: [
    defineField({
      name: 'taskId',
      title: 'Task ID',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'task',
      title: 'Task',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(1000),
    }),
    defineField({
      name: 'taskType',
      title: 'Task Type',
      type: 'string',
      options: {
        list: [
          {title: 'Core', value: 'Core'},
          {title: 'Supplemental', value: 'Supplemental'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'incumbentsResponding',
      title: 'Incumbents Responding',
      type: 'number',
      validation: (rule) => rule.integer().min(0),
    }),
    ...domainMetadataFields,
    defineField({
      name: 'ratings',
      title: 'Ratings',
      type: 'array',
      description: 'From task_ratings: importance, relevance and frequency distribution',
      of: [defineArrayMember({type: 'onetTaskRatingItem'})],
    }),
    defineField({
      name: 'dwas',
      title: 'Detailed Work Activities',
      type: 'array',
      description: 'From tasks_to_dwas',
      of: [defineArrayMember({type: 'onetTaskDwaItem'})],
    }),
  ],
  preview: {
    select: {title: 'task', subtitle: 'taskType'},
  },
})
