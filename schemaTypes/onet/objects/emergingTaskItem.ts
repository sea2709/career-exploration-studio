import {defineField, defineType} from 'sanity'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {domainMetadataFields} from '../shared/fields'

/** One row of MySQL table emerging_tasks, embedded in onetOccupation.emergingTasks */
export const onetEmergingTaskItem = defineType({
  name: 'onetEmergingTaskItem',
  title: 'Emerging Task',
  type: 'object',
  icon: SparklesIcon,
  fields: [
    defineField({
      name: 'task',
      title: 'Task',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(1000),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'New'},
          {title: 'Revision', value: 'Revision'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'originalTaskId',
      title: 'Original Task ID',
      type: 'number',
      description: 'Task being revised (Revision only)',
      validation: (rule) => rule.integer(),
    }),
    defineField({
      name: 'originalTask',
      title: 'Original Task',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(1000),
    }),
    ...domainMetadataFields,
  ],
  preview: {
    select: {title: 'task', subtitle: 'category'},
  },
})
