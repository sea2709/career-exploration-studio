# Sanity Clean Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)

## Coaching guide review workflow

Every published `coachingGuide` feeds the Interview Coach's Knowledge Base and the guide panel on the web app's `/interview` page, so guides go through a review workflow before publishing. It runs on [`@sanity-labs/sanity-plugin-workflows`](https://github.com/sanity-labs/sanity-plugin-workflows), applied to `coachingGuide` only (see `schemaTypes/coaching/index.ts` and `sanity.config.ts`).

| Stage            | Who                 | Required tasks (completion gating on)                                                       |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| Draft            | Author              | Check existing guides for overlap                                                           |
| Counselor review | Reviewing counselor | Check that the Job Zones match the advice; check the guide agrees with the rating scale     |
| Coach test       | Author, counselor   | Refresh the staging Knowledge Base; run three mock answers and confirm the grading changed |
| Approved         | Author              | Publishing allowed. Optional: refresh the Knowledge Base                                    |

**Retired** is an off-ramp that only a Reviewing counselor can use. It unpublishes the guide, which takes it off the guide panel and out of the Knowledge Base at its next refresh, and keeps the document in Studio.

The definition lives in `schemaTypes/coaching/coachingWorkflow.ts`. To set it up:

1. Run `pnpm workflow:coaching --dry-run`, then `pnpm workflow:coaching`. This creates the `workflow.definition` document and marks existing published guides Approved (drafts start at Draft). After that, edit the workflow in Studio under **Coaching Guides → Review workflow**. Keep the stage slugs, since the Studio structure and scripts filter on them.
2. Tasks live in the comments addon dataset. If nobody has added a comment or task in this Studio yet, add one to any document once, or task creation and gating silently do nothing.
3. On each guide, set the Author and Reviewing counselor under **Assignments**. Role-bound tasks are only created once the role has an assignee.
4. For the Coach test stage, run `pnpm kb:coaching --staging` once to create a staging Knowledge Base (save the printed `COACHING_STAGING_KB_ID`), create a Context MCP endpoint for it in the Sanity dashboard, and point a local agent's `SANITY_COACHING_MCP_URL` at that endpoint.
