import {defineField} from 'sanity'

/** Stable natural key used by the O*NET importer for idempotent upserts. */
export const importKeyField = defineField({
  name: 'importKey',
  title: 'Import Key',
  type: 'string',
  description: 'Natural key from O*NET used for re-imports. Do not edit.',
  readOnly: true,
  hidden: ({value}) => !value,
})

/** O*NET Character(1) flags: Y=yes, N=no */
export const onetYesNoOptions = {
  list: [
    {title: 'Yes', value: 'Y'},
    {title: 'No', value: 'N'},
  ],
  layout: 'radio' as const,
}

export const onetsocCodeField = defineField({
  name: 'onetsocCode',
  title: 'O*NET-SOC Code',
  type: 'string',
  description: 'Ten-character O*NET-SOC occupation code (e.g. 15-1252.00)',
  validation: (rule) =>
    rule.required().regex(/^\d{2}-\d{4}\.\d{2}$/, {
      name: 'onetsoc',
      invert: false,
    }),
})

export const domainMetadataFields = [
  defineField({
    name: 'dateUpdated',
    title: 'Date Updated',
    type: 'date',
    description: 'Date when data was updated (date_updated)',
  }),
  defineField({
    name: 'domainSource',
    title: 'Domain Source',
    type: 'string',
    description: 'Source of the data (domain_source)',
  }),
]

export const ratingStatisticsFields = [
  defineField({
    name: 'n',
    title: 'Sample Size (N)',
    type: 'number',
    validation: (rule) => rule.integer().min(0),
  }),
  defineField({
    name: 'standardError',
    title: 'Standard Error',
    type: 'number',
  }),
  defineField({
    name: 'lowerCiBound',
    title: 'Lower 95% CI Bound',
    type: 'number',
  }),
  defineField({
    name: 'upperCiBound',
    title: 'Upper 95% CI Bound',
    type: 'number',
  }),
  defineField({
    name: 'recommendSuppress',
    title: 'Recommend Suppress',
    type: 'string',
    description: 'Low precision indicator',
    options: onetYesNoOptions,
  }),
  defineField({
    name: 'notRelevant',
    title: 'Not Relevant',
    type: 'string',
    description: 'Not relevant for the occupation',
    options: onetYesNoOptions,
  }),
]
