import {contextPlugin, CONTEXT_SCHEMA_TYPE_NAME} from '@sanity/context/studio'
import {defineConfig} from 'sanity'
import {type ListItemBuilder, structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {ONET_TYPE_NAMES, onetStructureItems} from './structure/onetStructure'

export default defineConfig({
  name: 'default',
  title: 'Careers Exploration',

  projectId: 'rhq335ze',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) => {
        const agentTypes = [CONTEXT_SCHEMA_TYPE_NAME]
        const defaultListItems = S.documentTypeListItems().filter(
          (item: ListItemBuilder) =>
            !ONET_TYPE_NAMES.includes(item.getId() ?? '') && !agentTypes.includes(item.getId() ?? ''),
        )

        return S.list()
          .title('Content')
          .items([
            ...onetStructureItems(S),
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
})
