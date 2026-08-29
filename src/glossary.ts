// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Navigator's vocabulary, scoped to the words this sample project actually uses.
 *
 * Navigator keeps one canonical glossary, in `docs/glossary.md`, plus a
 * teaching-ordered doc for the notation system in `docs/notation.md`. This file
 * is **not** a second glossary competing with those. It is a scope: the dozen or
 * so terms a reader of this bundle meets, each one saying what Navigator means
 * by it and then what it is *here* — which file, which path, which fixture row.
 *
 * Two rules keep it from drifting into a fork of the canonical text:
 *
 * 1. **`definition` paraphrases; it never restates a definition this repository
 *    has no authority over.** If the two ever disagree, the canonical doc is
 *    right and this file is a bug.
 * 2. **Every term carries its `anchor`**, so the canonical entry is one click
 *    away and a reader can check us. A term worth defining is worth linking.
 *
 * Why a glossary lives in the sample project at all: the same word means a
 * pleading to a lawyer and a table to this codebase. "Matter" and "Project" are
 * one row. "Person" is a login, not a party. "Letter" is a piece of mail in the
 * schema and a render profile in a template's frontmatter. A contributor who has
 * not been told that reads every file in this repository slightly wrong, and a
 * client reading the portal reads it very wrong.
 */

/** Which canonical document defines the term. */
export type GlossarySource = 'glossary' | 'notation' | 'frontmatter'

export interface GlossaryTerm {
  id: string
  term: string
  /** The client-English synonym, where the schema and the lawyer differ. */
  also?: string
  source: GlossarySource
  /** The heading anchor in that document. */
  anchor: string
  /** What Navigator means by it. */
  definition: string
  /** What it is in this repository — a file, a path, a fixture row. */
  here: string
  /** Other ids worth reading next. */
  see?: string[]
}

const DOCS = 'https://github.com/neon-law-source-code/navigator/blob/main/docs'

const FILE: Record<GlossarySource, string> = {
  glossary: 'glossary.md',
  notation: 'notation.md',
  frontmatter: 'frontmatter.md',
}

/** The canonical entry for a term, deep-linked to its heading. */
export function canonicalUrl(term: GlossaryTerm): string {
  return `${DOCS}/${FILE[term.source]}#${term.anchor}`
}

/**
 * The terms, in the order a reader meets them.
 *
 * Not alphabetical, deliberately. The canonical glossary is one alphabetical
 * list because it is a reference and a reader arrives at it knowing the word
 * they want. Nobody arrives here knowing the word: they arrive having opened a
 * portal, so the order runs outward from the thing they are looking at — this
 * matter, the people on it, the documents in it, and the rules those documents
 * are held to.
 */
export const GLOSSARY: GlossaryTerm[] = [
  {
    id: 'project',
    term: 'Project',
    also: 'Matter',
    source: 'glossary',
    anchor: 'project',
    definition:
      'The durable container every document on a matter lives in. It has a status, is always opened against an Entity, and its `code` — lowercase letters, digits, and single hyphens — is the matter\'s URL rather than an internal id.',
    here: 'The Project code is `sample-litigation`, which is why this bundle is served at `/app/projects/sample-litigation/portal/` and why `vite.config.ts` bakes exactly that path in as its base. `navigator.yaml` names the same code, keyed `project:`.',
    see: ['matter', 'entity', 'participation'],
  },
  {
    id: 'matter',
    term: 'Matter',
    also: 'Project',
    source: 'glossary',
    anchor: 'matter',
    definition:
      'The same row as a Project, under the noun a lawyer or a client says out loud. "Open a matter" and "open a Project" are one insert.',
    here: 'The portal says "matter" to the reader and `MATTER` in the code, and they mean the same record. `src/matter.ts` is the fixture data for the trespass count; `src/soulContract.ts` is the count added by amendment.',
    see: ['project'],
  },
  {
    id: 'entity',
    term: 'Entity',
    source: 'glossary',
    anchor: 'entity',
    definition:
      'A legal organization — an LLC, trust, corporation — with a type and a jurisdiction. Every Project is opened against one, and a solo natural person gets a `Human` entity rather than an exception to the rule.',
    here: 'The fixture opens `sample-litigation` against a `Human` entity named "Dermot Cruller" in Nevada. A one-plaintiff trespass claim still has an organization row behind it, which is the rule made visible.',
    see: ['project', 'person'],
  },
  {
    id: 'person',
    term: 'Person',
    source: 'glossary',
    anchor: 'person',
    definition:
      'A human contact, and a row that can sign in. The system-wide tier — owner, admin, lawyer, clerk, or client — lives on that row and not on the OIDC token: the token carries a subject and an email, and the tier is read from the database.',
    here: 'Five of them, written by Navigator\'s dev seed and listed on the People tab. None of them is Dermot Cruller: the parties in the pleaded facts are not Navigator Persons, and saying so is most of what `src/people.ts` is for.',
    see: ['participation', 'person-project-role', 'dri'],
  },
  {
    id: 'person-project-role',
    term: 'Person–Project Role',
    source: 'glossary',
    anchor: 'personproject-role',
    definition:
      'One person\'s participation on one Project. The row answers two separate questions: its **presence** decides whether a client or lawyer sees the matter at all, and its **value** decides which side of the matter they are on.',
    here: 'The seed writes four of them for `sample-litigation` and deliberately writes none for the Admin — so an administrator who was never assigned to this matter cannot reach it, by list or by URL.',
    see: ['participation', 'person'],
  },
  {
    id: 'participation',
    term: 'Participation',
    source: 'glossary',
    anchor: 'participation',
    definition:
      'The `participation` column on a Person–Project Role row, and nothing else — a property of that row rather than a concept of its own. It is derived from the person\'s tier, never typed in by a caller.',
    here: 'This portal reads no participation value at all, because the gate has already run: Navigator streams the bundle from its own origin behind the session and the participation list, so the first byte only arrives for someone who was already admitted.',
    see: ['person-project-role', 'project'],
  },
  {
    id: 'dri',
    term: 'Directly Responsible Individual',
    also: 'DRI',
    source: 'glossary',
    anchor: 'directly-responsible-individual-dri',
    definition:
      'The one person on each side who answers for a matter — one lawyer at the firm, one person at the client. Others work on it; these two answer for it.',
    here: 'The seed designates Lawrence Lawyer as Firm DRI and Cleo Client as Client DRI. Section 4 of the engagement letter names the same lawyer — and names Dermot A. Cruller on the client side, because the document speaks about the party while the designation records the account. Two DRIs on one side is the People tab\'s whole point, not a discrepancy.',
    see: ['person', 'engagement'],
  },
  {
    id: 'engagement',
    term: 'Engagement',
    also: 'Retainer',
    source: 'glossary',
    anchor: 'engagement--retainer',
    definition:
      'Client English for a Notation bound to a Project — what the firm sells. It is a matter\'s **first** Notation: the Project is opened first, and the engagement is created on it afterwards like any other. Opening a Project never opens one with it.',
    here: 'The engagement letter on the documents tab, rendered from a template whose `kind:` is `retainer`. It is dated 20 April 2026 — five days after Dermot learned of the soul term, and twelve before a notice goes out "through counsel".',
    see: ['notation', 'template', 'project'],
  },
  {
    id: 'template',
    term: 'Template',
    source: 'notation',
    anchor: 'template',
    definition:
      'A static blueprint for one legal document, in four parts: metadata, a questionnaire, a workflow, and the prose body carrying `{{placeholder}}` slots. It asks nothing on its own — until a respondent is bound to it, it is inert, useful for linting and preview and nothing else.',
    here: 'Three of them, in `templates/neon_law/`. Each is the source of exactly one PDF under `public/documents/`, and `pnpm validate:templates` holds all three to the same rule set the renderer does.',
    see: ['notation', 'questionnaire', 'output'],
  },
  {
    id: 'notation',
    term: 'Notation',
    source: 'notation',
    anchor: 'notation',
    definition:
      'A Template come to life: one running instance of it, bound to a respondent, a Project, and sometimes an Entity, carrying a workflow state such as `draft`, `lawyer_review`, or `signed`. Where a Template is static, a Notation has a lifetime.',
    here: 'There is no Notation in this repository, and there cannot be — a Notation is a row in Navigator\'s store. `scripts/render-documents.sh` stands in for one by passing the answers as `--answer` flags, which is the same substitution a real Notation performs from questionnaire responses.',
    see: ['template', 'questionnaire', 'lawyer-review'],
  },
  {
    id: 'questionnaire',
    term: 'Questionnaire',
    source: 'notation',
    anchor: 'questionnaire',
    definition:
      'The ordered ladder of questions a Template asks, written as states from `BEGIN` to `END`. Each state is named `<type>__<role>`, and the type half comes from a closed registry rather than being invented at the call site.',
    here: 'Read the `questionnaire:` block in any template here. The engagement letter walks `person__client → person__adverse_party → person__lawyer_dri → …`, and the roles in those names are the same roles the People tab lists.',
    see: ['question-type', 'template'],
  },
  {
    id: 'question-type',
    term: 'Question Type',
    source: 'glossary',
    anchor: 'question-type',
    definition:
      'The `<type>` half of a questionnaire state name — a closed set. A type either records something (`person`, `entity`, `address`), references seeded data (`jurisdiction`), or is a custom primitive (`custom_text`, `custom_datetime`, `custom_single_choice`).',
    here: 'The closed set is enforceable, and it bites: `custom_text__adverse_party` is refused, because a party is a person and there is a typed state for that. This repository\'s engagement letter uses `person__adverse_party` for exactly that reason.',
    see: ['questionnaire', 'rule'],
  },
  {
    id: 'lawyer-review',
    term: 'Lawyer Review',
    source: 'glossary',
    anchor: 'lawyer-review',
    definition:
      'The mandatory human attorney gate in a workflow, before anything is signed, filed, mailed, or otherwise sent. Not a formality: it is the supervision a lawyer owes any non-lawyer assistant.',
    here: 'Every template in this repository carries a `lawyer_review` state, and a template that omits it is refused outright — which is how the omission was caught in this repository rather than in production.',
    see: ['template', 'notation'],
  },
  {
    id: 'output',
    term: 'Render profile',
    also: 'output:',
    source: 'frontmatter',
    anchor: 'how-the-finished-document-looks-output',
    definition:
      'The one place a Template says what the finished document should look like. Omit it for a plain page; `letter` puts the body on firm letterhead; `agreement` typesets an executed contract curtly; `form` fills an official government form instead of typesetting prose.',
    here: 'The engagement letter declares `output: letter` and arrives on Neon Law letterhead. The notice and the affidavit declare nothing and render plain. `MatterDocument.format` in `src/documents.ts` carries that fact to the card.',
    see: ['template', 'engagement'],
  },
  {
    id: 'rule',
    term: 'Rule',
    source: 'notation',
    anchor: 'rule',
    definition:
      'One machine-checkable constraint on a Markdown notation, with a stable identifier. Three families: `M` for Markdown hygiene, `N` for notation-template shape, and `S101` for the 120-character line limit. The validator and the renderer read the same set, so a template that renders is a template that passed.',
    here: '`pnpm validate:templates` runs them over `templates/`. It is not in CI, because it needs the Navigator CLI and this repository will not make a React build wait on a Rust toolchain — so run it locally whenever a template changes.',
    see: ['template', 'question-type'],
  },
  {
    id: 'fixture',
    term: 'Cruller Development Fixture',
    source: 'glossary',
    anchor: 'cruller-development-fixture',
    definition:
      'The one synthetic matter a local Navigator applies on top of its canonical seed. It is idempotent, `dev`-only, and disposable, and it keeps the local accounts and *Cruller v. Prine* ready for the firm, clerk, and client surfaces.',
    here: 'It is the reason this repository exists. The companion application named by that fixture is this one, refreshed on local boot and served at the portal path — so every code, claim, and jurisdiction in `src/matter.ts` matches the seed on purpose.',
    see: ['project', 'person'],
  },
]

/** Where the canonical vocabulary lives, said once. */
export const GLOSSARY_NOTE =
  'Navigator keeps one glossary, in its own repository. The entries below are this bundle\'s scope of it — what each word means, and then what it is here — and each links to the canonical definition, which governs if the two ever disagree.'
