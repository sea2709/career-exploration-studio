/**
 * Review workflow for coaching guides, run by `@sanity-labs/sanity-plugin-workflows`.
 *
 * Every published guide feeds the Interview Coach's Knowledge Base and the guide panel on the
 * web app's /interview page, so publishing is only allowed at Approved. `pnpm workflow:coaching`
 * creates the `workflow.definition` document from this file. After that, Studio is the source of
 * truth: edit the workflow there. Labels can change freely, but the Studio structure and the
 * coaching scripts filter on the stage slugs, so keep those stable.
 */

export const COACHING_WORKFLOW_ID = 'workflow.definition.coachingGuide'

export const COACHING_STAGES = [
  {slug: 'draft', label: 'Draft'},
  {slug: 'counselor_review', label: 'Counselor review'},
  {slug: 'approved', label: 'Approved'},
] as const

export const RETIRED_STAGE = {slug: 'retired', label: 'Retired'} as const

const AUTHOR = 'author'
const REVIEWING_COUNSELOR = 'reviewing_counselor'

const slug = (current: string) => ({_type: 'slug', current})

const blocks = (key: string, ...paragraphs: string[]) =>
  paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `${key}-${i}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-${i}-span`, text, marks: []}],
  }))

const task = (
  key: string,
  title: string,
  description: string,
  assigneeRole: string,
  dueInDays: number,
  required = true,
) => ({
  _type: 'workflow.taskTemplate',
  _key: key,
  title,
  description: blocks(key, description),
  assigneeRole,
  dueInDays,
  required,
})

const stage = (index: number, color: string, icon: string, fields: Record<string, unknown>) => ({
  _type: 'workflow.stage',
  _key: `stage-${COACHING_STAGES[index].slug}`,
  label: COACHING_STAGES[index].label,
  slug: slug(COACHING_STAGES[index].slug),
  color: {_type: 'workflow.color', hex: color, alpha: 1},
  icon,
  enablePublishing: false,
  enableNotifications: true,
  ...fields,
})

export const coachingWorkflowDefinition = {
  _id: COACHING_WORKFLOW_ID,
  _type: 'workflow.definition',
  title: 'Coaching guide review',
  slug: slug('coaching-guide-review'),
  documentType: 'coachingGuide',
  description:
    'Counselors review every coaching guide before it reaches the Knowledge Base that grades answers, then test it in the Interview Coach once it is published.',
  forwardOnly: false,
  roles: [
    {
      _type: 'workflow.role',
      _key: `role-${AUTHOR}`,
      label: 'Author',
      slug: slug(AUTHOR),
      description: 'Writes and revises the guide, and refreshes the Knowledge Bases.',
      projectRoles: ['administrator', 'editor', 'contributor'],
    },
    {
      _type: 'workflow.role',
      _key: `role-${REVIEWING_COUNSELOR}`,
      label: 'Reviewing counselor',
      slug: slug(REVIEWING_COUNSELOR),
      description:
        'A career counselor other than the author who checks the advice and confirms how it changes grading.',
      projectRoles: ['administrator', 'editor'],
    },
  ],
  stages: [
    stage(0, '#9CA3AF', 'pencil', {
      stageCriteria: blocks(
        'draft-criteria',
        'Write the guide and assign an Author and a Reviewing counselor under Assignments.',
      ),
      enableCompletionGating: true,
      taskTemplates: [
        task(
          'draft-overlap',
          'Check existing guides for overlap',
          'Search the published guides in the same category. Extend an existing guide instead of adding a near-duplicate: the Knowledge Base merges overlapping guides and raises conflicts when they disagree.',
          AUTHOR,
          3,
        ),
      ],
    }),
    stage(1, '#3B82F6', 'clipboard-check', {
      stageCriteria: blocks(
        'review-criteria',
        'A counselor checks the advice before it can affect grading. Send the guide back to Draft if it needs changes.',
      ),
      enableCompletionGating: true,
      taskTemplates: [
        task(
          'review-job-zones',
          'Check that the Job Zones match the advice',
          'Advice for entry-level roles (Job Zones 1–2) should not expect years of experience, and advice for Zones 4–5 should expect depth. Leave Job Zones empty only if the guide applies to every role.',
          REVIEWING_COUNSELOR,
          3,
        ),
        task(
          'review-rating-scale',
          'Check the guide agrees with the rating scale',
          'The coach rates answers 1–5 against the O*NET brief for the role. The guide can shape how the coach asks, grades, and gives feedback, but must not contradict that scale or the brief.',
          REVIEWING_COUNSELOR,
          3,
        ),
      ],
    }),
    stage(2, '#10B981', 'circle-check', {
      stageCriteria: blocks(
        'approved-criteria',
        'Publishing is allowed. Published guides appear on the Interview Coach guide panel within a few minutes. A Knowledge Base refresh only files issues for the new guide; the coach uses it once those issues are applied or the Knowledge Base is rebuilt.',
      ),
      enablePublishing: true,
      taskTemplates: [
        task(
          'approved-refresh',
          'Refresh the Knowledge Base and review its issues',
          'After publishing, run `pnpm kb:coaching` in studio/. It prints the open issues the guide caused. Apply the ones that bring the guide into the entries, and send the guide back to Draft if it conflicts with existing guidance.',
          AUTHOR,
          1,
        ),
        task(
          'approved-mock-answers',
          'Run three mock answers in the Interview Coach and confirm the grading changed as expected',
          'Once the issues are applied, run a mock interview where the guide applies and give three answers. Check the ratings and feedback follow the guide. Otherwise, retire the guide or send it back to Draft.',
          REVIEWING_COUNSELOR,
          5,
        ),
      ],
    }),
  ],
  offRamps: [
    {
      _type: 'workflow.offRamp',
      _key: `offramp-${RETIRED_STAGE.slug}`,
      label: RETIRED_STAGE.label,
      slug: slug(RETIRED_STAGE.slug),
      icon: 'archive',
      tone: 'caution',
      stageCriteria: blocks(
        'retired-criteria',
        'Unpublishes the guide but keeps it in Studio. It leaves the guide panel within a few minutes and the Knowledge Base at the next refresh; run `pnpm kb:coaching` to remove it now.',
      ),
      enablePublishing: false,
      unpublishOnEntry: true,
      allowedRoles: [REVIEWING_COUNSELOR],
      enableNotifications: true,
    },
  ],
}
