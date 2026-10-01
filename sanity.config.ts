import {contextPlugin, CONTEXT_SCHEMA_TYPE_NAME} from '@sanity/context/studio'
import {workflowAuditTrailActionResolver} from '@sanity-labs/sanity-plugin-workflows/actions'
import {createWorkflowAuditInspector} from '@sanity-labs/sanity-plugin-workflows/audit'
import {defineConfig} from 'sanity'
import {type ListItemBuilder, structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {COACHING_TYPE_NAMES, coachingStructureItems} from './structure/coachingStructure'
import {ONET_TYPE_NAMES, onetStructureItems} from './structure/onetStructure'

const workflowAuditInspector = createWorkflowAuditInspector()

export default defineConfig({
  name: 'default',
  title: 'Careers Exploration',

  projectId: 'rhq335ze',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) => {
        const agentTypes = [CONTEXT_SCHEMA_TYPE_NAME]
        const groupedTypes = [...ONET_TYPE_NAMES, ...COACHING_TYPE_NAMES, ...agentTypes]
        const defaultListItems = S.documentTypeListItems().filter(
          (item: ListItemBuilder) => !groupedTypes.includes(item.getId() ?? ''),
        )

        return S.list()
          .title('Content')
          .items([
            ...onetStructureItems(S),
            ...coachingStructureItems(S),
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
    actions: (prev, context) =>
      context.schemaType === 'coachingGuide'
        ? workflowAuditTrailActionResolver(prev, context)
        : prev,
    inspectors: (prev, context) =>
      context.documentType === 'coachingGuide' ? [workflowAuditInspector, ...prev] : prev,
  },
})
