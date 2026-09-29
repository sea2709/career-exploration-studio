import {defineArrayMember, defineField, defineType} from 'sanity'
import {CaseIcon} from '@sanity/icons/Case'
import {importKeyField} from '../shared/fields'

/**
 * Maps to MySQL table occupation_data. Occupation-specific rows from other O*NET tables
 * are embedded as arrays to stay within the plan's document quota.
 */
export const onetOccupation = defineType({
  name: 'onetOccupation',
  title: 'O*NET Occupation',
  type: 'document',
  icon: CaseIcon,
  groups: [
    {name: 'overview', title: 'Overview', default: true},
    {name: 'tasks', title: 'Tasks'},
    {name: 'titles', title: 'Job Titles'},
    {name: 'skills', title: 'Software Skills'},
    {name: 'ratings', title: 'Ratings'},
    {name: 'related', title: 'Related'},
  ],
  fields: [
    importKeyField,
    defineField({
      name: 'onetsocCode',
      title: 'O*NET-SOC Code',
      type: 'string',
      description: 'Primary key in O*NET (onetsoc_code)',
      group: 'overview',
      validation: (rule) =>
        rule.required().regex(/^\d{2}-\d{4}\.\d{2}$/, {
          name: 'onetsoc',
          invert: false,
        }),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'overview',
      validation: (rule) => rule.required().max(150),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 5,
      group: 'overview',
      validation: (rule) => rule.max(1000),
    }),
    defineField({
      name: 'jobZone',
      title: 'Job Zone',
      type: 'reference',
      to: [{type: 'onetJobZone'}],
      description: 'From job_zones',
      group: 'overview',
    }),
    defineField({
      name: 'tasks',
      title: 'Tasks',
      type: 'array',
      description: 'From task_statements',
      group: 'tasks',
      readOnly: true,
      of: [defineArrayMember({type: 'onetTaskItem'})],
    }),
    defineField({
      name: 'jobTitles',
      title: 'Job Titles',
      type: 'array',
      description: 'From job_titles',
      group: 'titles',
      readOnly: true,
      of: [defineArrayMember({type: 'onetJobTitleItem'})],
    }),
    defineField({
      name: 'softwareSkills',
      title: 'Software Skills',
      type: 'array',
      description: 'From software_skills',
      group: 'skills',
      readOnly: true,
      of: [defineArrayMember({type: 'onetSoftwareSkillItem'})],
    }),
    defineField({
      name: 'workStyles',
      title: 'Work Styles',
      type: 'array',
      description: 'From work_styles',
      group: 'ratings',
      readOnly: true,
      of: [defineArrayMember({type: 'onetWorkStyleItem'})],
    }),
    defineField({
      name: 'ratings',
      title: 'Ratings',
      type: 'array',
      description:
        'From essential_skills, transferable_skills, knowledge, abilities, work_activities, education and work_context',
      group: 'ratings',
      readOnly: true,
      of: [defineArrayMember({type: 'onetRatingItem'})],
    }),
    defineField({
      name: 'relatedOccupations',
      title: 'Related Occupations',
      type: 'array',
      description: 'From related_occupations',
      group: 'related',
      readOnly: true,
      of: [defineArrayMember({type: 'onetRelatedOccupationItem'})],
    }),
  ],
  preview: {
    select: {title: 'title', onetsocCode: 'onetsocCode'},
    prepare({title, onetsocCode}) {
      return {
        title,
        subtitle: onetsocCode,
      }
    },
  },
})
