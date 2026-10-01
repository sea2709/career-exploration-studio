import type {StructureBuilder} from 'sanity/structure'

/** The `workflow.definition` documents that govern one document type. */
export function reviewWorkflowItem(S: StructureBuilder, documentType: string) {
  return S.listItem()
    .id(`${documentType}-workflow`)
    .title('Review workflow')
    .child(
      S.documentList()
        .title('Review workflow')
        .schemaType('workflow.definition')
        .filter('_type == "workflow.definition" && documentType == $documentType')
        .params({documentType}),
    )
}
