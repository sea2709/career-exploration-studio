import {defineArrayMember, defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons/Comment'
import {COACHING_STAGES, RETIRED_STAGE} from './coachingWorkflow'

export const COACHING_CATEGORIES = [
  {title: 'Answering well', value: 'answering'},
  {title: 'Behavioral questions', value: 'behavioral'},
  {title: 'Skills and situational questions', value: 'skills'},
  {title: 'Work styles', value: 'workStyles'},
  {title: 'Grading answers', value: 'grading'},
  {title: 'Giving feedback', value: 'feedback'},
  {title: 'Candidate situations', value: 'situations'},
  {title: 'Practice and preparation', value: 'practice'},
]

/**
 * Interview coaching guidance written by career counselors. The Mock Interview Coach reads
 * these through a Sanity Context Knowledge Base, which imports every published guide, and the
 * web app lists them beside the interview. Prefer editing a guide over adding a near-duplicate:
 * the build merges overlapping guides and raises conflict issues when they disagree.
 *
 * Guides go through the review workflow in `coachingWorkflow.ts`, which adds the `status`,
 * `assignments`, and audit trail fields and only allows publishing at Approved.
 */
export const coachingGuide = defineType({
  name: 'coachingGuide',
  title: 'Coaching Guide',
  type: 'document',
  icon: CommentIcon,
  // The workflow's publish gate lets documents without a stage through, so require one.
  validation: (rule) =>
    rule.custom((doc) =>
      doc?.status ? true : 'Add the guide to the review workflow before publishing.',
    ),
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {list: COACHING_CATEGORIES, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'jobZones',
      title: 'Job Zones',
      type: 'array',
      description:
        'O*NET Job Zones (1 little preparation to 5 extensive preparation) this guide is written for. Leave empty if it applies to every role.',
      of: [defineArrayMember({type: 'number'})],
      options: {
        list: [1, 2, 3, 4, 5].map((zone) => ({title: `Zone ${zone}`, value: zone})),
        layout: 'grid',
      },
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 2,
      description: 'One or two sentences on when the coach should use this guide.',
      validation: (rule) => rule.required().max(300),
    }),
    defineField({
      name: 'body',
      title: 'Guidance',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Heading', value: 'h3'},
          ],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {decorators: [{title: 'Strong', value: 'strong'}], annotations: []},
        }),
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [
        {field: 'category', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'title', category: 'category', status: 'status'},
    prepare({title, category, status}) {
      const stage = [...COACHING_STAGES, RETIRED_STAGE].find((s) => s.slug === status)
      return {
        title,
        subtitle: [COACHING_CATEGORIES.find((c) => c.value === category)?.title, stage?.label]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})
