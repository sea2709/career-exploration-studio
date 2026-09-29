import {defineField, defineType} from 'sanity'
import {PinIcon} from '@sanity/icons/Pin'
import {importKeyField} from '../shared/fields'

/** Maps to MySQL table: level_scale_anchors */
export const onetLevelScaleAnchor = defineType({
  name: 'onetLevelScaleAnchor',
  title: 'O*NET Level Scale Anchor',
  type: 'document',
  icon: PinIcon,
  fields: [
    importKeyField,
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
      name: 'anchorValue',
      title: 'Anchor Value',
      type: 'number',
      validation: (rule) => rule.required().integer(),
    }),
    defineField({
      name: 'anchorDescription',
      title: 'Anchor Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required().max(1000),
    }),
  ],
  preview: {
    select: {
      elementName: 'element.elementName',
      anchorValue: 'anchorValue',
      description: 'anchorDescription',
    },
    prepare({elementName, anchorValue, description}) {
      return {
        title: `${elementName ?? 'Element'} @ ${anchorValue ?? '?'}`,
        subtitle: description,
      }
    },
  },
})
