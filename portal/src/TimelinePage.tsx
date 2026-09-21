// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: Apache-2.0

import { ArrowRight, FileText } from 'lucide-react'
import type { ReactNode } from 'react'

import { DOCUMENTS } from './documents'
import { MATTER } from './matter'
import { portalPath } from './mount'
import { READY_KICKER } from './ready'
import {
  AHEAD,
  AS_OF,
  DAYS_TO_NEXT,
  NEXT_EVENT,
  OPENED,
  TIMELINE,
  TIMELINE_FACTS,
  type Mover,
  type TimelineEntry,
} from './timeline'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * The case timeline — the first thing in the portal, and the first thing a
 * client actually asks.
 *
 * Every other view in this portal answers a question about one document: what
 * the motion asks for, what the interrogatories said, what Count II turns on. A
 * client arriving at the portal has an earlier question than any of those —
 * *what has happened in my case, and what happens next* — and no page made of
 * documents answers it, because the answer is the order the documents arrived
 * in rather than anything inside one of them.
 *
 * So the timeline reads as a feed rather than as a table. Each event is a post
 * on a spine: who moved, what they did, what it means, and a way through to the
 * page that explains it in full. On a wide screen the posts alternate across the
 * spine the way a social timeline does — strictly by position, because sorting
 * them onto sides by `mover` would stack six of our own filings down one edge
 * and leave the other blank for half the case. Whose move it was is carried by
 * the badge instead, which is where a reader looks anyway. A year pill
 * interrupts the spine where the year turns, and one marked line divides what is
 * on file from what is still on the calendar.
 *
 * `timeline.ts` owns the events and derives every date from the module that
 * already holds it. This file owns nothing but the rendering, and names no
 * colour: the accent discs read the same `--chart-*` series the chronology rail
 * on the Count II page does, so both follow the theme.
 */

/**
 * The disc colours, by accent.
 *
 * The same mapping the chronology rail uses in `IntroductionPage.tsx`, kept
 * beside the component that draws it rather than shared — the two rails are
 * separate designs that happen to agree today, and hoisting the map would make
 * a change to one of them silently a change to both.
 */
const ACCENT_DISC: Record<string, string> = {
  brand: 'bg-chart-1',
  danger: 'bg-chart-2',
  warning: 'bg-chart-3',
  success: 'bg-chart-4',
  link: 'bg-chart-5',
  neutral: 'bg-muted-foreground',
}

/** How the docket badge is toned, by whose move it was. */
const MOVER_TONE: Record<Mover, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  us: 'default',
  them: 'destructive',
  court: 'outline',
  both: 'secondary',
}

const MOVER_LABEL: Record<Mover, string> = {
  us: 'Our side',
  them: 'Prine’s side',
  court: 'The court',
  both: 'Both sides',
}

export function TimelinePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            What has happened so far
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {MATTER.caption} · {TIMELINE.length} events · {OPENED.dateLabel} onward
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          The case from the day it was filed: the complaint and the summons that opened it, every
          filing and exchange since, and the {AHEAD.length} dates still on the calendar. Read it
          top to bottom and you have the whole case; each card links through to the page that
          explains its own event in full.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {TIMELINE_FACTS.map((fact) => (
            <div key={fact.label} className="bg-card px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {(Object.keys(MOVER_LABEL) as Mover[]).map((mover) => (
            <li key={mover} className="flex items-center gap-2">
              <Badge variant={MOVER_TONE[mover]}>{MOVER_LABEL[mover]}</Badge>
            </li>
          ))}
        </ul>
      </header>

      <Spine />

      <Alert variant="info">
        <AlertTitle>This is the case file, not the story behind it</AlertTitle>
        <AlertDescription>
          What is above is the procedural history — what was filed, served, and set, in order. The
          facts the case argues about, the hedge and the doughnut and the year between the two
          bites, are a different chronology, and it lives on the{' '}
          <a className="font-medium underline underline-offset-4" href={portalPath('#introduction')}>
            Count II page
          </a>
          . The two overlap at exactly two dates, and both pages read them from the same place.
        </AlertDescription>
      </Alert>
    </div>
  )
}

/* ------------------------------------------------------------------ the rail */

function Spine() {
  const rows: ReactNode[] = []
  let year = ''
  let markedToday = false

  TIMELINE.forEach((entry, index) => {
    const entryYear = entry.date.slice(0, 4)
    if (entryYear !== year) {
      year = entryYear
      rows.push(<Interruption key={`year-${entryYear}`} label={entryYear} />)
    }

    if (!markedToday && entry.standing === 'ahead') {
      markedToday = true
      rows.push(
        <Interruption
          key="today"
          label={`Today · ${AS_OF.label}`}
          detail={`${DAYS_TO_NEXT} days to ${NEXT_EVENT.dateLabel}`}
          emphasis
        />,
      )
    }

    rows.push(<Post key={entry.id} entry={entry} side={index % 2 === 0 ? 'left' : 'right'} />)
  })

  return (
    <ol aria-label="Case timeline" className="relative mx-auto w-full max-w-5xl space-y-6">
      {/*
        * The spine. It runs down the left edge on a phone, where an alternating
        * layout would leave two columns of roughly forty characters each, and
        * down the middle from `lg` up, where there is room for the alternation
        * to mean something.
        */}
      <span
        aria-hidden="true"
        className="absolute inset-y-2 left-[1.0625rem] w-px bg-border lg:left-1/2 lg:-ml-px"
      />
      {rows}
    </ol>
  )
}

/** A pill that interrupts the spine: a year turning, or the line between filed and ahead. */
function Interruption({
  label,
  detail,
  emphasis = false,
}: {
  label: string
  detail?: string
  emphasis?: boolean
}) {
  return (
    <li className="relative flex justify-start lg:justify-center">
      <span
        className={cn(
          'relative z-10 inline-flex items-baseline gap-2 rounded-full border bg-background px-3 py-1 font-mono text-xs uppercase tracking-wide',
          emphasis ? 'border-primary/40 text-primary' : 'text-muted-foreground',
        )}
      >
        {label}
        {detail ? <span className="text-[0.65rem] normal-case text-muted-foreground">{detail}</span> : null}
      </span>
    </li>
  )
}

function Post({ entry, side }: { entry: TimelineEntry; side: 'left' | 'right' }) {
  const attachment = entry.document
    ? DOCUMENTS.find((candidate) => candidate.id === entry.document)
    : undefined
  const ahead = entry.standing === 'ahead'

  return (
    <li className="relative pl-14 lg:pl-0">
      {/*
        * The disc sits on the spine and interrupts it with a ring in the page
        * background, which is what makes the line read as passing behind the
        * event rather than through it.
        */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-4 z-10 flex size-9 items-center justify-center rounded-full text-[0.6rem] font-bold text-background ring-4 ring-background lg:left-1/2 lg:-translate-x-1/2',
          ACCENT_DISC[entry.accent] ?? 'bg-muted-foreground',
          ahead && 'opacity-70',
        )}
      >
        {entry.initials}
      </span>

      <div className={cn('lg:w-[calc(50%-3rem)]', side === 'right' && 'lg:ml-auto')}>
        <Card className={ahead ? 'border-dashed' : undefined}>
          {/*
            * The date, the badge, the headline, the byline — a post header, in
            * that order. The badge sits on the date line rather than opposite
            * the title because the card is half a column wide: given the
            * header's own `justify-between`, a badge in the second slot rides
            * up beside a short title and drops below a long one, so no two
            * cards agree on where it is.
            */}
          <CardHeader className="block space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <time
                dateTime={entry.date}
                className="font-mono text-xs uppercase tracking-wide text-muted-foreground"
              >
                {entry.dateLabel}
              </time>
              <Badge variant={MOVER_TONE[entry.mover]}>{entry.kind}</Badge>
              {ahead ? <Badge variant="outline">Upcoming</Badge> : null}
            </div>
            <CardTitle className="text-base">{entry.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {entry.actor} · {entry.role}
            </p>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{entry.body}</p>
          </CardContent>

          {attachment || entry.link ? (
            <CardFooter className="flex-wrap gap-4 py-3">
              {attachment ? (
                <a
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  href={portalPath(attachment.path)}
                >
                  <FileText className="size-4" aria-hidden="true" />
                  {attachment.title}{' '}
                  <span className="font-normal text-muted-foreground">
                    · {attachment.pages} {attachment.pages === 1 ? 'page' : 'pages'}
                  </span>
                </a>
              ) : null}
              {entry.link ? (
                <a
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  href={portalPath(entry.link.hash)}
                >
                  {entry.link.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </CardFooter>
          ) : null}
        </Card>
      </div>
    </li>
  )
}
