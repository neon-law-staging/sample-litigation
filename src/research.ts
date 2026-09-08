// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * The authorities behind Count II.
 *
 * Unlike everything else in this bundle, the citations below are **real**. They
 * were pulled from Midpage's corpus and each one was run through the opinion
 * analyzer before it was written down, so every `quote` here is verbatim from
 * the opinion or statute named beside it and every `proposition` is the holding
 * the analyzer confirmed that text supports.
 *
 * That distinction matters enough to keep in the type: `Authority.verified`
 * exists so the page can say, on the face of each card, that the law is real
 * even though the matter is invented. A demo that blurs the two teaches a
 * reader to trust a citation because it looked like a citation.
 */

export type Leaning = 'dermot' | 'prine' | 'neutral'

export interface Authority {
  id: string
  /** Bluebook citation, exactly as the analyzer returned it. */
  cite: string
  court: string
  year: string
  /** Which issue in `ISSUES` this authority answers. */
  issue: 'formation' | 'ratification' | 'limitations'
  /** Whose argument it helps. */
  leaning: Leaning
  /** The holding, as confirmed against the text. */
  proposition: string
  /** Verbatim from the opinion. */
  quote: string
  /** Where the authority stops — the limits the analyzer flagged. */
  scope: string
  /** What it means for Dermot, in one line. */
  application: string
  url: string
  /** Citator status at the time of retrieval. */
  treatment: 'Neutral' | 'Caution' | 'Negative' | 'Positive'
  verified: true
}

export const AUTHORITIES: Authority[] = [
  {
    id: 'sharp',
    cite: 'Sharp Elecs. Corp. v. Deutsche Fin. Servs. Corp., 216 F.3d 388 (4th Cir. 2000)',
    court: '4th Cir.',
    year: '2000',
    issue: 'formation',
    leaning: 'neutral',
    proposition:
      'Unless the offeror manifests a contrary intention, an offeree who has rendered part of the performance requested by the offer may accept by completing the requested performance.',
    quote:
      'When an offeree, who has performed partly, continues performance requested by the offer after learning of the offer, it accepts the offer by completing the requested performance, even if it did not know of the offer when it first began to perform.',
    scope:
      'Unilateral contracts where performance is the invited method of acceptance. Addressed to an offeree who begins performance without knowledge and completes it after gaining actual knowledge; the court expressly did not reach the effect of part performance under Restatement § 45.',
    application:
      'The closest authority to the two bites, and it cuts both ways. Acceptance lands on completion — the second bite, not the first. But the rule it states is about an offeree who completes *after learning*, and Dermot completed before he learned anything. Cite it for the timing; distinguish it on knowledge.',
    url: 'https://app.midpage.ai/document/sharp-electronics-corporation-v-deutsche-769164',
    treatment: 'Neutral',
    verified: true,
  },
  {
    id: 'knight',
    cite: 'Knight v. Seattle-First Nat’l Bank, 589 P.2d 1279 (Wash. Ct. App. 1979)',
    court: 'Wash. Ct. App.',
    year: '1979',
    issue: 'formation',
    leaning: 'dermot',
    proposition:
      'Under Restatement of Contracts § 45, part performance of a unilateral offer binds the offeror to keep the offer open, with the duty of immediate performance conditional on the full consideration being given within a reasonable time — it does not itself close the contract.',
    quote:
      'If an offer for a unilateral contract is made, and part of the consideration requested in the offer is given or tendered by the offeree in response thereto, the offeror is bound by a contract, the duty of immediate performance of which is conditional on the full consideration being given or tendered within the time stated in the offer, or, if no time is stated therein, within a reasonable time.',
    scope:
      'Distinguishes part performance from mere preparations; the court found the plaintiffs’ conduct was preparation and so § 45 never engaged. It does not fix what "a reasonable time" is.',
    application:
      'The formation argument in one sentence. A first bite is the beginning of a performance, not its completion — so nothing closed on 1 April 2025. Note the sting in the tail: § 45 conditions the deal on full consideration within a *reasonable time*, and Prine will argue a year in a refrigerator is not one.',
    url: 'https://app.midpage.ai/document/knight-v-seattle-first-national-1418102',
    treatment: 'Neutral',
    verified: true,
  },
  {
    id: 'friendly-irishman',
    cite: 'Friendly Irishman, Inc. v. Ronnow, 330 P.2d 497 (Nev. 1958)',
    court: 'Nev.',
    year: '1958',
    issue: 'ratification',
    leaning: 'dermot',
    proposition:
      'Knowledge of the material facts constituting the fraud is an essential requirement of waiver or election; conduct under the contract in ignorance of the fraud does not affirm it.',
    quote:
      'Since rescission is sought upon the ground of fraud, knowledge of the material facts constituting the fraud must appear if the payments are to be held to constitute waiver or election.',
    scope:
      'The waived conduct there was making contract payments. The court did not reach whether other benefit-taking waives, how promptly rescission must follow discovery, or whether constructive knowledge suffices.',
    application:
      'The case the count is built on, and it is binding Nevada authority. The buyer kept paying for the car and still rescinded, because she did not yet know the car was used. Dermot kept eating and still rescinds, because he did not yet know about the soul.',
    url: 'https://app.midpage.ai/document/friendly-irishman-inc-v-ronnow-1127259',
    treatment: 'Neutral',
    verified: true,
  },
  {
    id: 'kingston',
    cite: 'Continental Ins. Co. v. Kingston, 114 P.3d 1158 (Utah Ct. App. 2005)',
    court: 'Utah Ct. App.',
    year: '2005',
    issue: 'ratification',
    leaning: 'prine',
    proposition:
      'A party who continues to receive benefits under the contract after becoming aware of the fraud, or who otherwise treats it as a subsisting engagement, affirms the contract and waives the right to rescind.',
    quote:
      'if the party[ ]defrauded continues to receive benefits under the contract after he had become aware of the fraud, or if he otherwise conducts himself with respect to it as though it were a subsisting and binding engagement, he will be deemed to have affirmed the contract and waived his right to rescind',
    scope:
      'The party must have knowledge of the fraud, or the grounds for rescission, for the waiver to bite. Decided in the insurance context; the eight-month delay there was not held to set any general outer limit.',
    application:
      'The best statement of the defense — and it carries its own answer. Every formulation of the rule is conditioned on awareness. Prine has to put knowledge in Dermot’s hands before 14 April 2026, and on the pleaded facts he cannot.',
    url: 'https://app.midpage.ai/document/continental-insurance-co-v-kingston-2590758',
    treatment: 'Neutral',
    verified: true,
  },
  {
    id: 'nrs-11-190',
    cite: 'Nev. Rev. Stat. § 11.190(3)(d)',
    court: 'Nevada Revised Statutes',
    year: 'in force',
    issue: 'limitations',
    leaning: 'dermot',
    proposition:
      'An action for relief on the ground of fraud must be commenced within three years, and the cause of action accrues upon the aggrieved party’s discovery of the facts constituting the fraud.',
    quote:
      'an action for relief on the ground of fraud or mistake, but the cause of action in such a case shall be deemed to accrue upon the discovery by the aggrieved party of the facts constituting the fraud or mistake.',
    scope:
      'Subject to the exceptions in NRS 112.230 and 166.170. The section does not define "discovery" or state the diligence required to trigger accrual for fraud, unlike the reasonable-diligence language it uses elsewhere.',
    application:
      'Disposes of the limitations defense outright. Measured from the first bite the claim is a year and four months old; measured from discovery, four months. Either way it is inside three years — the gap is a ratification problem wearing a limitations costume.',
    url: 'https://app.midpage.ai/laws/nv-nrs/t2/ch11/s11_190-a4d843',
    treatment: 'Neutral',
    verified: true,
  },
]

export const RESEARCH_NOTE =
  'Retrieved from Midpage and confirmed against the opinion text before being written down. The citations, quotes, and holdings are real law; the matter they are applied to is not.'
