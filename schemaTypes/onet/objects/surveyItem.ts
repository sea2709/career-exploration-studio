import {defineField, defineType} from 'sanity'
import {ClipboardIcon} from '@sanity/icons/Clipboard'

/** One row of MySQL table survey_booklet_locations, embedded in onetContentModelElement.surveyItems */
export const onetSurveyItem = defineType({
  name: 'onetSurveyItem',
  title: 'Survey Item',
  type: 'object',
  icon: ClipboardIcon,
  fields: [
    defineField({
      name: 'surveyItemNumber',
      title: 'Survey Item Number',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'scale',
      title: 'Scale',
      type: 'reference',
      to: [{type: 'onetScale'}],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {title: 'surveyItemNumber', subtitle: 'scale.scaleId'},
  },
})
