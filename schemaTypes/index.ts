import {withWorkflow} from '@sanity-labs/sanity-plugin-workflows/schema'
import {careerQuizSchemaTypes} from './careerQuizzes'
import {coachingSchemaTypes} from './coaching'
import {onetSchemaTypes} from './onet'
import {workflowSchemaTypes} from './workflow'

export const schemaTypes = [
  ...onetSchemaTypes,
  ...withWorkflow()([...coachingSchemaTypes, ...careerQuizSchemaTypes]),
  ...workflowSchemaTypes,
]
