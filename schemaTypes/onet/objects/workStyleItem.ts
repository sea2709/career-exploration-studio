import {defineField, defineType} from 'sanity'
import {UsersIcon} from '@sanity/icons/Users'
import {domainMetadataFields} from '../shared/fields'

/** One row of MySQL table work_styles, embedded in onetOccupation.workStyles */
export const onetWorkStyleItem = defineType({
  name: 'onetWorkStyleItem',
  title: 'Work Style Rating',
  type: 'object',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'element',
      title: 'Work Style Element',
      type: 'reference',
      to: [{type: 'onetContentModelElement'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scale',
      title: 'Scale',
      type: 'reference',
      to: [{type: 'onetScale'}],
      description: 'WI (impact) or DR (distinctiveness rank)',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dataValue',
      title: 'Data Value',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    ...domainMetadataFields,
  ],
  preview: {
    select: {elementName: 'element.elementName', scaleId: 'scale.scaleId', dataValue: 'dataValue'},
    prepare({elementName, scaleId, dataValue}) {
      return {
        title: elementName ?? 'Work style',
        subtitle: `${scaleId ?? '?'} = ${dataValue ?? '—'}`,
      }
    },
  },
})
