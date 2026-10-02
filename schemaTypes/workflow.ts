import {
  assignmentObject,
  generateTaskTemplateObject,
  generateWorkflowOffRampObject,
  generateWorkflowStageObject,
  lucideIconType,
  setStatusObject,
  userObject,
  workflowColorSupportTypes,
  workflowColorType,
  workflowDefinitionType,
  workflowRoleObject,
} from '@sanity-labs/sanity-plugin-workflows/schema'

/**
 * The types `workflowsPlugin()` registers. The plugin itself isn't used because it adds workflow
 * fields to every document type, including the O*NET ones; only the types passed to
 * `withWorkflow()` in `index.ts` get a workflow.
 */
export const workflowSchemaTypes = [
  userObject,
  lucideIconType,
  ...workflowColorSupportTypes,
  workflowColorType,
  setStatusObject,
  workflowRoleObject,
  generateTaskTemplateObject({}),
  generateWorkflowStageObject({}),
  generateWorkflowOffRampObject({}),
  assignmentObject,
  workflowDefinitionType,
]

/** Helpers for writing `workflow.definition` documents in code. */
export const slug = (current: string) => ({_type: 'slug', current})

export const blocks = (key: string, ...paragraphs: string[]) =>
  paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `${key}-${i}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `${key}-${i}-span`, text, marks: []}],
  }))

export const task = (
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
