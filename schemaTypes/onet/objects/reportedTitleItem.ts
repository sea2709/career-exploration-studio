import {defineField, defineType} from 'sanity'
import {TagIcon} from '@sanity/icons/Tag'
import {onetYesNoOptions} from '../shared/fields'

/** One row of MySQL table sample_of_reported_titles, embedded in onetOccupation.reportedTitles */
export const onetReportedTitleItem = defineType({
  name: 'onetReportedTitleItem',
  title: 'Reported Title',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'reportedJobTitle',
      title: 'Reported Job Title',
      type: 'string',
      validation: (rule) => rule.required().max(150),
    }),
    defineField({
      name: 'shownInMyNextMove',
      title: 'Shown in My Next Move',
      type: 'string',
      options: onetYesNoOptions,
    }),
  ],
  preview: {
    select: {title: 'reportedJobTitle', shown: 'shownInMyNextMove'},
    prepare({title, shown}) {
      return {title, subtitle: shown === 'Y' ? 'Shown in My Next Move' : undefined}
    },
  },
})
