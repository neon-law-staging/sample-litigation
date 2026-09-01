// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CalendarClock, Code2, FileText, Gavel, Quote, RotateCcw, ScrollText, ShieldQuestion } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'

import { PdfViewer } from './PdfViewer'
import { MATTER } from './matter'
import {
  ACCRUAL_CANDIDATES,
  COURT,
  CONTESTED_FACTS,
  DAYS_TO_HEARING,
  LIMITATIONS_YEARS,
  LONGEST_INTERVAL,
  MOTION,
  MOTION_DOCUMENT,
  MOTION_FACTS,
  NARROWEST_MARGIN,
  PROCEDURAL_AUTHORITIES,
  RESERVED,
  SUBSTANTIVE_AUTHORITIES,
  UNDISPUTED_FACTS,
  type AccrualCandidate,
} from './motion'
import { MOTION_NOTATION_BODY, MOTION_NOTATION_FRONTMATTER } from './motionNotation'
import { portalPath } from './mount'
import { READY_KICKER } from './ready'

/**
 * CodeMirror and its language packages, loaded on first use.
 *
 * Same reason `src/pdf.ts` dynamically imports pdf.js: a reader who never opens
 * the motion tab should not download an editor for a card they never scroll
 * to, and `NotationEditor.tsx` is the only file that imports CodeMirror at
 * all. `React.lazy` is the code-splitting seam here rather than a hand-rolled
 * promise cache, because the thing being loaded is a component rather than an
 * imperative API `PdfViewer` drives — see `bundle.test.ts` for the equivalent
 * assertion on the pdf.js chunk.
 */
const NotationEditor = lazy(() =>
  import('./NotationEditor').then((module) => ({ default: module.NotationEditor })),
)

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * The motion page: one filing, and the two things a client cannot read off it.
 *
 * The PDF is on pleading paper and says what it says. What it does not say —
 * because a brief is written for a judge — is *what this wins* and *what it
 * leaves alone*. Those are the two questions a client actually has about a
 * motion, and they are why this is a view rather than a fourth card on the
 * documents tab beside the engagement letter.
 *
 * The page renders three things in that order:
 *
 * 1. **The arithmetic**, as a table. The motion's entire argument is that three
 *    years had not run on any accrual date, so the honest way to show it is the
 *    subtraction itself — every number below is derived in `motion.ts` rather
 *    than typed, and that module refuses to load if the subtraction comes out
 *    the other way.
 * 2. **The reservation**, given equal weight rather than a footnote. A granted
 *    motion on one of two defenses is a partial win, and a client who reads it
 *    as the end of the case has been misled by the layout.
 * 3. **The authorities**, marked verified, the same way the research tab marks
 *    them.
 *
 * Nothing here decides anything. `motion.ts` owns the argument; this file
 * renders it in the order that module states it.
 */

/** Whose theory a candidate accrual date belongs to, as a badge tone. */
const WHOSE_TONE: Record<AccrualCandidate['whose'], 'success' | 'warning'> = {
  statute: 'success',
  defendant: 'warning',
}

const WHOSE_LABEL: Record<AccrualCandidate['whose'], string> = {
  statute: 'What the statute says',
  defendant: 'Prine’s earliest theory',
}

export function MotionPage() {
  const [frontmatter, setFrontmatter] = useState(MOTION_NOTATION_FRONTMATTER)
  const [body, setBody] = useState(MOTION_NOTATION_BODY)

  function resetNotation() {
    setFrontmatter(MOTION_NOTATION_FRONTMATTER)
    setBody(MOTION_NOTATION_BODY)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            {MOTION.title}
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {COURT.shortName} · {COURT.county} · Case No. {COURT.caseNumber} · Dept. {COURT.department}
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Filed {MOTION.filed.label} and heard {MOTION.hearing.label}. It asks the court for one
          thing: to strike Prine’s statute of limitations defense, on the ground that it fails
          however the court reads the dates. It deliberately does not ask about the part of the case
          that is actually in dispute, and the reason is below.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {MOTION_FACTS.map((fact) => (
            <div key={String(fact.label)} className="bg-card px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <Alert>
        <Gavel />
        <AlertTitle>What a grant would and would not do</AlertTitle>
        <AlertDescription>
          Granting this motion ends the argument that Count II was brought too late. It does not
          decide whether Dermot affirmed the instrument by finishing the doughnut, and it does not
          end the case. Two defenses were pleaded; this motion is aimed at one of them, on purpose.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Three years, and every date that could start them</CardTitle>
                <CardDescription>
                  NRS 11.190(3)(d) gives {LIMITATIONS_YEARS} years from discovery. Count II was
                  filed {MOTION.countFiled.label}.
                </CardDescription>
              </div>
              <Badge variant="outline">{MOTION.rule}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>If the clock starts</TableHead>
                    <TableHead>Three years run out</TableHead>
                    <TableHead className="text-right">Filed with</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACCRUAL_CANDIDATES.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <span className="font-serif text-base font-semibold">{entry.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {entry.event}
                        </span>
                      </TableCell>
                      <TableCell className="font-serif text-base">{entry.expiryLabel}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={WHOSE_TONE[entry.whose]}>
                          {entry.marginDays} days to spare
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-3">
                {ACCRUAL_CANDIDATES.map((entry) => (
                  <div key={entry.id} className="rounded-lg border bg-muted/30 p-4">
                    <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                      {WHOSE_LABEL[entry.whose]} · {entry.elapsedDays} days before Count II
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed">{entry.note}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <p className="text-sm leading-relaxed text-muted-foreground">
                This is why the court does not have to choose. The longest run the defense can claim
                on this record is <strong className="text-foreground">{LONGEST_INTERVAL} days</strong>
                , and the interval it needs is {LIMITATIONS_YEARS} years. Even on the date least
                favorable to us the claim was filed with{' '}
                <strong className="text-foreground">{NARROWEST_MARGIN} days</strong> left to run.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden p-0">
            <CardHeader className="p-6 pb-0">
              <div>
                <CardTitle>The filing itself</CardTitle>
                <CardDescription>
                  {MOTION_DOCUMENT.pages} pages on {MOTION_DOCUMENT.ruledLines}-line pleading paper.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <a
                  href={portalPath(MOTION_DOCUMENT.path)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <FileText /> Open full size
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <PdfViewer
                src={portalPath(MOTION_DOCUMENT.path)}
                label={MOTION.longTitle}
                className="h-[44rem] rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>The facts the motion calls undisputed</CardTitle>
                <CardDescription>
                  Each one cited to the record, as NRCP 56(c)(1)(A) requires.
                </CardDescription>
              </div>
              <Badge variant="outline">{UNDISPUTED_FACTS.length} facts</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {UNDISPUTED_FACTS.map((fact) => (
                <div key={fact.number} className="flex gap-3 rounded-lg border bg-card p-4">
                  <span className="font-mono text-sm font-semibold text-primary">
                    {fact.number}
                  </span>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm leading-relaxed">{fact.fact}</p>
                    <p className="font-mono text-[0.7rem] text-muted-foreground">{fact.cite}</p>
                    {fact.contested ? (
                      <Badge variant="warning">Prine would dispute this — and it still loses</Badge>
                    ) : null}
                  </div>
                </div>
              ))}

              <p className="text-sm leading-relaxed text-muted-foreground">
                {CONTESTED_FACTS.length} of the {UNDISPUTED_FACTS.length} are facts Prine has any
                interest in fighting. Neither one changes the outcome, because the substantive law
                here is a {LIMITATIONS_YEARS}-year period and no version of either fact puts the
                filing outside it.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {RESERVED.map((issue) => (
            <Card key={issue.id} className="border-warning/40">
              <CardHeader>
                <div>
                  <CardTitle>What we did not ask for</CardTitle>
                  <CardDescription>{issue.defense}</CardDescription>
                </div>
                <ShieldQuestion className="size-5 text-warning" />
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                <p className="font-serif text-base font-semibold">{issue.question}</p>
                <p className="text-muted-foreground">{issue.why}</p>
                <Separator />
                <p>
                  <span className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                    Where it goes instead
                  </span>
                  <br />
                  {issue.destination}
                </p>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>The hearing</CardTitle>
                <CardDescription>{MOTION.hearing.label}</CardDescription>
              </div>
              <CalendarClock className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>
                <strong>{DAYS_TO_HEARING} days</strong> away, counted from{' '}
                {MOTION.asOf.label} — the fixture’s present moment, not today’s date.
              </p>
              <p className="text-muted-foreground">
                The defense was pleaded in Prine’s answer on {MOTION.answered.label}, and the motion
                went in {MOTION.filed.label}. Nothing about it needs the client to do anything: it
                argues from dates already in the record.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>The authorities</CardTitle>
                <CardDescription>Real law, checked before it was written down.</CardDescription>
              </div>
              <Quote className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {PROCEDURAL_AUTHORITIES.map((authority) => (
                <div key={authority.id} className="space-y-1.5 rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-sm font-semibold">{authority.cite}</p>
                    {authority.verified ? <Badge variant="success">Verified</Badge> : null}
                  </div>
                  <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    “{authority.quote}”
                  </blockquote>
                  <p className="text-sm leading-relaxed text-muted-foreground">{authority.use}</p>
                </div>
              ))}

              <Separator />

              {SUBSTANTIVE_AUTHORITIES.map((authority) => (
                <div key={authority.id} className="space-y-1.5 rounded-lg border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-sm font-semibold">{authority.cite}</p>
                    {authority.verified ? <Badge variant="success">Verified</Badge> : null}
                  </div>
                  <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic leading-relaxed">
                    “{authority.quote}”
                  </blockquote>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {authority.application}
                  </p>
                </div>
              ))}

              <p className="text-xs leading-relaxed text-muted-foreground">
                Selected from <code className="font-mono">src/research.ts</code> by id rather than
                re-quoted, so a citation that needs correcting is corrected once.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>How this document is made</CardTitle>
                <CardDescription>Typst, not a word processor.</CardDescription>
              </div>
              <ScrollText className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                The other three documents in this matter are rendered from notation templates.
                This one is not:{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {MOTION_DOCUMENT.source}
                </code>{' '}
                is Typst source, and{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {MOTION_DOCUMENT.furniture}
                </code>{' '}
                is the pleading paper it sits on.
              </p>
              <p className="text-muted-foreground">
                Pleading paper is a typesetting problem before it is a drafting one.{' '}
                {MOTION_DOCUMENT.ruledLines} numbered lines have to line up with the text beside
                them on every page, which means one baseline grid and every vertical measurement in
                the document a whole multiple of it. There is no notation render profile for that,
                and inventing one here would be inventing it in the wrong repository.
              </p>
              <p className="text-muted-foreground">
                Regenerate it with{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {MOTION_DOCUMENT.script}
                </code>
                . Like the notation PDFs, it is committed rather than built by Vite — the bundle has
                to build on a machine that has never installed Typst.
              </p>
            </CardContent>
          </Card>

          <Alert>
            <AlertTitle>Fixture, as always</AlertTitle>
            <AlertDescription>
              {MATTER.caption} is simulated. The parties, both firms, both bar numbers, the docket
              number, and every date are invented. NRCP 56, NRS 11.190(3)(d), and the quotes from{' '}
              <em>Wood v. Safeway</em> and <em>Friendly Irishman v. Ronnow</em> are real.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>What this would look like as a notation template</CardTitle>
            <CardDescription>
              The engagement letter, the notice, and the affidavit are Markdown like this. The
              card above explains why the motion is not — pleading paper has no render profile
              here. This is a sketch of the same argument in that format, for comparison.
            </CardDescription>
          </div>
          <Code2 className="size-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Suspense
            fallback={
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <div className="h-72 animate-pulse rounded-lg border bg-muted" />
                <div className="h-72 animate-pulse rounded-lg border bg-muted" />
              </div>
            }
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <NotationEditor
                label="Frontmatter — YAML"
                language="yaml"
                value={frontmatter}
                onChange={setFrontmatter}
              />
              <NotationEditor
                label="Body — Markdown"
                language="markdown"
                value={body}
                onChange={setBody}
              />
            </div>
          </Suspense>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Editable with{' '}
              <a
                href="https://codemirror.net/"
                target="_blank"
                rel="noreferrer noopener"
                className="underline decoration-dotted underline-offset-2 hover:text-foreground"
              >
                CodeMirror
              </a>
              , MIT-licensed and bundled from npm rather than a CDN, so it works under the
              portal&apos;s <code className="font-mono">script-src &apos;self&apos;</code> CSP.
              Nothing typed here is saved or rendered — it lives only in this tab, and it is not
              one of the templates in <code className="font-mono">templates/neon_law/</code>.
            </p>
            <Button variant="outline" size="sm" onClick={resetNotation}>
              <RotateCcw /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
