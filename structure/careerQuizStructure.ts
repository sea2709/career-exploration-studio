import type {StructureBuilder} from 'sanity/structure'
import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {
  CAREER_QUIZ_STAGES,
  RETIRED_QUIZ_STAGE,
} from '../schemaTypes/careerQuizzes/careerQuizWorkflow'
import {reviewWorkflowItem} from './workflowStructure'

export const CAREER_QUIZ_TYPE_NAMES = ['careerQuiz']

export function careerQuizStructureItems(S: StructureBuilder) {
  const stageList = ({slug, label}: {slug: string; label: string}) =>
    S.listItem()
      .id(`career-quiz-${slug}`)
      .title(label)
      .child(
        S.documentList()
          .title(label)
          .schemaType('careerQuiz')
          .filter('_type == "careerQuiz" && status == $status')
          .params({status: slug}),
      )

  return [
    S.listItem()
      .title('Career Quizzes')
      .icon(ClipboardIcon)
      .child(
        S.list()
          .title('Career Quizzes')
          .items([
            S.listItem()
              .title('All quizzes')
              .child(S.documentTypeList('careerQuiz').title('All quizzes')),
            S.divider(),
            ...CAREER_QUIZ_STAGES.map(stageList),
            stageList(RETIRED_QUIZ_STAGE),
            S.divider(),
            reviewWorkflowItem(S, 'careerQuiz'),
          ]),
      ),
  ]
}
