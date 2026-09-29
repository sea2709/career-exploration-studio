import {defineField, defineType} from 'sanity'
import {ListIcon} from '@sanity/icons/List'
import {importKeyField} from '../shared/fields'

/**
 * Maps to MySQL tables: education_categories, work_context_categories
 * (same column shape; distinguished by categoryDomain).
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
          {title: 'Work Context', value: 'workContext'},
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
      validation: (rule) => rule.required(),
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
      description: 'categoryDescription',
    },
    prepare({domain, category, elementName, description}) {
      return {
        title: `${elementName ?? 'Element'} · category ${category ?? '?'}`,
        subtitle: [domain, description].filter(Boolean).join(' — '),
      }
    },
  },
})
