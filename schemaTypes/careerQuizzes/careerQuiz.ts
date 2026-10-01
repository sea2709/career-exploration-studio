import {defineField, defineType} from 'sanity'
import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {CAREER_QUIZ_STAGES, RETIRED_QUIZ_STAGE} from './careerQuizWorkflow'

export const QUIZ_FOCUSES = [
  {title: 'Interests', value: 'interests'},
  {title: 'Transferable skills', value: 'skills'},
  {title: 'Work values', value: 'values'},
  {title: 'Personality', value: 'personality'},
  {title: 'Veterans', value: 'veterans'},
  {title: 'Students', value: 'students'},
  {title: 'Quick check', value: 'quick'},
]

export const QUIZ_COSTS = [
  {title: 'Free', value: 'free'},
  {title: 'Free, with paid extras', value: 'freemium'},
  {title: 'Paid', value: 'paid'},
]

/**
 * An external career quiz recommended to job seekers. Every published quiz appears in the
 * "Other career quizzes" list on the web app's /quiz page, which reads them through
 * `web/src/pages/api/career-quizzes.ts`.
 *
 * Studio users submit quizzes, and they go through the review workflow in
 * `careerQuizWorkflow.ts`, which only allows publishing at Approved.
 */
export const careerQuiz = defineType({
  name: 'careerQuiz',
  title: 'Career Quiz',
  type: 'document',
  icon: ClipboardIcon,
  // The workflow's publish gate lets documents without a stage through, so require one.
  validation: (rule) =>
    rule.custom((doc) =>
      doc?.status ? true : 'Add the quiz to the review workflow before publishing.',
    ),
  fields: [
    defineField({
      name: 'name',
      title: 'Quiz name',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'provider',
      title: 'Provider',
      type: 'string',
      description: 'The organization that runs the quiz, for example "U.S. Department of Labor".',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'url',
      title: 'Quiz URL',
      type: 'url',
      description: 'Link straight to the quiz, not the provider’s homepage.',
      validation: (rule) =>
        rule
          .required()
          .uri({scheme: ['https']})
          .custom(async (url, context) => {
            if (!url || !context.document) return true
            const id = context.document._id.replace(/^drafts\./, '')
            const duplicate = await context
              .getClient({apiVersion: '2025-01-01'})
              .fetch<string | null>(
                `*[_type == "careerQuiz" && url == $url && !(_id in [$id, "drafts." + $id]) && !(_id in path("versions.**"))][0].name`,
                {url, id},
              )
            return duplicate ? `“${duplicate}” already uses this URL.` : true
          }),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Shown under the quiz name. Say what it measures and who it suits.',
      validation: (rule) => rule.required().max(200),
    }),
    defineField({
      name: 'focus',
      title: 'Focus',
      type: 'string',
      options: {list: QUIZ_FOCUSES, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cost',
      title: 'Cost',
      type: 'string',
      options: {list: QUIZ_COSTS, layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'listOrder',
      title: 'List order',
      type: 'number',
      description:
        'Lower numbers show first on the site. Quizzes without a number follow, sorted by name.',
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: 'submitterNotes',
      title: 'Notes for reviewers',
      type: 'text',
      rows: 3,
      description: 'Why this quiz is worth listing. Not shown on the site.',
    }),
  ],
  orderings: [
    {
      title: 'List order',
      name: 'listOrderAsc',
      by: [
        {field: 'listOrder', direction: 'asc'},
        {field: 'name', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'name', provider: 'provider', status: 'status'},
    prepare({title, provider, status}) {
      const stage = [...CAREER_QUIZ_STAGES, RETIRED_QUIZ_STAGE].find((s) => s.slug === status)
      return {title, subtitle: [provider, stage?.label].filter(Boolean).join(' · ')}
    },
  },
})
