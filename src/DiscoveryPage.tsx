// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ExternalLink, Gavel, Quote, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  DISCOVERY_FACTS,
  INTERROGATORIES,
  PROCEEDING,
  RESPONSE_COUNTS,
  RULES,
  SIGNER,
  SIGNERS,
  SUFFICIENCY_COUNTS,
  type Interrogatory,
  type Sufficiency,
  type Topic,
} from './discovery'
import { MATTER } from './matter'
import { READY_KICKER } from './ready'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/**
 * The discovery page: one written exchange, read the way a client reads it.
 *
 * A response to interrogatories arrives as a single PDF in which two people are
 * talking — the party under oath and the attorney preserving grounds — and the
 * reason this page exists is that the PDF does not make that obvious. So each
 * interrogatory below is rendered as three attributed blocks: what we asked,
 * what counsel objected, what the defendant swore, and then the part no
 * response contains, which is what it leaves us with.
 *
 * The data is in `discovery.ts`, including the rules the deficiencies are
 * measured against. Nothing here decides what is sufficient; it renders what
 * that module says, in the order the module says it.
 */

/** Topic to the phrase a reader will recognize from the rest of the portal. */
const TOPIC_LABEL: Record<Topic, string> = {
  formation: 'Formation',
  aspect: 'The aspect',
  concealment: 'Concealment',
  knowledge: 'Knowledge',
  ratification: 'The year after',
  records: 'Documents',
  damages: 'Relief',
}

/**
 * Sufficiency to badge tone, as a total map rather than a ternary chain.
 *
 * The same reason `DOCUMENT_TONE` is one in `IntroductionPage`: add a fourth
 * verdict to the union and the compiler names this line instead of quietly
 * falling through to whichever branch happened to be last.
 */
const SUFFICIENCY_TONE: Record<Sufficiency, 'success' | 'warning' | 'destructive'> = {
  sufficient: 'success',
  partial: 'warning',
  deficient: 'destructive',
}

const SUFFICIENCY_LABEL: Record<Sufficiency, string> = {
  sufficient: 'Sufficient',
  partial: 'Partial',
  deficient: 'Deficient',
}

/** The filters over the set. `all` first, then the three worth isolating. */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'objected', label: 'Objected to' },
  { id: 'unanswered', label: 'Not answered' },
  { id: 'chase', label: 'Needs a follow-up' },
] as const

type Filter = (typeof FILTERS)[number]['id']

function matches(rog: Interrogatory, filter: Filter): boolean {
  switch (filter) {
    case 'objected':
      return rog.objections.length > 0
    case 'unanswered':
      return rog.answer === null
    case 'chase':
      return Boolean(rog.assessment.followUp)
    case 'all':
      return true
  }
}

export function DiscoveryPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = useMemo(
    () => INTERROGATORIES.filter((rog) => matches(rog, filter)),
    [filter],
  )

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Interrogatories to {SIGNER.party.name}
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Discovery · {MATTER.caption} · {MATTER.jurisdiction}
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {PROCEEDING.set} went out on {PROCEEDING.served.label} and came back on{' '}
          {PROCEEDING.responded.label}. What came back is one document containing two voices: the
          defendant answering under oath, and his counsel objecting. Below, they are pulled apart
          and attributed, because most of what a client misreads in a discovery response comes from
          not knowing which of the two is speaking.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {DISCOVERY_FACTS.map((fact) => (
            <div key={String(fact.label)} className="bg-card px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>One document, two signatures</CardTitle>
            <CardDescription>
              Who certified what, and which part of it is sworn.
            </CardDescription>
          </div>
          <Badge variant="outline">NRCP 33(b)(5)</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {SIGNERS.map((signer) => (
            <div key={signer.id} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
              <p className="font-serif text-base font-semibold">{signer.name}</p>
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                {signer.side} · {signer.affiliation}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{signer.signs}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">The exchange</h2>
              <p className="text-sm text-muted-foreground">
                {shown.length} of {INTERROGATORIES.length} shown · {SUFFICIENCY_COUNTS.deficient}{' '}
                deficient · {RESPONSE_COUNTS['objection-only']} answered by objection alone
              </p>
            </div>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(next) => next && setFilter(next as Filter)}
              aria-label="Filter the set"
            >
              {FILTERS.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {shown.map((rog) => (
            <Exchange key={rog.id} rog={rog} />
          ))}

          {shown.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nothing in the set matches that filter — which, for a deficiency filter, is the
                answer you want.
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>The rules this turns on</CardTitle>
                <CardDescription>
                  Quoted rather than paraphrased. Unlike the exchange, these are real.
                </CardDescription>
              </div>
              <Badge variant="success">Verified</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              {RULES.map((rule) => (
                <div key={rule.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Gavel aria-hidden="true" className="size-4 text-primary" />
                    <a
                      href={rule.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {rule.cite}
                      <ExternalLink aria-hidden="true" className="ml-1 inline size-3" />
                    </a>
                  </div>
                  <blockquote className="border-l-2 border-primary/40 pl-3 font-serif text-sm leading-relaxed">
                    {rule.quote}
                  </blockquote>
                  <p className="text-sm leading-relaxed text-muted-foreground">{rule.bearing}</p>
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Alert variant="warning">
            <ShieldAlert />
            <AlertTitle>The exchange is invented</AlertTitle>
            <AlertDescription>
              Every interrogatory, answer, and objection on this page is fixture data, and opposing
              counsel — {SIGNER.counsel.name} of {SIGNER.counsel.affiliation} — is invented for it.
              The rules beside them are not. Nothing here is legal advice, and no part of it
              describes a real dispute or a real firm.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

/**
 * One interrogatory and its response.
 *
 * An `<article>` rather than a `<div>`: each of these is a self-contained
 * exchange a reader may well link a colleague to, and the landmark is what
 * lets a screen reader move between them instead of through them.
 */
function Exchange({ rog }: { rog: Interrogatory }) {
  const { assessment } = rog

  return (
    <article aria-labelledby={`${rog.id}-heading`}>
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              Interrogatory {rog.number} · {TOPIC_LABEL[rog.topic]}
            </p>
            <CardTitle id={`${rog.id}-heading`} className="font-serif text-base leading-snug">
              {rog.asked}
            </CardTitle>
          </div>
          <Badge variant={SUFFICIENCY_TONE[assessment.sufficiency]}>
            {SUFFICIENCY_LABEL[assessment.sufficiency]}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {rog.objections.length > 0 ? (
            <section className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
              <Attribution
                who={`Objection — ${SIGNER.counsel.name}`}
                what={`${SIGNER.counsel.affiliation}, for the defendant · signed by counsel`}
              />
              <dl className="space-y-3">
                {rog.objections.map((objection) => (
                  <div key={objection.ground} className="space-y-1">
                    <dt className="text-sm font-semibold">{objection.ground}</dt>
                    <dd className="text-[0.95rem] leading-relaxed text-muted-foreground">
                      {objection.stated}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {rog.answer ? (
            <section className="space-y-3 rounded-lg border bg-card p-4">
              <Attribution
                who={`Answer — ${SIGNER.party.name}`}
                what={`${SIGNER.party.side} · ${SIGNER.party.affiliation} · sworn under oath`}
              />
              <p className="flex gap-2 font-serif text-[0.95rem] leading-relaxed">
                <Quote aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary/60" />
                <span>{rog.answer}</span>
              </p>
            </section>
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              No answer was given. The response to this interrogatory is the objection above and
              nothing else.
            </p>
          )}

          <section className="space-y-2">
            <Attribution who="Where it leaves us" what="Neon Law · not part of the response" />
            <p className="text-[0.95rem] leading-relaxed">{assessment.note}</p>
            {assessment.followUp ? (
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Next: </span>
                {assessment.followUp}
              </p>
            ) : null}
          </section>
        </CardContent>
      </Card>
    </article>
  )
}

/** The two-line label above each block, so no block is unattributed. */
function Attribution({ who, what }: { who: string; what: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{who}</p>
      <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
        {what}
      </p>
    </div>
  )
}
