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
