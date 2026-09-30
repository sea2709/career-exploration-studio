/**
 * Starter interview coaching guidance, seeded once into `coachingGuide` documents.
 * After seeding, Studio is the source of truth: edit guides there, not here.
 *
 * `body` is a small Markdown subset: blank-line-separated paragraphs, `### ` headings,
 * `- ` bullets, and `**bold**`.
 */
export type GuideSeed = {
  title: string
  category: string
  jobZones?: number[]
  summary: string
  body: string
}

export const guides: GuideSeed[] = [
  {
    title: 'Structuring an answer: situation, task, action, result',
    category: 'answering',
    summary:
      'The answer structure the coach recommends for every experience-based answer, and what each part should contain.',
    body: `A strong experience-based answer walks through four parts in order. Candidates don't need to name the parts, but each one should be there.

- **Situation:** where and when, in one or two sentences. Just enough context to follow the story.
- **Task:** what the candidate was responsible for, and what made it hard.
- **Action:** the specific steps the candidate personally took. This should be most of the answer.
- **Result:** what happened, ideally with a number, a before-and-after, or feedback someone gave.

### Common gaps
- Too much situation and not enough action. If setup takes longer than the actions, the answer is unbalanced.
- Saying "we" throughout. The interviewer can't tell what the candidate did. Ask them to say "I" for their own actions.
- Stopping before the result. An answer without an outcome can rate 4 at most.

A complete answer usually takes 60 to 120 seconds to say, or about 150 to 300 words written.`,
  },
  {
    title: 'Stating results when there are no numbers',
    category: 'answering',
    summary:
      'How candidates can describe the result of their work when they have no metrics, and what counts as a result.',
    body: `Numbers make results concrete, but many jobs don't track them. A result is anything that shows the action made a difference.

- **Before and after:** "The backlog went from three weeks to three days."
- **Scale:** how many people, customers, patients, or items were affected.
- **Time or money saved,** even as an estimate: "roughly an hour a day."
- **What someone said:** a manager's feedback, a customer comment, being asked to train others.
- **What changed afterward:** a process the team kept using, a promotion, a repeat request.

Estimates are fine when the candidate says they are estimates. Invented precision is not. If a candidate truly doesn't know the outcome, a good answer says what they learned and what they would measure next time.`,
  },
  {
    title: 'Common answer mistakes',
    category: 'answering',
    summary: 'Patterns that weaken answers, so the coach can name them in feedback.',
    body: `Name the specific mistake in feedback rather than saying the answer was weak.

- **Hypothetical answers to behavioral questions.** "I would…" in reply to "Tell me about a time…" means there's no evidence yet. Ask for a real example.
- **Rambling.** Several stories at once, or a long setup. Suggest picking one example and leading with the action.
- **Listing traits instead of showing them.** "I'm a hard worker and a team player" is a claim, not evidence.
- **Hiding behind "we."** The candidate's own contribution disappears.
- **No result.** The story stops at what they did.
- **Blaming others** or speaking negatively about a past employer.
- **Buzzwords without substance.** Jargon from the job description that isn't tied to anything the candidate did.

Each of these can be fixed with a small change. Feedback should say what the change is.`,
  },
  {
    title: 'Behavioral questions: what interviewers listen for',
    category: 'behavioral',
    summary:
      'How to ask and judge "Tell me about a time…" questions, and how candidates should choose their examples.',
    body: `Behavioral questions assume past behavior predicts future behavior. The interviewer is listening for evidence the candidate has already done the thing the job needs.

### Asking
- Tie each question to one competency or work style from the brief.
- Ask about a single situation: "Tell me about a time you…", not "How do you usually…".
- Keep it to one sentence. Multi-part questions produce muddled answers.

### What good looks like
- A specific, real situation, preferably from the last few years.
- The candidate's own actions, described in enough detail to picture.
- Complexity that matches the job's required level for that competency.
- A result, and ideally a reflection on what they'd do differently.

### Helping candidates choose examples
Encourage a bank of six to eight stories that each show two or three competencies. Examples can come from work, school, volunteering, caregiving, or community roles. What matters is what the candidate did, not where.`,
  },
  {
    title: 'Skills and situational questions: "How would you…"',
    category: 'skills',
    summary:
      'How to ask and judge situational and technical questions, where the candidate reasons through a scenario.',
    body: `Situational questions test how a candidate thinks through the work the job involves. Base the scenario on a core task or technology from the brief.

### What good looks like
- **Clarifies before solving:** asks or states the assumptions that matter.
- **Works in clear steps,** in a sensible order.
- **Names trade-offs and risks,** such as safety, cost, quality, time, or who else to involve.
- **Grounds it in experience:** "When I did something similar…" turns a hypothetical into evidence.
- **Knows the limits** of their role and when to escalate.

### Pitching difficulty
Match the scenario to the competency's required level. A job needing level 2 gets a routine, well-defined task. Level 4 involves several factors to balance. Level 6 is complex or ambiguous, with no clear procedure.

A confident answer that skips steps or ignores obvious risks should score lower than a careful answer that is less polished.`,
  },
  {
    title: 'Technology and tools questions',
    category: 'skills',
    summary:
      "How to handle questions about the role's in-demand technologies, including when a candidate hasn't used them.",
    body: `The brief lists in-demand technologies for the role. Questions about them should check real, hands-on familiarity, not the ability to define terms.

- Ask what the candidate used the tool for, not whether they know it. "Walk me through the last thing you built or did in…"
- Good answers describe a concrete task, a problem they hit, and how they solved it.
- Honesty about level is a strength. "I've used it for basic reports but not automation" is better than an overclaim.

### When the candidate hasn't used a tool
Don't score it as a failure if they handle it well. A strong answer names the closest tool they have used, what transfers, and a specific plan to learn the gap. Score the reasoning and transfer they show. Bluffing about a tool they clearly haven't used should score 1 or 2.`,
  },
  {
    title: 'Work style questions',
    category: 'workStyles',
    summary:
      "How to ask about and judge O*NET work styles such as dependability, adaptability, and attention to detail.",
    body: `Work styles are personal characteristics that affect how well someone does a job, such as dependability, adaptability, attention to detail, integrity, and cooperation. The brief lists the ones with the most impact for the role.

- Ask for a situation where the trait was tested, not a self-rating. For dependability: "Tell me about a time you were relied on and things went wrong."
- Good answers show a pattern of behavior, not a one-off. Look for what the candidate does routinely.
- Watch for self-awareness: a candidate who can name the cost of a trait (too much attention to detail slowing them down) and how they manage it is showing maturity.

O*NET work styles have no level anchors, so leave demonstratedLevel and requiredLevel empty and grade on the 1 to 5 rating alone.`,
  },
  {
    title: 'Rating answers on the 1 to 5 scale',
    category: 'grading',
    summary:
      'What each rating from 1 to 5 means, with examples, so ratings stay consistent across interviews.',
    body: `Every answered or skipped question gets one rating. Rate what the candidate actually said, not what they might have meant.

- **1: No relevant content.** Skipped, "I don't know," or an answer that doesn't address the question.
- **2: Vague.** On topic but generic: claims, traits, or a hypothetical without a real situation. Generic claims without a concrete situation rate 2 at most.
- **3: Relevant with some specifics.** A real situation, but thin on the candidate's own actions, or missing structure.
- **4: Specific and structured.** A clear situation, the candidate's own actions in detail, in a logical order. The result may be missing or vague.
- **5: Specific, structured, with results.** Everything in 4, plus a concrete outcome and ideally a reflection.

### Consistency checks
- Length isn't quality. A tight 100-word answer can be a 5.
- Don't round up for confidence or polish, or down for nervous phrasing.
- The overall interview rating is the average of the question ratings, to one decimal place.`,
  },
  {
    title: 'Judging demonstrated level against O*NET anchors',
    category: 'grading',
    summary:
      'How to place an answer on the O*NET 0 to 7 Level scale using the level 2, 4, and 6 anchors from the brief.',
    body: `For skills, knowledge, and work activities, the brief gives the job's required level and anchor examples at levels 2, 4, and 6 on the 0 to 7 Level scale. The demonstrated level says how complex the work in the candidate's example was.

### Comparing to anchors
- **Complexity:** how many factors, steps, or unknowns the candidate handled.
- **Independence:** whether they followed a procedure, adapted one, or created one.
- **Stakes and scope:** who was affected and what would have happened if it went wrong.

Pick the closest anchor and adjust by about one point up or down. An example between the level 2 and level 4 anchors is about a 3. Quote the closest anchor in the feedback.

### Rules
- Only credit what the candidate described. A claim of expertise without an example doesn't raise the level.
- Demonstrated level is independent of the 1 to 5 rating. A well-told story about simple work can rate 5 with a low level. A messy answer about complex work can rate 3 with a high level.
- Below the required level isn't a failure. Say how far off it is and what kind of example would close the gap.`,
  },
  {
    title: 'Writing feedback after each answer',
    category: 'feedback',
    summary:
      'How to write the strengths, improvements, and stronger-answer tip shown on each feedback card.',
    body: `Feedback should be specific enough that the candidate knows exactly what to keep and what to change on their next try.

### Strengths
- Up to three. Point to something the candidate actually said: "You named the exact checklist you created," not "Good detail."
- If there's little to praise, note effort or the part that was on track.

### Improvements
- Up to three, most important first.
- Each one is an action: "Add the result: how long the process took afterward," not "Needs more results."
- Name the pattern if it's one of the common mistakes, such as hypothetical answers or saying "we."

### Stronger-answer tip
One sentence describing what a stronger answer would include for this question. Make it specific to their story, not generic advice.

### Tone
Direct and encouraging, like a good coach. Be honest about low ratings. Vague praise doesn't help anyone prepare.`,
  },
  {
    title: 'Writing the final report and focus areas',
    category: 'feedback',
    summary: 'How to decide readiness and write the summary, strengths, and focus areas in the final report.',
    body: `The final report sums up the whole interview. It should read as a short, honest assessment and a plan.

### Readiness
- **Ready:** average rating of about 4 or higher, and no competency far below its required level.
- **Getting there:** average around 3, or strong answers with one or two clear gaps.
- **Not yet:** average below about 2.5, or several answers without concrete examples.

### Summary
Two or three sentences: the overall impression, the biggest strength, and the most important thing to work on.

### Focus areas
Up to three, taken from the lowest-rated or furthest-below-level competencies. For each, explain why it matters for this role and give one concrete way to practice or build evidence. See the practice guidance for ideas.`,
  },
  {
    title: 'Career changers',
    category: 'situations',
    summary:
      'How to coach candidates moving from a different field, including transferable skills and the "why this change" question.',
    body: `Career changers often have the right skills described in the wrong vocabulary. Coaching should help them translate, not start over.

- **Translate experience:** encourage describing past work in the target role's terms. A retail manager's "handled scheduling for 20 staff" is workforce planning.
- **Lead with transferable competencies:** the brief's top competencies often overlap with the old job more than the candidate expects.
- **Close gaps with recent evidence:** courses, certifications, volunteer work, or side projects in the new field.
- **Prepare the "why this change" answer:** a short, positive story about moving toward something, not away from something. It should end with why this role specifically.

Grade their answers like anyone else's. An example from another field counts fully if it shows the competency at the required level.`,
  },
  {
    title: 'Entry-level candidates and limited work experience',
    category: 'situations',
    jobZones: [1, 2],
    summary:
      'How to coach candidates with little formal work experience, such as students, recent graduates, or people returning to work.',
    body: `Many strong candidates for entry-level roles have little paid experience. Evidence can come from anywhere.

- **School:** group projects, labs, clubs, sports, and student jobs.
- **Volunteering and community roles:** events, religious or cultural groups, mutual aid.
- **Home and family:** caregiving, managing a household budget, translating for relatives.
- **Informal work:** side gigs, helping in a family business.

### Coaching tips
- If a candidate says "I don't have experience with that," ask about any time they did something similar, anywhere.
- Short, concrete answers are fine. A small situation told well can rate 4 or 5.
- Grade the demonstrated level honestly against the job's required level. For entry-level jobs, required levels are usually low, so everyday examples often meet them.`,
  },
  {
    title: 'Advanced and senior roles',
    category: 'situations',
    jobZones: [4, 5],
    summary:
      'What changes when interviewing for roles needing extensive preparation, such as leadership, professional, or specialist jobs.',
    body: `Roles in Job Zones 4 and 5 usually need a degree or graduate education and several years of experience. Required levels are higher, and interviewers expect answers at a larger scope.

- **Scope:** examples should involve teams, departments, clients, or systems, not just the candidate's own tasks.
- **Ambiguity:** strong answers describe making decisions without a clear procedure or complete information.
- **Influence:** leading without authority, persuading stakeholders, and handling disagreement.
- **Judgment:** explaining why they chose one approach over another, including trade-offs.
- **Results at a higher level:** outcomes for the organization, not just task completion.

Pitch situational questions near the level 6 anchor where the brief's required level is 5 or higher. An answer that shows only routine, well-defined work should score a low demonstrated level even if it's well told.`,
  },
  {
    title: 'Difficult questions: gaps, weaknesses, and setbacks',
    category: 'situations',
    summary:
      'How candidates should handle questions about employment gaps, weaknesses, failures, or leaving a job.',
    body: `These questions test honesty and self-awareness. The best answers are brief, truthful, and move forward.

- **Employment gaps:** one or two sentences on the reason, without over-explaining, then what the candidate did to stay ready (learning, caregiving skills, volunteering) and why they're ready now.
- **Weaknesses:** a real weakness that isn't central to the job, with specific steps they're taking and evidence it's improving. Avoid disguised strengths like "I work too hard."
- **Failures and mistakes:** own the mistake, describe the fix, and say what changed afterward.
- **Leaving a job, including being let go:** stay neutral and factual about the past, and focus on what the candidate learned and wants next.

Candidates don't have to share private details such as health or family reasons. "I took time off for a family matter that's now resolved" is enough.`,
  },
  {
    title: 'Practicing and building evidence for a competency',
    category: 'practice',
    summary:
      'Concrete ways to practice for interviews and to build new evidence for a weak competency, for use in focus areas.',
    body: `Focus areas should end with something the candidate can start this week.

### Practicing answers
- Write out two or three stories for the competency, then say them aloud in under two minutes each.
- Record an answer and listen back for "we," missing results, and long setups.
- Retry the same question in this coach and compare the ratings.

### Building new evidence
When the candidate doesn't yet have a good example, suggest a way to create one.
- **Skills:** a short course with a hands-on project, or a small real task at their current job.
- **Technologies:** a free trial or tutorial project using the tool, with something they can show.
- **Knowledge:** a certification, or informational interviews with people in the role.
- **Work activities:** volunteer for the activity at work, school, or in the community.

Name a specific, small first step rather than a broad goal. "Build one dashboard in the tool from public data" is better than "learn the tool."`,
  },
]
