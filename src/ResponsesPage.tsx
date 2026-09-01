// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArrowRight, CalendarClock, CircleDot, ExternalLink, Gavel, Quote, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PROCEEDING, type Topic } from './discovery'
import { MATTER } from './matter'
import { portalPath } from './mount'
import { READY_KICKER } from './ready'
import {
  CERTIFICATIONS,
  CERTIFIER,
  CLIENT_TASKS,
  DAYS_REMAINING,
  INBOUND,
  OBJECTING_COUNT,
  OUTSTANDING,
  READINESS_COUNTS,
  RECEIVED,
  RESPONSE_FACTS,
  RESPONSE_RULES,
  STANCE_COUNTS,
  type DraftResponse,
  type Readiness,
} from './responses'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/**
 * The interrogatories page: what the other side asked, and what we will say.
 *
 * `DiscoveryPage` renders a finished document — served, answered, signed — and
 * its job is to explain what came back. This page renders an unfinished one,
 * and its job is different in a way worth being deliberate about: every block
 * of prose below is a draft, none of it has been served, and the answers are
 * not sworn until the client swears to them. So each draft block is labeled as
 * a draft on its face rather than in a note at the bottom. A client who reads
 * a draft answer as a filed one is the failure mode this layout is built
 * against, exactly as the two-voices layout on the discovery page is built
 * against reading counsel's objection as the party's testimony.
 *
 * The order is the order the work happens in: how long there is, what is
 * waiting on whom, who signs what, and then the eight drafts themselves. The
 * data — including the derived deadline and every count on the page — is in
 * `responses.ts`. Nothing here decides whether a draft is ready.
 */

/** Topic to the phrase the rest of the portal uses for the same issue. */
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
 * Readiness to badge tone and label, as total maps rather than ternaries.
 *
 * Add a fourth stage to the union and the compiler names these two lines
 * instead of quietly rendering the new stage as whichever branch came last.
 */
const READINESS_TONE: Record<Readiness, 'success' | 'warning' | 'destructive'> = {
  ready: 'success',
  'needs-client': 'destructive',
  'needs-firm': 'warning',
}

const READINESS_LABEL: Record<Readiness, string> = {
  ready: 'Ready to sign',
  'needs-client': 'Needs you',
  'needs-firm': 'Needs us',
}

/** The filters over the set. `all` first, then the three worth isolating. */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'yours', label: 'Needs you' },
  { id: 'objecting', label: 'Objecting' },
  { id: 'ready', label: 'Ready to sign' },
] as const

type Filter = (typeof FILTERS)[number]['id']

function matches(response: DraftResponse, filter: Filter): boolean {
  switch (filter) {
    case 'yours':
      return response.outstanding?.owner === 'client'
    case 'objecting':
      return response.objections.length > 0
    case 'ready':
      return response.readiness === 'ready'
    case 'all':
      return true
  }
}

export function ResponsesPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = useMemo(() => RECEIVED.filter((response) => matches(response, filter)), [filter])

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Responses to Prine&apos;s interrogatories
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Discovery · {MATTER.caption} · {MATTER.jurisdiction}
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {INBOUND.set} was served on you on {INBOUND.served.label}: {RECEIVED.length} written
          questions you have to answer under oath. Below is what they asked and what we have drafted
          for you to say. <strong className="font-semibold text-foreground">None of it has been
          served and none of it is sworn yet</strong> — that happens when you have read the answers
          and told us they are true in your own words.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {RESPONSE_FACTS.map((fact) => (
            <div key={String(fact.label)} className="bg-card px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Where the drafting stands</CardTitle>
              <CardDescription>
                {RECEIVED.length} responses, and who each one is waiting on.
              </CardDescription>
            </div>
            <Badge variant={DAYS_REMAINING > 14 ? 'outline' : 'warning'}>
              {DAYS_REMAINING} days left
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress />
            <dl className="grid grid-cols-3 gap-3 text-center">
              {(['ready', 'needs-client', 'needs-firm'] as const).map((stage) => (
                <div key={stage} className="rounded-lg border bg-muted/30 px-2 py-3">
                  <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {READINESS_LABEL[stage]}
                  </dt>
                  <dd className="font-serif text-2xl font-bold">{READINESS_COUNTS[stage]}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {OBJECTING_COUNT} of the {RECEIVED.length} will carry an objection, and{' '}
              {STANCE_COUNTS['objection-only']} is an objection and nothing else. The rest get
              answered in full, which is the deliberate position explained beside each one.
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div>
              <CardTitle>The deadline is fixed by rule</CardTitle>
              <CardDescription>
                Served {INBOUND.served.label} · due {INBOUND.due.label}
              </CardDescription>
            </div>
            <CalendarClock aria-hidden="true" className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
            <p>
              NRCP 33(b)(2) gives {INBOUND.responseWindowDays} days from service, and the answers
              and the objections both go out together — there is no version of this where the
              objections are served now and the answers follow. Thirty days from{' '}
              {INBOUND.served.label} lands on a Sunday, so the date is the Monday after:{' '}
              <strong className="font-semibold">{INBOUND.due.label}</strong>.
            </p>
            <p className="text-muted-foreground">
              The cost of missing it is not a scolding. Under NRCP 33(b)(4) a ground not raised in a
              timely objection is waived, so a late response is a response that has given up every
              objection it did not make in time — including the privilege objection on Interrogatory
              8, which is the one we least want to lose.
            </p>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Counted as of {INBOUND.asOf.label}
            </p>
          </CardContent>
        </Card>
      </div>

      {CLIENT_TASKS.length > 0 ? (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <div>
              <CardTitle>What we need from you</CardTitle>
              <CardDescription>
                {CLIENT_TASKS.length} of {OUTSTANDING.length} outstanding items are yours. The rest
                are ours.
              </CardDescription>
            </div>
            <Badge variant="destructive">Blocking</Badge>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {CLIENT_TASKS.map((task) => (
                <li key={task.id} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 font-mono text-xs font-bold text-destructive"
                  >
                    {task.number}
                  </span>
                  <div>
                    <p className="font-serif font-semibold">Interrogatory {task.number}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {task.task}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Two signatures, and one of them is yours</CardTitle>
            <CardDescription>
              What each signature will certify when the response goes out.
            </CardDescription>
          </div>
          <Badge variant="outline">NRCP 33(b)(5)</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {CERTIFICATIONS.map((certification) => (
            <div key={certification.id} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
              <p className="font-serif text-base font-semibold">{certification.name}</p>
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                {certification.side} · {certification.affiliation}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {certification.certifies}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">
                The set, and our drafts
              </h2>
              <p className="text-sm text-muted-foreground">
                {shown.length} of {RECEIVED.length} shown · {READINESS_COUNTS['needs-client']}{' '}
                waiting on you · {RECEIVED.length} of {INBOUND.cap} allowed under NRCP 33(a)(1)
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

          {shown.map((response) => (
            <Draft key={response.id} response={response} />
          ))}

          {shown.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nothing in the set matches that filter — which, for the filter of things waiting on
                you, is the answer you want.
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>The rules a response is held to</CardTitle>
                <CardDescription>
                  Quoted rather than paraphrased. Unlike the exchange, these are real.
                </CardDescription>
              </div>
              <Badge variant="success">Verified</Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              {RESPONSE_RULES.map((rule) => (
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
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>The other half of this fight</CardTitle>
                <CardDescription>
                  {PROCEEDING.set}, and what came back from {CERTIFIER.requests.affiliation}.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                The positions taken in these drafts have to square with the ones we are pressing
                against them. We are moving to compel on their Interrogatory 3 because a contention
                question was met with an objection and nothing else — which is why the contention
                questions here get answered rather than deflected.
              </p>
              <Button asChild variant="outline">
                <a href={portalPath('#discovery')}>
                  Read what we asked them <ArrowRight />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Alert variant="warning">
            <ShieldAlert />
            <AlertTitle>Drafts, and invented ones</AlertTitle>
            <AlertDescription>
              Every interrogatory and every draft answer on this page is fixture data, and opposing
              counsel — {CERTIFIER.requests.name} of {CERTIFIER.requests.affiliation} — is invented
              for it. The rules beside them are not. Nothing here has been served on anybody,
              nothing here is legal advice, and no part of it describes a real dispute or a real
              firm.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

/**
 * The one bar on the page, as three spans of a rail rather than a component.
 *
 * A `Progress` in `components/ui` would be a component owned for one use, and
 * the thing being shown is not progress toward one number — it is three
 * populations of a fixed set. The `<dl>` beside it carries the same figures as
 * text, so the bar is decoration and `aria-hidden` says so.
 */
function Progress() {
  const stages = [
    { stage: 'ready' as const, className: 'bg-success' },
    { stage: 'needs-firm' as const, className: 'bg-warning' },
    { stage: 'needs-client' as const, className: 'bg-destructive' },
  ]

  return (
    <div
      aria-hidden="true"
      className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
    >
      {stages.map(({ stage, className }) =>
        READINESS_COUNTS[stage] > 0 ? (
          <span
            key={stage}
            className={className}
            style={{ width: `${(READINESS_COUNTS[stage] / RECEIVED.length) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  )
}

/**
 * One interrogatory and the response being drafted for it.
 *
 * An `<article>` for the same reason the discovery page uses one: each of these
 * is a self-contained thing a reader may link a colleague to, and the landmark
 * is what lets a screen reader move between them rather than through them.
 */
function Draft({ response }: { response: DraftResponse }) {
  return (
    <article aria-labelledby={`${response.id}-heading`}>
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              Interrogatory {response.number} · {TOPIC_LABEL[response.topic]}
            </p>
            <CardTitle id={`${response.id}-heading`} className="font-serif text-base leading-snug">
              {response.asked}
            </CardTitle>
          </div>
          <Badge variant={READINESS_TONE[response.readiness]}>
            {READINESS_LABEL[response.readiness]}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {response.objections.length > 0 ? (
            <section className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
              <Attribution
                who={`Objection — ${CERTIFIER.objections.name}`}
                what={`${CERTIFIER.objections.affiliation}, for you · draft, to be signed by counsel`}
              />
              <dl className="space-y-3">
                {response.objections.map((objection) => (
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

          {response.answer ? (
            <section className="space-y-3 rounded-lg border bg-card p-4">
              <Attribution
                who={`Draft answer — ${CERTIFIER.answers.name}`}
                what={`${CERTIFIER.answers.side} · to be sworn by you · not yet signed`}
              />
              <p className="flex gap-2 font-serif text-[0.95rem] leading-relaxed">
                <Quote aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary/60" />
                <span>{response.answer}</span>
              </p>
            </section>
          ) : response.stance === 'objection-only' ? (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              No answer will be given. The response to this interrogatory is the objection above and
              nothing else — the reason it can be is below.
            </p>
          ) : (
            <p className="rounded-lg border border-dashed border-destructive/40 px-4 py-3 text-sm text-muted-foreground">
              Nothing drafted yet. This answer has to come from you before it can be written, and
              what we need is in the note below.
            </p>
          )}

          <section className="space-y-2">
            <Attribution who="Why it is drafted this way" what="Neon Law · not part of the response" />
            <p className="text-[0.95rem] leading-relaxed">{response.note}</p>
            {response.outstanding ? (
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {response.outstanding.owner === 'client' ? 'We need from you: ' : 'We still owe: '}
                </span>
                {response.outstanding.task}
              </p>
            ) : null}
            {response.consistency ? (
              <p className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                <CircleDot aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold text-foreground">Squares with our own set: </span>
                  {response.consistency}
                </span>
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
