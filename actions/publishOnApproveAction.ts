import {useState} from 'react'
import {PublishIcon} from '@sanity/icons/Publish'
import {useToast} from '@sanity/ui/toast'
import {type DocumentActionComponent, useClient, useValidationStatus} from 'sanity'
import {
  APPROVED_QUIZ_STAGE,
  IN_REVIEW_QUIZ_STAGE,
} from '../schemaTypes/careerQuizzes/careerQuizWorkflow'

/**
 * Wraps the workflow plugin's publish action so that, at In Review, its "Move to Approved" button
 * becomes "Approve and publish": the plugin still runs its task gating, confirm dialog, and
 * transition, and the quiz is published once the transition succeeds. Workflow transitions only
 * patch `status`, so without this an approved quiz would read Approved before it was live. At
 * Approved, the last stage, the plugin shows the regular Publish for small fixes. Every other
 * stage keeps the plugin's action.
 *
 * Must run after `workflowAuditTrailActionResolver`, which replaces the publish action.
 */
export function withPublishOnApprove(prev: DocumentActionComponent[]) {
  return prev.map((action) => {
    if (action.action !== 'publish') return action
    const PublishOnApprove: DocumentActionComponent = (props) => {
      const client = useClient({apiVersion: '2025-01-01'})
      const toast = useToast()
      const [publishing, setPublishing] = useState(false)
      const draftId = `drafts.${props.id}`
      const {validation, isValidating} = useValidationStatus(draftId, props.type, true)
      // Without a draft the plugin patches the published document, which is already live.
      const approvesDraft = props.draft?.status === IN_REVIEW_QUIZ_STAGE.slug

      const publishApprovedDraft = async () => {
        setPublishing(true)
        try {
          await client.action({
            actionType: 'sanity.action.document.publish',
            draftId,
            publishedId: props.id,
          })
          toast.push({status: 'success', title: 'Published'})
        } catch (error) {
          console.error('[publishOnApprove] Failed to publish:', error)
          toast.push({
            status: 'error',
            title: 'Approved, but not published',
            description: `${error instanceof Error ? error.message : 'Could not publish this quiz.'} Click Publish to try again.`,
          })
        } finally {
          setPublishing(false)
          props.onComplete()
        }
      }

      const workflowResult = action(
        approvesDraft ? {...props, onComplete: publishApprovedDraft} : props,
      )
      if (!workflowResult || !approvesDraft) return workflowResult

      const hasErrors = validation.some((marker) => marker.level === 'error')
      return {
        ...workflowResult,
        icon: PublishIcon,
        label: publishing ? 'Publishing…' : 'Approve and publish',
        tone: 'positive',
        disabled: workflowResult.disabled || publishing || isValidating || hasErrors,
        title: hasErrors
          ? 'Fix the validation errors before approving.'
          : `Move to ${APPROVED_QUIZ_STAGE.label} and publish this quiz on /quiz.`,
      }
    }
    PublishOnApprove.action = 'publish'
    return PublishOnApprove
  })
}
