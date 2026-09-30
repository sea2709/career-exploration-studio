import {defineArrayMember, defineField, defineType} from 'sanity'
import {HeartIcon} from '@sanity/icons/Heart'
import {importKeyField} from '../shared/fields'

/**
 * One RIASEC Career Interest Type (1.B.1.*) or Specific Interest Area (1.B.3.*).
 * Maps to MySQL tables: riasec_keywords, sia_to_riasec, interests_illus_activities,
 * interests_illus_occupations.
 */
export const onetInterest = defineType({
  name: 'onetInterest',
  title: 'O*NET Interest',
  type: 'document',
  icon: HeartIcon,
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
      name: 'elementId',
      title: 'Element ID',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          {title: 'Career Interest Type (RIASEC)', value: 'careerType'},
          {title: 'Specific Interest Area', value: 'specificArea'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'code',
      title: 'RIASEC Letter',
      type: 'string',
      description: 'R, I, A, S, E or C (career types only)',
      hidden: ({document}) => document?.kind !== 'careerType',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'careerTypes',
      title: 'Career Interest Types',
      type: 'array',
      description: 'From sia_to_riasec (specific areas only)',
      hidden: ({document}) => document?.kind !== 'specificArea',
      of: [defineArrayMember({type: 'reference', to: [{type: 'onetInterest'}]})],
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      description: 'From riasec_keywords (career types only)',
      hidden: ({document}) => document?.kind !== 'careerType',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'onetInterestKeyword',
          fields: [
            defineField({name: 'keyword', title: 'Keyword', type: 'string'}),
            defineField({
              name: 'keywordType',
              title: 'Keyword Type',
              type: 'string',
              options: {list: ['Action', 'Object']},
            }),
          ],
          preview: {select: {title: 'keyword', subtitle: 'keywordType'}},
        }),
      ],
    }),
    defineField({
      name: 'activities',
      title: 'Illustrative Activities',
      type: 'array',
      description: 'From interests_illus_activities',
      of: [defineArrayMember({type: 'string'})],
    }),
    defineField({
      name: 'illustrativeOccupations',
      title: 'Illustrative Occupations',
      type: 'array',
      description: 'From interests_illus_occupations',
      of: [defineArrayMember({type: 'reference', to: [{type: 'onetOccupation'}]})],
    }),
  ],
  preview: {
    select: {title: 'name', kind: 'kind', code: 'code', elementId: 'elementId'},
    prepare({title, kind, code, elementId}) {
      return {
        title: code ? `${code} — ${title}` : title,
        subtitle: [kind === 'careerType' ? 'Career Interest Type' : 'Specific Interest Area', elementId]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
