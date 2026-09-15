// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

// Plaintiff's motion for partial summary judgment on the limitations defense.
//
// Fixture, with one exception. *Cruller v. Prine* is simulated: the parties,
// the docket number, the department, both firms, both bar numbers, and every
// date below are invented. The authorities are not. NRCP 56 and NRS 11.190(3)(d)
// are quoted from their own text, and the three sentences quoted from *Wood v.
// Safeway* were verified against the opinion before they were written down —
// the same line `src/research.ts` draws, and for the same reason: a demo that
// blurs real law into fixture data teaches a reader to trust a citation because
// it looked like one.
//
// Why *this* motion
// -----------------
// A sample motion for summary judgment is easy to write badly. The interesting
// fact in this matter is what Dermot knew on 14 April 2026, and that fact is
// genuinely disputed — so a motion built on it would be a motion that has to
// lose, and a reader who copied its shape would learn the wrong lesson about
// what Rule 56 is for.
//
// So this motion moves on the one issue in the matter that no factual dispute
// can reach. NRS 11.190(3)(d) gives three years. Count II was filed sixteen
// months after the earliest date any theory could start the clock. The defense
// therefore fails whichever accrual date the Court adopts, which means the
// Court never has to pick one — and NRCP 56(a) allows a motion aimed at exactly
// that much and no more, because it lets a party identify "the part of each
// claim or defense" it is moving on.
//
// Part IV.C then declines to move on ratification, on the record, and says why.
// That paragraph is the point of the document: the same discipline the trial
// prep deck applies to a witness answer applies to a brief, and a motion that
// reached for the disputed fact as well would trade a certain partial win for
// a likely total loss.

#import "pleading-paper.typ": *

#let RULE = 0.7pt

#show: pleading.with(
  note: [Fixture document — #emph[Cruller v. Prine] is a simulated matter. Not a filing.],
)

#flush[
  LAWRENCE LAWYER, ESQ. \
  Nevada Bar No. 00000 \
  NEON LAW \
  2400 Confection Way, Suite 400 \
  Las Vegas, Nevada 89101 \
  Telephone: (702) 555-0134 \
  lawrence\@neonlaw.example \
  #emph[Attorneys for Plaintiff Dermot A. Cruller]
]

#block(above: SKIP, below: NEXT, width: 100%, align(center)[
  #strong[DISTRICT COURT] \
  #strong[CLARK COUNTY, NEVADA]
])

#caption-box(
  lines: 9,
  [
    DERMOT A. CRULLER, an individual, \
    #h(1in) Plaintiff, \
    #h(0.5in) vs. \
    WENDELL PRINE, an individual; and \
    DOES I through X, inclusive, \
    #h(1in) Defendants.
  ],
  [
    Case No.: A-26-874219-C \
    Dept. No.: XVII \
    #v(LINE)
    #strong[Hearing Requested]
  ],
)

#heading-centered[
  PLAINTIFF'S MOTION FOR PARTIAL SUMMARY JUDGMENT ON DEFENDANT'S THIRD
  AFFIRMATIVE DEFENSE (STATUTE OF LIMITATIONS)
]

#prose[
  Plaintiff DERMOT A. CRULLER, by and through his counsel of record, Lawrence
  Lawyer, Esq. of NEON LAW, moves this Court under Rule 56(a) of the Nevada Rules
  of Civil Procedure for partial summary judgment against Defendant WENDELL PRINE
  on the Third Affirmative Defense pleaded in Defendant's Answer to the First
  Amended Complaint, filed 10 August 2026, which asserts that Count II is barred
  by the statute of limitations.

  This Motion is made and based upon the pleadings and papers on file herein, the
  following Memorandum of Points and Authorities, and any argument this Court may
  entertain at the hearing of this Motion.
]

#section[I. Introduction]

#prose[
  This is a narrow motion, and it is narrow on purpose. Count II seeks rescission
  of an instrument on the ground of fraud. Nevada gives a plaintiff three years to
  bring such a claim, measured from his discovery of the facts constituting the
  fraud. Count II was filed on 3 August 2026. The latest event Defendant has ever
  identified as a possible starting point for that period is 1 April 2025, and the
  three years running from even that date will not expire until 1 April 2028.

  The limitations defense therefore fails on every accrual date the record can
  support, which means this Court does not have to decide which one is correct in
  order to dispose of the defense. That is the whole of the relief sought.

  Plaintiff does not move on Defendant's waiver and ratification defense, and Part
  IV.C explains why: that defense turns on when Plaintiff learned of the soul term,
  which is a fact this record genuinely disputes and which a jury will have to
  resolve. Rule 56 is not the place for it, and Plaintiff does not pretend
  otherwise.
]

#section[II. Statement of Undisputed Material Facts]

#prose[
  1. On 1 April 2025, Defendant offered Plaintiff a doughnut over the hedge
  dividing their properties. Defendant has sworn that he described the doughnut as
  "neat," that he offered it "the way I would offer anybody a doughnut," and that
  after "a year and some months" he cannot swear to every other word of the
  exchange. (Def.'s Resp. to Pl.'s First Set of Interrogs., No. 1, served 27 July
  2026.)

  2. Plaintiff consumed part of the doughnut on 1 April 2025 and the remainder on
  14 April 2026. (First Am. Compl. ¶¶ 6, 11.)

  3. Plaintiff first learned of the term purporting to convey his soul on 14 April
  2026. (First Am. Compl. ¶ 13; Aff. of Odile Cruller, sworn 11 June 2026, ¶¶ 4–7.)

  4. Defendant has sworn that the date on which he first contended that Plaintiff's
  soul had been conveyed to him was 14 April 2026. (Def.'s Resp. to Pl.'s First Set
  of Interrogs., No. 4.)

  5. Plaintiff served written notice of rescission on Defendant on 2 May 2026,
  seventeen days after 14 April 2026. (Notice of Rescission, served 2 May 2026.)

  6. Count II was added to this action by amendment on 3 August 2026. (First Am.
  Compl., filed 3 Aug. 2026.)

  7. Defendant's Answer to the First Amended Complaint, filed 10 August 2026,
  pleads as its Third Affirmative Defense that Count II "is barred by the
  applicable statute of limitations."

  None of facts 1 through 7 is disputed for the purposes of this Motion. Facts 3
  and 4 are the only ones Defendant has any interest in disputing, and as Part IV.A
  shows, the outcome of this Motion does not depend on either of them.
]

#section[III. Legal Standard]

#prose[
  NRCP 56(a) permits a party to move for summary judgment "identifying each claim
  or defense—or the part of each claim or defense—on which summary judgment is
  sought," and provides that "[t]he court shall grant summary judgment if the
  movant shows that there is no genuine dispute as to any material fact and the
  movant is entitled to judgment as a matter of law." A motion may be filed "at any
  time until 30 days after the close of all discovery." NRCP 56(b). A party
  asserting that a fact cannot be genuinely disputed must support the assertion by
  "citing to particular parts of materials in the record, including depositions,
  documents, electronically stored information, affidavits or declarations,
  stipulations \u{2026} admissions, interrogatory answers, or other materials." NRCP
  56(c)(1)(A).

  Our Supreme Court set the governing standard in #emph[Wood v. Safeway, Inc.], 121
  Nev. 724, 121 P.3d 1026 (2005). "Summary judgment is appropriate under NRCP 56
  when the pleadings, depositions, answers to interrogatories, admissions, and
  affidavits, if any, that are properly before the court demonstrate that no genuine
  issue of material fact exists, and the moving party is entitled to judgment as a
  matter of law." #emph[Id.] Two further sentences from #emph[Wood] govern this
  Motion directly. First: "The substantive law controls which factual disputes are
  material and will preclude summary judgment; other factual disputes are
  irrelevant." #emph[Id.] Second: "A factual dispute is genuine when the evidence is
  such that a rational trier of fact could return a verdict for the nonmoving
  party." #emph[Id.]

  The first of those sentences is why this Motion can be granted while the parties
  remain in genuine disagreement about what Plaintiff knew and when. A dispute is
  only fatal to a motion if the substantive law makes it material to the issue
  actually moved on. The substantive law here is a three-year period, and no
  version of the disputed fact moves the filing date outside it.
]

#section[IV. Argument]

#block(above: SKIP, below: NEXT, strong[
  A. The three-year period had not run on any accrual date this record supports.
])

#prose[
  An action for relief on the ground of fraud must be commenced within three years,
  and the cause of action "shall be deemed to accrue upon the discovery by the
  aggrieved party of the facts constituting the fraud or mistake." NRS
  11.190(3)(d).

  Count II was filed on 3 August 2026. There are only two dates in this record that
  any party has ever proposed as the start of the limitations period, and the claim
  is timely under both:

  #h(0.5in) #emph[Discovery — 14 April 2026.] This is the accrual date the statute
  actually prescribes and the one the record supports. Three years from 14 April
  2026 expires on 14 April 2029. Count II was filed two years and eight months
  early.

  #h(0.5in) #emph[The date of the offer — 1 April 2025.] This is the earliest date
  any theory could reach, and it is not the statutory trigger, because on 1 April
  2025 Plaintiff had discovered nothing. Even so: three years from 1 April 2025
  expires on 1 April 2028. Count II was filed one year and eight months early.

  Because the claim is timely on both dates, this Court can dispose of the Third
  Affirmative Defense without deciding between them. Defendant is of course free to
  argue for the earlier date; the argument buys him nothing, because the interval he
  needs is three years and the longest interval available to him on this record is
  one year and four months.

  Defendant has identified no third date. If he means to propose one, NRCP 56(c)(1)
  requires him to support it by citation to particular parts of the record, and any
  date he cites will have to be one that precedes 3 August 2023 to do him any good —
  which is to say, a date eight months before the doughnut existed.
]

#block(above: SKIP, below: NEXT, strong[
  B. Defendant's own sworn interrogatory answer fixes the latest accrual date well
  inside the period.
])

#prose[
  Plaintiff does not need Defendant's admission to win this Motion, but Defendant
  has made one, and it disposes of any residual argument about timing. Asked to
  state the date on which he first contended that Plaintiff's soul had been conveyed
  to him, Defendant answered under oath: "14 April 2026, in my own kitchen, to my
  wife Verity." (Def.'s Resp. to Pl.'s First Set of Interrogs., No. 4.)

  An interrogatory answer is competent material on a Rule 56 motion. NRCP
  56(c)(1)(A). Defendant has therefore sworn that the conveyance he now relies upon
  was not a subject of his own contention until 14 April 2026 — the same day
  Plaintiff says he learned of it. On Defendant's account and on Plaintiff's alike,
  nothing that could start a limitations clock happened before that date, and 3
  August 2026 is less than four months after it.
]

#block(above: SKIP, below: NEXT, strong[
  C. Plaintiff does not move on ratification, because that defense turns on a
  genuinely disputed fact.
])

#prose[
  Defendant's Fourth Affirmative Defense alleges that Plaintiff affirmed the
  instrument by consuming the remainder of the doughnut. Plaintiff does not seek
  summary judgment on that defense and does not ask this Court to reach it.

  The reason is the standard itself. Waiver of the right to rescind requires
  knowledge: "knowledge of the material facts constituting the fraud must appear if
  the payments are to be held to constitute waiver or election." #emph[Friendly
  Irishman, Inc. v. Ronnow], 74 Nev. 316, 330 P.2d 497 (1958). Whether Plaintiff had
  that knowledge before 14 April 2026 is contested, it is supported on both sides by
  more than speculation, and under #emph[Wood] it is precisely the kind of dispute a
  rational trier of fact must resolve. #emph[Wood], 121 Nev. 724, 121 P.3d 1026.

  Plaintiff identifies the boundary expressly so that the record shows it was drawn
  deliberately. NRCP 56(a) contemplates a motion aimed at part of a defense, and
  granting this one resolves the limitations question for good while leaving the
  ratification question exactly where it belongs, which is with the jury.
]

#section[V. Conclusion]

#prose[
  For the foregoing reasons, Plaintiff respectfully requests that this Court grant
  partial summary judgment in his favor on Defendant's Third Affirmative Defense,
  and enter an order that Count II of the First Amended Complaint is not barred by
  NRS 11.190(3)(d).
]

#block(above: SKIP, below: NEXT, flush[
  DATED this 18th day of August, 2026.
])

#block(above: NEXT, below: NEXT, width: 100%, align(right, box(width: 3.2in, flush[
  NEON LAW
  #v(LINE * 2)
  #box(width: 2.6in, line(length: 100%, stroke: RULE)) \
  LAWRENCE LAWYER, ESQ. \
  Nevada Bar No. 00000 \
  2400 Confection Way, Suite 400 \
  Las Vegas, Nevada 89101 \
  #emph[Attorneys for Plaintiff]
])))

#pagebreak()

#heading-centered[CERTIFICATE OF SERVICE]

#prose[
  I hereby certify that on the 18th day of August, 2026, I served a true and correct
  copy of the foregoing PLAINTIFF'S MOTION FOR PARTIAL SUMMARY JUDGMENT ON
  DEFENDANT'S THIRD AFFIRMATIVE DEFENSE (STATUTE OF LIMITATIONS) by electronic
  service through the Court's electronic filing system upon the following:
]

#block(above: SKIP, below: SKIP, flush[
  #h(0.5in) HOLLIS STIPE, ESQ. \
  #h(0.5in) Nevada Bar No. 00000 \
  #h(0.5in) MARROW & STIPE LLP \
  #h(0.5in) 88 Ledger Street, Suite 1200 \
  #h(0.5in) Las Vegas, Nevada 89101 \
  #h(0.5in) #emph[Attorneys for Defendant Wendell Prine]
])

#block(above: NEXT, below: NEXT, width: 100%, align(right, box(width: 3.2in, flush[
  #box(width: 2.6in, line(length: 100%, stroke: RULE)) \
  An employee of NEON LAW
])))
