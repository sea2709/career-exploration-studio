import {defineField, defineType} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'
import {importKeyField} from '../shared/fields'

/** Maps to MySQL table: content_model_reference */
export const onetContentModelElement = defineType({
  name: 'onetContentModelElement',
  title: 'O*NET Content Model Element',
  type: 'document',
  icon: ComponentIcon,
  fields: [
    importKeyField,
    defineField({
      name: 'elementId',
      title: 'Element ID',
      type: 'string',
      description: 'Content model outline position (element_id)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'elementName',
      title: 'Element Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {elementId: 'elementId', title: 'elementName'},
    prepare({elementId, title}) {
      return {
        title: title ?? elementId,
        subtitle: elementId,
      }
    },
  },
})
