import {useState} from 'react'
import {PublishIcon} from '@sanity/icons/Publish'
import {useToast} from '@sanity/ui/toast'
import {
  performWorkflowTransition,
  type WorkflowTransitionDocument,
} from '@sanity-labs/workflow-kit/engine'
import {type DocumentActionComponent, useClient, useCurrentUser, useValidationStatus} from 'sanity'
import {
  APPROVED_QUIZ_STAGE,
  PUBLISHED_QUIZ_STAGE,
} from '../schemaTypes/careerQuizzes/careerQuizWorkflow'

/**
 * Wraps the workflow plugin's publish action so that, at Approved, its "Move to Published" button
 * becomes one Publish that sets the stage to Published and publishes the quiz. Workflow
 * transitions only patch `status`, so without this an approved quiz would need two clicks and
 * would read Published before it was live. Every other stage keeps the plugin's action.
 *
 * Must run after `workflowAuditTrailActionResolver`, which replaces the publish action.
 */
export function withPublishApprovedQuiz(prev: DocumentActionComponent[]) {
  return prev.map((action) => {
    if (action.action !== 'publish') return action
    const PublishApprovedQuiz: DocumentActionComponent = (props) => {
      const workflowResult = action(props)
      const client = useClient({apiVersion: '2025-01-01'})
      const currentUser = useCurrentUser()
      const toast = useToast()
      const [publishing, setPublishing] = useState(false)
      const draftId = `drafts.${props.id}`
      const {validation, isValidating} = useValidationStatus(draftId, props.type, true)

      const {draft} = props
      if (!workflowResult || !draft || draft.status !== APPROVED_QUIZ_STAGE.slug) {
        return workflowResult
      }

      const hasErrors = validation.some((marker) => marker.level === 'error')
      return {
        ...workflowResult,
        dialog: null,
        icon: PublishIcon,
        label: publishing ? 'Publishing…' : 'Publish',
        tone: 'positive',
        disabled: publishing || isValidating || hasErrors || !props.ready || !currentUser,
        title: hasErrors
          ? 'Fix the validation errors before publishing.'
          : `Move to ${PUBLISHED_QUIZ_STAGE.label} and publish this quiz on /quiz.`,
        onHandle: async () => {
          if (!currentUser) return
          setPublishing(true)
          try {
            await performWorkflowTransition({
              client,
              currentUserId: currentUser.id,
              document: draft as WorkflowTransitionDocument,
              documentId: draftId,
              documentType: props.type,
              logPrefix: '[publishApprovedQuiz]',
              targetStatusSlug: PUBLISHED_QUIZ_STAGE.slug,
            })
            await client.action({
              actionType: 'sanity.action.document.publish',
              draftId,
              publishedId: props.id,
            })
            toast.push({status: 'success', title: 'Published'})
            props.onComplete()
          } catch (error) {
            console.error('[publishApprovedQuiz] Failed to publish:', error)
            toast.push({
              status: 'error',
              title: 'Publish failed',
              description:
                error instanceof Error
                  ? `${error.message} If the stage already says Published, click Publish again.`
                  : 'Could not publish this quiz.',
            })
          } finally {
            setPublishing(false)
          }
        },
      }
    }
    PublishApprovedQuiz.action = 'publish'
    return PublishApprovedQuiz
  })
}
