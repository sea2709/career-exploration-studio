import type {StructureBuilder} from 'sanity/structure'
import {CommentIcon} from '@sanity/icons/Comment'
import {COACHING_STAGES, RETIRED_STAGE} from '../schemaTypes/coaching/coachingWorkflow'

export const COACHING_TYPE_NAMES = ['coachingGuide', 'workflow.definition']

export function coachingStructureItems(S: StructureBuilder) {
  const stageList = ({slug, label}: {slug: string; label: string}) =>
    S.listItem()
      .id(`coaching-${slug}`)
      .title(label)
      .child(
        S.documentList()
          .title(label)
          .schemaType('coachingGuide')
          .filter('_type == "coachingGuide" && status == $status')
          .params({status: slug}),
      )

  return [
    S.listItem()
      .title('Coaching Guides')
      .icon(CommentIcon)
      .child(
        S.list()
          .title('Coaching Guides')
          .items([
            S.listItem()
              .title('All guides')
              .child(S.documentTypeList('coachingGuide').title('All guides')),
            S.divider(),
            ...COACHING_STAGES.map(stageList),
            stageList(RETIRED_STAGE),
            S.divider(),
            S.documentTypeListItem('workflow.definition').title('Review workflow'),
          ]),
      ),
  ]
}
