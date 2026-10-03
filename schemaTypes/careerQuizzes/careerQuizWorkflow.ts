/**
 * Review workflow for career quizzes, run by `@sanity-labs/sanity-plugin-workflows`.
 *
 * Every published quiz appears in the "Other career quizzes" list on the web app's /quiz page,
 * so publishing is only allowed at Approved, the last stage. `publishOnApproveAction` turns the
 * plugin's "Move to Approved" button into "Approve and publish", so an approved quiz is always
 * live. `pnpm setup:quizzes` creates the `workflow.definition` document from this file.
 * After that, Studio is the source of truth: edit the workflow there. Labels can change freely,
 * but the Studio structure, the publish action, and the setup script filter on the stage slugs,
 * so keep those stable.
 */
import {blocks, slug, task} from '../workflow'

export const CAREER_QUIZ_WORKFLOW_ID = 'workflow.definition.careerQuiz'

export const CAREER_QUIZ_STAGES = [
  {slug: 'draft', label: 'Draft'},
  {slug: 'ready_for_review', label: 'Ready to Review'},
  {slug: 'in_review', label: 'In Review'},
  {slug: 'approved', label: 'Approved'},
] as const

export const IN_REVIEW_QUIZ_STAGE = CAREER_QUIZ_STAGES[2]
export const APPROVED_QUIZ_STAGE = CAREER_QUIZ_STAGES[3]
export const RETIRED_QUIZ_STAGE = {slug: 'retired', label: 'Retired'} as const

const SUBMITTER = 'submitter'
export const CONTENT_MANAGER_ROLE = {slug: 'content_manager', label: 'Content Manager'} as const
const CONTENT_MANAGER = CONTENT_MANAGER_ROLE.slug

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
    'A Content Manager checks every submitted career quiz, and takes it themselves, before it is recommended to job seekers on the /quiz page.',
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
      _key: `role-${CONTENT_MANAGER}`,
      label: CONTENT_MANAGER_ROLE.label,
      slug: slug(CONTENT_MANAGER),
      description:
        'Someone other than the submitter who vets the provider, takes the quiz, and decides what is listed on /quiz.',
      projectRoles: ['administrator', 'editor'],
    },
  ],
  stages: [
    stage(0, '#9CA3AF', 'pencil', {
      stageCriteria: blocks(
        'draft-criteria',
        'Fill in the quiz details and assign a Submitter and a Content Manager under Assignments.',
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
    stage(1, '#F59E0B', 'inbox', {
      stageCriteria: blocks(
        'ready-criteria',
        'The quiz waits here for review. The Content Manager moves it to In Review when they start.',
      ),
    }),
    stage(2, '#3B82F6', 'clipboard-check', {
      stageCriteria: blocks(
        'review-criteria',
        'The Content Manager checks the provider and the listing, then takes the quiz as a job seeker would. Send the quiz back to Draft if it needs changes.',
      ),
      enableCompletionGating: true,
      taskTemplates: [
        task(
          'review-provider',
          'Check the provider is trustworthy',
          'Confirm who runs the quiz and read its privacy policy. Reject quizzes that sell personal data, push paid coaching before showing results, or come from an unknown source.',
          CONTENT_MANAGER,
          3,
        ),
        task(
          'review-listing',
          'Check the description, focus, and cost',
          'The description should say what the quiz measures and who it suits, in plain language. The focus and cost should match the quiz site.',
          CONTENT_MANAGER,
          3,
        ),
        task(
          'review-take-quiz',
          'Take the quiz end to end',
          'Open the URL, finish the quiz, and confirm the results suggest specific careers. Note whether you had to create an account or pay to see them, and update the cost if so.',
          CONTENT_MANAGER,
          5,
        ),
        task(
          'review-mobile',
          'Try the quiz on a phone',
          'Many job seekers only have a phone. Check that the quiz is usable on a small screen.',
          CONTENT_MANAGER,
          5,
          false,
        ),
      ],
    }),
    stage(3, '#10B981', 'circle-check', {
      stageCriteria: blocks(
        'approved-criteria',
        'Approving publishes the quiz, and it appears in the "Other career quizzes" list on /quiz within a few minutes. Small fixes can be published from here; send it back to In Review for anything that changes what the quiz is.',
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
      allowedRoles: [CONTENT_MANAGER],
      enableNotifications: true,
    },
  ],
}
