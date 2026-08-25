// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ACCRUAL_CANDIDATES, COURT, LIMITATIONS_YEARS, MOTION, NARROWEST_MARGIN, RESERVED, UNDISPUTED_FACTS } from './motion'

/**
 * What the motion would look like as a notation template, for the reader who
 * wants to see the format the other three documents actually use.
 *
 * This is not one of the templates in `templates/neon_law/` and never will be
 * — the card beside it on the page, and `README.md` before that, explain why
 * pleading paper has no render profile here. It exists only as data for
 * `MotionPage`, is never walked by `navigator validate`, and never reaches
 * `navigator template render`. The frontmatter and body below borrow the shape
 * of `templates/neon_law/nevada.md` — `questionnaire` chained field to field,
 * `custom_questions` prompting for the ones a lawyer would actually be asked,
 * a `lawyer_review` gate in `workflow` — and pull their numbers from
 * `motion.ts` rather than restate them, the same discipline `motion.ts` itself
 * uses for the authorities it quotes.
 */

export const MOTION_NOTATION_FRONTMATTER = `---
kind: filing
title: Motion for Partial Summary Judgment (Nevada)
jurisdiction: NV
respondent_type: person
code: motion_partial_summary_judgment__nevada
confidential: false
questionnaire:
  BEGIN:
    _: person__movant
  person__movant:
    _: custom_datetime__count_filed
  custom_datetime__count_filed:
    _: custom_datetime__answer_filed
  custom_datetime__answer_filed:
    _: custom_datetime__filed
  custom_datetime__filed:
    _: custom_datetime__hearing_date
  custom_datetime__hearing_date:
    _: END
  END: {}
custom_questions:
  count_filed:
    prompt: On what date was the count containing this defense filed?
  answer_filed:
    prompt: On what date did the defendant answer, pleading the defense?
  filed:
    prompt: On what date is this motion filed?
  hearing_date:
    prompt: What date has the court set for the hearing?
workflow:
  BEGIN:
    _: lawyer_review
  lawyer_review:
    _: END
  END: {}
---`

export const MOTION_NOTATION_BODY = `# MOTION FOR PARTIAL SUMMARY JUDGMENT

__FIXTURE DOCUMENT.__ This is illustrative only — a sketch of the filing on this page in the
format the engagement letter, the notice of rescission, and the affidavit actually use. The real
motion is Typst, on pleading paper, for the reason the card beside this one gives. Nothing here is
filed, and nothing in it is legal advice.

__Movant:__ {{person__movant}}, Plaintiff

__Opponent:__ Wendell Prine, Defendant

__Court:__ ${COURT.name}, ${COURT.county} · Case No. ${COURT.caseNumber} · Dept. ${COURT.department}

__Filed:__ {{custom_datetime__filed}} · __Heard:__ {{custom_datetime__hearing_date}}

## I. Relief sought

Plaintiff moves under ${MOTION.rule} for summary judgment on Defendant's ${MOTION.target}, and
asks the court to strike it. This motion does not reach any other defense pleaded in the answer.

## II. Statement of facts

The count this defense answers was filed {{custom_datetime__count_filed}}. The defense was
pleaded in the answer filed {{custom_datetime__answer_filed}}. ${UNDISPUTED_FACTS.length} facts
material to this motion are undisputed or immaterial to its outcome, each cited to the record.

## III. Argument

${ACCRUAL_CANDIDATES.length} dates have been proposed for when the ${LIMITATIONS_YEARS}-year
period in NRS 11.190(3)(d) began to run. On the least favorable of them the claim was still filed
with ${NARROWEST_MARGIN} days to spare, so the court does not have to choose between them:

${ACCRUAL_CANDIDATES.map(
  (entry) =>
    `* __If the clock starts ${entry.label}__ — ${entry.event} Three years run to ${entry.expiryLabel}, ${entry.marginDays} days after this count was filed.`,
).join('\n\n')}

## IV. What this motion does not ask for

${RESERVED.map((issue) => `${issue.defense} is not before the court on this motion. ${issue.why}`).join(
  '\n\n',
)}

## V. Conclusion

For the foregoing reasons, Plaintiff respectfully requests that the court grant summary judgment
striking the defense named above.

{{person__movant}}, by counsel`
