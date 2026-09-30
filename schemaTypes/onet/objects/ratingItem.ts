import {defineField, defineType} from 'sanity'
import {ChartUpwardIcon} from '@sanity/icons/ChartUpward'
import {domainMetadataFields, ratingStatisticsFields} from '../shared/fields'

/**
 * Occupation × element × scale ratings shared by multiple O*NET MySQL tables:
 * essential_skills, transferable_skills, knowledge, abilities, work_activities,
 * education, training_experience and work_context.
 */
export const ONET_RATING_DOMAINS = [
  {title: 'Essential Skills', value: 'essentialSkills'},
  {title: 'Transferable Skills', value: 'transferableSkills'},
  {title: 'Knowledge', value: 'knowledge'},
  {title: 'Abilities', value: 'abilities'},
  {title: 'Work Activities', value: 'workActivities'},
  {title: 'Education', value: 'education'},
  {title: 'Training and Experience', value: 'trainingExperience'},
  {title: 'Work Context', value: 'workContext'},
] as const

export type OnetRatingDomain = (typeof ONET_RATING_DOMAINS)[number]['value']

/** One rating row, embedded in onetOccupation.ratings */
export const onetRatingItem = defineType({
  name: 'onetRatingItem',
  title: 'Rating',
  type: 'object',
  icon: ChartUpwardIcon,
  fields: [
    defineField({
      name: 'domain',
      title: 'Rating Domain',
      type: 'string',
      description: 'Source O*NET table for this row',
      options: {list: [...ONET_RATING_DOMAINS]},
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
      name: 'ratingCategory',
      title: 'Rating Category',
      type: 'reference',
      to: [{type: 'onetRatingCategory'}],
      description:
        'Percent frequency category (education, training and experience, and work context only)',
    }),
    defineField({
      name: 'dataValue',
      title: 'Data Value',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    ...ratingStatisticsFields,
    ...domainMetadataFields,
  ],
  preview: {
    select: {
      domain: 'domain',
      elementName: 'element.elementName',
      scaleId: 'scale.scaleId',
      dataValue: 'dataValue',
    },
    prepare({domain, elementName, scaleId, dataValue}) {
      const domainLabel = ONET_RATING_DOMAINS.find((d) => d.value === domain)?.title ?? domain
      return {
        title: elementName ?? 'Element',
        subtitle: `${domainLabel} · ${scaleId ?? '?'} = ${dataValue ?? '—'}`,
      }
    },
  },
})
