import {defineArrayMember, defineField, defineType} from 'sanity'
import {ComponentIcon} from '@sanity/icons/Component'
import {importKeyField} from '../shared/fields'

const elementRef = defineArrayMember({type: 'reference', to: [{type: 'onetContentModelElement'}]})

/**
 * Maps to MySQL table content_model_reference, plus the element-level tables:
 * gwas_to_iwas and gwas_to_iwas_to_dwas (parentElement), the *_to_work_activities and
 * *_to_work_context crosswalks, and survey_booklet_locations.
 */
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
    defineField({
      name: 'parentElement',
      title: 'Parent Work Activity',
      type: 'reference',
      to: [{type: 'onetContentModelElement'}],
      description: 'GWA for an IWA, or IWA for a DWA',
      readOnly: true,
    }),
    defineField({
      name: 'relatedWorkActivities',
      title: 'Related Work Activities',
      type: 'array',
      description: 'Crosswalk from abilities, skills and work styles to work activities',
      readOnly: true,
      of: [elementRef],
    }),
    defineField({
      name: 'relatedWorkContext',
      title: 'Related Work Context',
      type: 'array',
      description: 'Crosswalk from abilities, skills and work styles to work context',
      readOnly: true,
      of: [elementRef],
    }),
    defineField({
      name: 'surveyItems',
      title: 'Survey Items',
      type: 'array',
      description: 'From survey_booklet_locations',
      readOnly: true,
      of: [defineArrayMember({type: 'onetSurveyItem'})],
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
