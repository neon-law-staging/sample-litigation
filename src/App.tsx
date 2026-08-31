// Copyright (C) 2026 Neon Law Foundation.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ArrowRight, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CaseLibraryPage } from './CaseLibraryPage'
import { DiscoveryPage } from './DiscoveryPage'
import { IntroductionPage } from './IntroductionPage'
import { MotionPage } from './MotionPage'
import { ResponsesPage } from './ResponsesPage'
import { TrialPrepPage } from './TrialPrepPage'
import { INTERROGATORIES, PROCEEDING } from './discovery'
import { MATTER, MATTER_FACTS, NEXT_STEPS } from './matter'
import { DAYS_TO_HEARING, MOTION, NARROWEST_MARGIN } from './motion'
import { portalPath } from './mount'
import { READY_KICKER } from './ready'
import { DAYS_REMAINING, INBOUND, READINESS_COUNTS, RECEIVED } from './responses'
import { SOUL_CLAIM } from './soulContract'
import { AWAITING_WITNESS, DAYS_TO_DEPOSITION, PREP, PREP_CARDS } from './trialPrep'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * The portal.
 *
 * Built on shadcn-style components in `src/components/ui/` — Radix primitives
 * for the behavior, Tailwind for the styling, and a single teal theme in
 * `index.css` that every component reads through semantic variables. Nothing
 * here names a color, so a rebrand is that one file.
 *
 * The components live in this repository rather than arriving from a package,
 * which is what shadcn is: you own the source, so a component that needs to
 * behave differently gets edited instead of wrapped.
 */

type View =
  | 'overview'
  | 'introduction'
  | 'discovery'
  | 'interrogatories'
  | 'trial-prep'
  | 'motion'
  | 'case-library'

/**
 * Routing by fragment, deliberately.
 *
 * A path-based route would need Navigator to serve `index.html` for every
 * sub-path under the mount, and it does not promise that — a deep link to
 * `…/portal/introduction` would 404 on a real deployment even though it works
 * under the dev server, which is the worst possible place to find out. A
 * fragment is never sent to the origin, so every view is a bookmarkable URL
 * that cannot 404, at the cost of a `#` a reader will not notice.
 */
const VIEW_BY_HASH: Record<string, View> = {
  '#introduction': 'introduction',
  '#discovery': 'discovery',
  '#interrogatories': 'interrogatories',
  '#trial-prep': 'trial-prep',
  '#motion': 'motion',
  '#case-library': 'case-library',
}

function viewFromHash(): View {
  return VIEW_BY_HASH[window.location.hash] ?? 'overview'
}

export function App() {
  const [view, setView] = useState<View>(viewFromHash)

  useEffect(() => {
    const sync = () => setView(viewFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      <TopNav view={view} />

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {view === 'introduction' ? <IntroductionPage /> : null}
        {view === 'discovery' ? <DiscoveryPage /> : null}
        {view === 'interrogatories' ? <ResponsesPage /> : null}
        {view === 'trial-prep' ? <TrialPrepPage /> : null}
        {view === 'motion' ? <MotionPage /> : null}
        {view === 'case-library' ? <CaseLibraryPage /> : null}
        {view === 'overview' ? <Overview /> : null}
      </main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <span>Fixture data only — {MATTER.caption} is a simulated matter.</span>
          <span className="font-mono">Navigator · client portal</span>
        </div>
      </footer>
    </div>
  )
}

function TopNav({ view }: { view: View }) {
  const links: { label: string; href: string; current: boolean }[] = [
    { label: 'Overview', href: portalPath(''), current: view === 'overview' },
    {
      label: SOUL_CLAIM.count,
      href: portalPath('#introduction'),
      current: view === 'introduction',
    },
    { label: 'Discovery', href: portalPath('#discovery'), current: view === 'discovery' },
    {
      label: 'Interrogatories',
      href: portalPath('#interrogatories'),
      current: view === 'interrogatories',
    },
    {
      label: 'Trial prep',
      href: portalPath('#trial-prep'),
      current: view === 'trial-prep',
    },
    { label: 'Motion', href: portalPath('#motion'), current: view === 'motion' },
    {
      label: 'Case Library',
      href: portalPath('#case-library'),
      current: view === 'case-library',
    },
  ]

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
          <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary">
            Navigator · Client Portal
          </span>
          <span className="text-sm text-muted-foreground">
            {MATTER.caption} — {MATTER.claim.toLowerCase()}
          </span>
        </div>
        {/*
          * Five sections wrap rather than scroll: a tab strip that runs off the
          * side of a phone hides the section a reader has not been told exists,
          * and the current-page underline is what makes two rows legible.
          */}
        <nav aria-label="Portal sections" className="-mb-px flex flex-wrap gap-x-6 gap-y-1">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              aria-current={link.current ? 'page' : undefined}
              className={cn(
                'border-b-2 px-0.5 pb-2.5 text-sm font-medium transition-colors',
                link.current
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Overview() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            {MATTER.caption}
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {MATTER.claim} · {MATTER.jurisdiction} · Fixture matter
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Your matter workspace: where things stand, what happens next, and how to reach the people
          working on it.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {MATTER_FACTS.map((fact) => (
            <div key={String(fact.label)} className="bg-card px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div>
                <CardTitle>
                  {SOUL_CLAIM.count} — {SOUL_CLAIM.title}
                </CardTitle>
                <CardDescription>Added by amendment, pleaded in the alternative.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                <strong className="text-foreground">The theme, in one line:</strong> Prine says a
                doughnut bought him Dermot&apos;s soul. We think a bargain that lopsided is not a
                bargain at all — it is an excess-damages claim wearing a contract&apos;s clothes,
                and the disparity between what Dermot got and what Prine says he gave up is itself
                evidence of the overreaching this count is built on.
              </p>
              <p>
                Whether Dermot may rescind that alleged contract — given in exchange for a doughnut
                he ate in two sittings a year apart — is the question the rest of this count
                answers.
              </p>
              <Button asChild>
                <a href={portalPath('#introduction')}>
                  Read the introduction to {SOUL_CLAIM.count} <ArrowRight />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Discovery — {PROCEEDING.set}</CardTitle>
                <CardDescription>
                  Served {PROCEEDING.served.label} · responses {PROCEEDING.responded.label}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                {INTERROGATORIES.length} written questions went to Wendell Prine and came back
                answered in part, objected to in part. The page splits each response into the two
                voices it is actually written in — the defendant under oath, and his counsel
                objecting — and says what each one leaves us with.
              </p>
              <Button asChild variant="outline">
                <a href={portalPath('#discovery')}>
                  Read the interrogatories and responses <ArrowRight />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive">
            <CardHeader>
              <div>
                <CardTitle>Interrogatories — {INBOUND.set}</CardTitle>
                <CardDescription>
                  Served on you {INBOUND.served.label} · responses due {INBOUND.due.label}
                </CardDescription>
              </div>
              <Badge variant="destructive">{DAYS_REMAINING} days</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                The other side has now put {RECEIVED.length} written questions to you, and the
                answers go back under your oath rather than ours. Drafts are written for{' '}
                {RECEIVED.length - READINESS_COUNTS['needs-client']} of them;{' '}
                {READINESS_COUNTS['needs-client']} are waiting on something only you can tell us.
              </p>
              <Button asChild>
                <a href={portalPath('#interrogatories')}>
                  Review your draft responses <ArrowRight />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div>
                <CardTitle>Trial prep — {PREP_CARDS.length} flashcards</CardTitle>
                <CardDescription>
                  Deposition {PREP.deposition.label} · trial {PREP.trial.label}
                </CardDescription>
              </div>
              <Badge variant={DAYS_TO_DEPOSITION > 30 ? 'outline' : 'warning'}>
                {DAYS_TO_DEPOSITION} days
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                The questions {PREP.examiner} is going to put to you, what each one is for, and how
                to answer it without giving away ground. The answer stays hidden until you turn the
                card over, so you can practice rather than read — and{' '}
                {AWAITING_WITNESS.length} of them are answers only you can give.
              </p>
              <Button asChild>
                <a href={portalPath('#trial-prep')}>
                  Work through the deck <ArrowRight />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <div>
                <CardTitle>Motion — partial summary judgment</CardTitle>
                <CardDescription>
                  Filed {MOTION.filed.label} · heard {MOTION.hearing.label}
                </CardDescription>
              </div>
              <Badge variant="outline">{DAYS_TO_HEARING} days</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                We have asked the court to throw out Prine&apos;s argument that {SOUL_CLAIM.count}{' '}
                was brought too late. It is a narrow motion and a strong one: on the least
                favorable reading of the dates the claim was still filed with {NARROWEST_MARGIN}{' '}
                days to spare. It does not ask about the part of the case that is genuinely in
                dispute, and the page says why.
              </p>
              <Button asChild variant="outline">
                <a href={portalPath('#motion')}>
                  Read the motion <ArrowRight />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Next steps</CardTitle>
                <CardDescription>In the order they are useful.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step.id} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-serif font-semibold">{step.title}</p>
                      {step.detail ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">{step.detail}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Where things stand</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                This is the client portal application served for your matter, streamed from
                Navigator&apos;s per-deployment applications bucket. It arrives from
                Navigator&apos;s own origin, behind your session and the participation list for{' '}
                {MATTER.caption}, so only the people on the matter can reach it.
              </p>
              <p>
                Nothing on this page is a live record. {MATTER.caption} is a fixture matter, and
                this bundle is the worked example a contributor reads before attaching a real
                application to a real one.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                Navigator mounts this bundle at{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {portalPath('')}
                </code>{' '}
                and streams it rather than redirecting to a signed URL — a signed URL is shareable
                by whoever holds it and would not carry your session.
              </p>
              <p>
                It is a Vite + React build, styled with Tailwind and shadcn-style components owned
                in this repository.
              </p>
              <Button asChild variant="outline" size="sm">
                <a
                  href="https://github.com/neon-law-source-code/navigator"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Navigator on GitHub <ExternalLink />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Alert variant="info">
            <AlertTitle>There is no backend in this repository</AlertTitle>
            <AlertDescription>
              A portal that needs data reads it same-origin from Navigator&apos;s{' '}
              <code className="font-mono text-xs">/app/api</code> and writes through its command
              boundary, so the session cookie and the participation gate apply without any code here
              doing anything to earn them.
            </AlertDescription>
          </Alert>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Legal notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This portal shows simulated information only. {MATTER.caption} is a fixture matter
                used to demonstrate Navigator, no part of it describes a real dispute, and nothing
                here is legal advice.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
