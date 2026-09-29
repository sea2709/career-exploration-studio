import {defineField, defineType} from 'sanity'
import {ControlsIcon} from '@sanity/icons/Controls'
import {importKeyField} from '../shared/fields'

/** Maps to MySQL table: scales_reference */
export const onetScale = defineType({
  name: 'onetScale',
  title: 'O*NET Scale',
  type: 'document',
  icon: ControlsIcon,
  fields: [
    importKeyField,
    defineField({
      name: 'scaleId',
      title: 'Scale ID',
      type: 'string',
      validation: (rule) => rule.required().max(3),
    }),
    defineField({
      name: 'scaleName',
      title: 'Scale Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'minimum',
      title: 'Minimum',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'maximum',
      title: 'Maximum',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
  ],
  preview: {
    select: {scaleId: 'scaleId', title: 'scaleName', minimum: 'minimum', maximum: 'maximum'},
    prepare({scaleId, title, minimum, maximum}) {
      return {
        title: `${scaleId} — ${title}`,
        subtitle: `${minimum}–${maximum}`,
      }
    },
  },
})
