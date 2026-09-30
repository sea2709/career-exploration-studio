import {defineField, defineType} from 'sanity'
import {ListIcon} from '@sanity/icons/List'
import {importKeyField} from '../shared/fields'

/**
 * Maps to MySQL tables: education_categories, training_experience_categories,
 * work_context_categories and task_categories (distinguished by categoryDomain).
 * Task categories have no content model element.
 */
export const onetRatingCategory = defineType({
  name: 'onetRatingCategory',
  title: 'O*NET Rating Category',
  type: 'document',
  icon: ListIcon,
  fields: [
    importKeyField,
    defineField({
      name: 'categoryDomain',
      title: 'Category Domain',
      type: 'string',
      options: {
        list: [
          {title: 'Education', value: 'education'},
          {title: 'Training and Experience', value: 'trainingExperience'},
          {title: 'Work Context', value: 'workContext'},
          {title: 'Task', value: 'task'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'element',
      title: 'Content Model Element',
      type: 'reference',
      to: [{type: 'onetContentModelElement'}],
      validation: (rule) =>
        rule.custom((value, {document}) =>
          value || document?.categoryDomain === 'task' ? true : 'Required',
        ),
    }),
    defineField({
      name: 'scale',
      title: 'Scale',
      type: 'reference',
      to: [{type: 'onetScale'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'categoryDescription',
      title: 'Category Description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(1000),
    }),
  ],
  preview: {
    select: {
      domain: 'categoryDomain',
      category: 'category',
      elementName: 'element.elementName',
      scaleName: 'scale.scaleName',
      description: 'categoryDescription',
    },
    prepare({domain, category, elementName, scaleName, description}) {
      return {
        title: `${elementName ?? scaleName ?? 'Element'} · category ${category ?? '?'}`,
        subtitle: [domain, description].filter(Boolean).join(' — '),
      }
    },
  },
})
