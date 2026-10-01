/**
 * Review workflow for career quizzes, run by `@sanity-labs/sanity-plugin-workflows`.
 *
 * Every published quiz appears in the "Other career quizzes" list on the web app's /quiz page,
 * so publishing is only allowed at Approved. `pnpm setup:quizzes` creates the
 * `workflow.definition` document from this file. After that, Studio is the source of truth: edit
 * the workflow there. Labels can change freely, but the Studio structure and the setup script
 * filter on the stage slugs, so keep those stable.
 */
import {blocks, slug, task} from '../workflow'

export const CAREER_QUIZ_WORKFLOW_ID = 'workflow.definition.careerQuiz'

export const CAREER_QUIZ_STAGES = [
  {slug: 'draft', label: 'Draft'},
  {slug: 'counselor_review', label: 'Counselor review'},
  {slug: 'quiz_test', label: 'Quiz test'},
  {slug: 'approved', label: 'Approved'},
] as const

export const RETIRED_QUIZ_STAGE = {slug: 'retired', label: 'Retired'} as const

const SUBMITTER = 'submitter'
const REVIEWING_COUNSELOR = 'reviewing_counselor'

const stage = (index: number, color: string, icon: string, fields: Record<string, unknown>) => ({
  _type: 'workflow.stage',
  _key: `stage-${CAREER_QUIZ_STAGES[index].slug}`,
  label: CAREER_QUIZ_STAGES[index].label,
  slug: slug(CAREER_QUIZ_STAGES[index].slug),
  color: {_type: 'workflow.color', hex: color, alpha: 1},
  icon,
  enablePublishing: false,
  enableNotifications: true,
  ...fields,
})

export const careerQuizWorkflowDefinition = {
  _id: CAREER_QUIZ_WORKFLOW_ID,
  _type: 'workflow.definition',
  title: 'Career quiz review',
  slug: slug('career-quiz-review'),
  documentType: 'careerQuiz',
  description:
    'Counselors check every submitted career quiz, and take it themselves, before it is recommended to job seekers on the /quiz page.',
  forwardOnly: false,
  roles: [
    {
      _type: 'workflow.role',
      _key: `role-${SUBMITTER}`,
      label: 'Submitter',
      slug: slug(SUBMITTER),
      description: 'Suggests the quiz, fills in its details, and revises it after review.',
      projectRoles: ['administrator', 'editor', 'contributor'],
    },
    {
      _type: 'workflow.role',
      _key: `role-${REVIEWING_COUNSELOR}`,
      label: 'Reviewing counselor',
      slug: slug(REVIEWING_COUNSELOR),
      description:
        'A career counselor other than the submitter who vets the provider and takes the quiz.',
      projectRoles: ['administrator', 'editor'],
    },
  ],
  stages: [
    stage(0, '#9CA3AF', 'pencil', {
      stageCriteria: blocks(
        'draft-criteria',
        'Fill in the quiz details and assign a Submitter and a Reviewing counselor under Assignments.',
      ),
      enableCompletionGating: true,
      taskTemplates: [
        task(
          'draft-duplicates',
          'Check the list for the same quiz',
          'Search the existing career quizzes by name and provider. The URL check catches exact duplicates, but the same quiz is often reachable from more than one address.',
          SUBMITTER,
          3,
        ),
      ],
    }),
    stage(1, '#3B82F6', 'clipboard-check', {
      stageCriteria: blocks(
        'review-criteria',
        'A counselor checks the provider and the listing before anyone tests it. Send the quiz back to Draft if it needs changes.',
      ),
      enableCompletionGating: true,
      taskTemplates: [
        task(
          'review-provider',
          'Check the provider is trustworthy',
          'Confirm who runs the quiz and read its privacy policy. Reject quizzes that sell personal data, push paid coaching before showing results, or come from an unknown source.',
          REVIEWING_COUNSELOR,
          3,
        ),
        task(
          'review-listing',
          'Check the description, focus, and cost',
          'The description should say what the quiz measures and who it suits, in plain language. The focus and cost should match the quiz site.',
          REVIEWING_COUNSELOR,
          3,
        ),
      ],
    }),
    stage(2, '#8B5CF6', 'flask-conical', {
      stageCriteria: blocks(
        'test-criteria',
        'Take the quiz as a job seeker would before recommending it.',
      ),
      enableCompletionGating: true,
      taskTemplates: [
        task(
          'test-take-quiz',
          'Take the quiz end to end',
          'Open the URL, finish the quiz, and confirm the results suggest specific careers. Note whether you had to create an account or pay to see them, and update the cost if so.',
          REVIEWING_COUNSELOR,
          5,
        ),
        task(
          'test-mobile',
          'Try the quiz on a phone',
          'Many job seekers only have a phone. Check that the quiz is usable on a small screen.',
          REVIEWING_COUNSELOR,
          5,
          false,
        ),
      ],
    }),
    stage(3, '#10B981', 'circle-check', {
      stageCriteria: blocks(
        'approved-criteria',
        'Publishing is allowed. Published quizzes appear in the "Other career quizzes" list on /quiz within a few minutes.',
      ),
      enablePublishing: true,
    }),
  ],
  offRamps: [
    {
      _type: 'workflow.offRamp',
      _key: `offramp-${RETIRED_QUIZ_STAGE.slug}`,
      label: RETIRED_QUIZ_STAGE.label,
      slug: slug(RETIRED_QUIZ_STAGE.slug),
      icon: 'archive',
      tone: 'caution',
      stageCriteria: blocks(
        'retired-criteria',
        'Use this for dead links, quizzes that became paid, or providers that no longer pass review. Unpublishes the quiz, which leaves the /quiz list within a few minutes, and keeps it in Studio.',
      ),
      enablePublishing: false,
      unpublishOnEntry: true,
      allowedRoles: [REVIEWING_COUNSELOR],
      enableNotifications: true,
    },
  ],
}
