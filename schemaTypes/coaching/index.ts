import {
  assignmentObject,
  generateTaskTemplateObject,
  generateWorkflowOffRampObject,
  generateWorkflowStageObject,
  lucideIconType,
  setStatusObject,
  userObject,
  withWorkflow,
  workflowColorSupportTypes,
  workflowColorType,
  workflowDefinitionType,
  workflowRoleObject,
} from '@sanity-labs/sanity-plugin-workflows/schema'
import {coachingGuide} from './coachingGuide'

/**
 * The types `workflowsPlugin()` registers. The plugin itself isn't used because it adds workflow
 * fields to every document type, including the O*NET ones; only coaching guides get a workflow.
 */
const workflowSchemaTypes = [
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

export const coachingSchemaTypes = [...withWorkflow()([coachingGuide]), ...workflowSchemaTypes]
