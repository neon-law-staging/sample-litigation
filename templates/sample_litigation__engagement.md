---
kind: letter
title: Engagement letter
respondent_type: entity
code: sample_litigation__engagement
jurisdiction: NV
confidential: true
questionnaire:
  BEGIN:
    _: END
  END: {}
workflow:
  BEGIN:
    intake_submitted: lawyer_review
  lawyer_review:
    approved: END
    rejected: END
  END: {}
---

Replace this placeholder with the notation this Project actually uses.
