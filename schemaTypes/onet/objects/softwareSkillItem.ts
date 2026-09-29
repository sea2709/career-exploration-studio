import {defineField, defineType} from 'sanity'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {onetYesNoOptions} from '../shared/fields'

/** One row of MySQL table software_skills, embedded in onetOccupation.softwareSkills */
export const onetSoftwareSkillItem = defineType({
  name: 'onetSoftwareSkillItem',
  title: 'Software Skill',
  type: 'object',
  icon: DesktopIcon,
  fields: [
    defineField({
      name: 'workplaceExample',
      title: 'Workplace Example',
      type: 'string',
      validation: (rule) => rule.required().max(150),
    }),
    defineField({
      name: 'element',
      title: 'UNSPSC Element',
      type: 'reference',
      to: [{type: 'onetContentModelElement'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hotTechnology',
      title: 'Hot Technology',
      type: 'string',
      options: onetYesNoOptions,
    }),
    defineField({
      name: 'inDemand',
      title: 'In Demand',
      type: 'string',
      options: onetYesNoOptions,
    }),
  ],
  preview: {
    select: {title: 'workplaceExample', hot: 'hotTechnology', demand: 'inDemand'},
    prepare({title, hot, demand}) {
      const flags = [hot === 'Y' ? 'hot' : null, demand === 'Y' ? 'in demand' : null]
      return {title, subtitle: flags.filter(Boolean).join(', ')}
    },
  },
})
