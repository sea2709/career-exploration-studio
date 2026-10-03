# Sanity Clean Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

## Coaching guide review workflow

Every published `coachingGuide` feeds the Interview Coach's Knowledge Base and the guide panel on the web app's `/interview` page, so guides go through a review workflow before publishing. It runs on [`@sanity-labs/sanity-plugin-workflows`](https://github.com/sanity-labs/sanity-plugin-workflows), applied to `coachingGuide` only (see `schemaTypes/coaching/index.ts` and `sanity.config.ts`).

| Stage            | Who                 | Tasks                                                                                                                       |
| ---------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Draft            | Author              | Check existing guides for overlap                                                                                           |
| Counselor review | Reviewing counselor | Check that the Job Zones match the advice; check the guide agrees with the rating scale                                     |
| Approved         | Author, counselor   | Publishing allowed. After publishing: refresh the Knowledge Base and review its issues; run three mock answers in the coach |

Draft and Counselor review gate on their tasks, so a guide can't move on until they're done. There's no staging Knowledge Base, so a guide can only be tried in the coach once it's published. A refresh only files issues for a new guide, so the coach uses it once those issues are applied (or after `pnpm kb:coaching --rebuild`).

**Retired** is an off-ramp that only a Reviewing counselor can use. It unpublishes the guide, which takes it off the guide panel and out of the Knowledge Base at its next refresh, and keeps the document in Studio.

The definition lives in `schemaTypes/coaching/coachingWorkflow.ts`. To set it up:

1. Run `pnpm workflow:coaching --dry-run`, then `pnpm workflow:coaching`. This creates the `workflow.definition` document and marks existing published guides Approved (drafts start at Draft). After that, edit the workflow in Studio under **Coaching Guides → Review workflow**. Keep the stage slugs, since the Studio structure and scripts filter on them.
2. Tasks live in the comments addon dataset. If nobody has added a comment or task in this Studio yet, add one to any document once, or task creation and gating silently do nothing.
3. On each guide, set the Author and Reviewing counselor under **Assignments**. Role-bound tasks are only created once the role has an assignee.

## Career quiz review workflow

Every published `careerQuiz` appears in the "Other career quizzes" list on the web app's `/quiz` page (read by `web/src/pages/api/career-quizzes.ts`). Studio users submit quizzes by creating a Career Quiz document, and it goes through the same kind of workflow before publishing. The workflow types are shared with coaching guides (`schemaTypes/workflow.ts`); the definition lives in `schemaTypes/careerQuizzes/careerQuizWorkflow.ts`.

| Stage           | Who             | Required tasks (completion gating on)                                                                                            |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Draft           | Submitter       | Check the list for the same quiz                                                                                                 |
| Ready to Review |                 | None. The quiz waits for the Content Manager, who moves it to In Review                                                          |
| In Review       | Content Manager | Check the provider is trustworthy; check the description, focus, and cost; take the quiz end to end. Optional: try it on a phone |
| Approved        |                 | Live on `/quiz`. Small fixes can be republished here                                                                             |

Workflow transitions only change a quiz's `status`, so at In Review the plugin's "Move to Approved" button becomes **Approve and publish** (`actions/publishOnApproveAction.ts`, wired in `sanity.config.ts`). It keeps the plugin's task gating and confirm dialog, then publishes the quiz, so Approved means "live on the site". If the publish fails, the quiz stays at Approved with the regular **Publish** button to retry. Picking Approved in the status bar only changes the stage; click **Publish** afterwards.

**Retired** is an off-ramp for dead links, quizzes that became paid, or providers that no longer pass review. Only a Content Manager can use it. It unpublishes the quiz and keeps the document in Studio.

To set it up, run `pnpm setup:quizzes --dry-run`, then `pnpm setup:quizzes`. This creates the `workflow.definition` document and the starter quizzes (published, at Approved). After that, edit the workflow in Studio under **Career Quizzes → Review workflow**, and keep the stage slugs. To roll out a changed list of stages, run it with `--replace`; it also moves quizzes off stages that no longer exist. The coaching notes above about the comments addon dataset and Assignments apply here too.

The Focus and Cost options (`QUIZ_FOCUSES` and `QUIZ_COSTS` in `careerQuiz.ts`) are mirrored as label maps in `web/src/components/OtherCareerQuizzes.tsx`.
