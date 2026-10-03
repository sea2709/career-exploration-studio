import {contextPlugin, CONTEXT_SCHEMA_TYPE_NAME} from '@sanity/context/studio'
import {workflowAuditTrailActionResolver} from '@sanity-labs/sanity-plugin-workflows/actions'
import {createWorkflowAuditInspector} from '@sanity-labs/sanity-plugin-workflows/audit'
import {defineConfig} from 'sanity'
import {type ListItemBuilder, structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {withPublishOnApprove} from './actions/publishOnApproveAction'
import {schemaTypes} from './schemaTypes'
import {CAREER_QUIZ_TYPE_NAMES, careerQuizStructureItems} from './structure/careerQuizStructure'
import {COACHING_TYPE_NAMES, coachingStructureItems} from './structure/coachingStructure'
import {ONET_TYPE_NAMES, onetStructureItems} from './structure/onetStructure'

const workflowAuditInspector = createWorkflowAuditInspector()

/** Document types passed to `withWorkflow()` in schemaTypes/index.ts. */
const WORKFLOW_TYPES = ['coachingGuide', 'careerQuiz']

export default defineConfig({
  name: 'default',
  title: 'Careers Exploration',

  projectId: 'rhq335ze',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) => {
        const agentTypes = [CONTEXT_SCHEMA_TYPE_NAME]
        const groupedTypes = [
          ...ONET_TYPE_NAMES,
          ...COACHING_TYPE_NAMES,
          ...CAREER_QUIZ_TYPE_NAMES,
          ...agentTypes,
        ]
        const defaultListItems = S.documentTypeListItems().filter(
          (item: ListItemBuilder) => !groupedTypes.includes(item.getId() ?? ''),
        )

        return S.list()
          .title('Content')
          .items([
            ...onetStructureItems(S),
            ...coachingStructureItems(S),
            ...careerQuizStructureItems(S),
            ...defaultListItems,
            S.divider(),
            S.listItem()
              .title('Agents')
              .child(
                S.list()
                  .title('Agents')
                  .items([
                    S.documentTypeListItem(CONTEXT_SCHEMA_TYPE_NAME).title('Sanity Context'),
                  ]),
              ),
          ])
      },
    }),
    visionTool(),
    contextPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      if (!WORKFLOW_TYPES.includes(context.schemaType)) return prev
      const actions = workflowAuditTrailActionResolver(prev, context)
      return context.schemaType === 'careerQuiz' ? withPublishOnApprove(actions) : actions
    },
    inspectors: (prev, context) =>
      WORKFLOW_TYPES.includes(context.documentType) ? [workflowAuditInspector, ...prev] : prev,
  },
})
