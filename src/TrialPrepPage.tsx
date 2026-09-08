// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Gavel,
  Lightbulb,
  Quote,
  RotateCcw,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { CrossExaminationScene, TopicVignette } from './art'
import type { Topic } from './discovery'
import { MATTER } from './matter'
import { portalPath } from './mount'
import { READY_KICKER } from './ready'
import {
  AWAITING_WITNESS,
  DAYS_TO_DEPOSITION,
  GROUND_RULES,
  HEAT_COUNTS,
  MOCK_CROSS,
  ONE_DECK_TWO_ROOMS,
  PREP,
  PREP_CARDS,
  PREP_FACTS,
  ROUND_COUNTS,
  type Heat,
  type PrepCard,
  type Round,
  type Turn,
  type Voice,
} from './trialPrep'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

/**
 * The witness preparation deck.
 *
 * Every other view in this portal renders a document. This one renders a
 * rehearsal, and the difference shows up in the interaction rather than in the
 * prose: a flashcard whose answer is on screen next to the question is not a
 * flashcard, it is a memo with a line down the middle. So the answer side is
 * genuinely absent from the DOM until the reader turns the card over, and
 * `src/test/trial-prep.test.tsx` asserts that it is — the discipline the page
 * exists to impose is the one thing a redesign could quietly remove.
 *
 * Two modes, because the deck has two audiences and they are the same person on
 * different days. *One at a time* is study: a single card, the question cold,
 * and no way to see the next one without answering this one in your head.
 * *All of them* is review, and it is what the client scrolls on the morning of
 * the deposition.
 *
 * Nothing here decides what a good answer is. The cards, the ground rules, and
 * the mock examination are all in `src/trialPrep.ts`, which also checks at
 * import that no card claims support from a piece of record that does not
 * exist.
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

/** Trouble, as a badge tone and a word. Total maps, so a new level cannot slip through. */
const HEAT_TONE: Record<Heat, 'success' | 'warning' | 'destructive'> = {
  settled: 'success',
  watch: 'warning',
  hard: 'destructive',
}

const HEAT_LABEL: Record<Heat, string> = {
  settled: 'Settled ground',
  watch: 'Watch this one',
  hard: 'Hardest',
}

const ROUND_LABEL: Record<Round, string> = {
  cross: 'Cross-examination',
  direct: 'Direct examination',
}

/** Who is asking, spelled out on the face of the card so no question is unattributed. */
const ROUND_ASKER: Record<Round, string> = {
  cross: `${PREP.examiner} · ${PREP.examinerFirm} · for the defendant`,
  direct: `${PREP.ourCounsel} · ${PREP.ourFirm} · for you`,
}

/** How each voice in the mock examination is labeled and set. */
const VOICE_LABEL: Record<Voice, string> = {
  examiner: `${PREP.examiner}, for the defendant`,
  witness: `${PREP.witness}`,
  counsel: `${PREP.ourCounsel}, for you`,
}

const FILTERS = [
  { id: 'all', label: 'Whole deck' },
  { id: 'cross', label: 'Theirs' },
  { id: 'direct', label: 'Ours' },
  { id: 'hard', label: 'Hardest' },
] as const

type Filter = (typeof FILTERS)[number]['id']

function matches(card: PrepCard, filter: Filter): boolean {
  switch (filter) {
    case 'cross':
      return card.round === 'cross'
    case 'direct':
      return card.round === 'direct'
    case 'hard':
      return card.heat === 'hard'
    case 'all':
      return true
  }
}

export function TrialPrepPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [mode, setMode] = useState<'study' | 'all'>('study')
  const [at, setAt] = useState(0)

  const deck = useMemo(() => PREP_CARDS.filter((card) => matches(card, filter)), [filter])
  const index = Math.min(at, Math.max(deck.length - 1, 0))
  const current = deck[index]

  function choose(next: Filter) {
    setFilter(next)
    setAt(0)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Getting ready to testify
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Witness preparation · {MATTER.caption} · {MATTER.jurisdiction}
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {PREP_CARDS.length} cards, written from what the other side has already sworn to and what
          they have already asked. Each one holds a question on the front and{' '}
          <strong className="font-semibold text-foreground">nothing on the back until you turn
          it over</strong> — answer it in your head first, then look. That is the only part of this
          that resembles the room you will be answering in.
        </p>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border lg:grid-cols-4">
          {PREP_FACTS.map((fact) => (
            <div key={String(fact.label)} className="bg-card px-4 py-3">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-0.5 font-serif text-base font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <figure className="space-y-2">
        <CrossExaminationScene />
        <figcaption className="text-sm text-muted-foreground">
          You in the box, {PREP.examiner} at the lectern, and the transcript between you. Everything
          that leaves that room leaves as words on a page — which is why the shape of an answer
          matters as much as the truth of it.
        </figcaption>
      </figure>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div>
              <CardTitle>One deck, two rooms</CardTitle>
              <CardDescription>
                Deposition {PREP.deposition.label} · trial {PREP.trial.label}
              </CardDescription>
            </div>
            <Badge variant={DAYS_TO_DEPOSITION > 30 ? 'outline' : 'warning'}>
              {DAYS_TO_DEPOSITION} days
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
            <p>{ONE_DECK_TWO_ROOMS}</p>
            <p className="text-muted-foreground">
              So we prepare once, for the harder of the two rooms. A deposition has no judge in it
              and no jury watching, which sounds easier and is not: the examiner has all day, there
              is nobody to perform for, and the only record being made is the one he is making.
            </p>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Counted as of {PREP.asOf.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Six habits, and they matter more than the answers</CardTitle>
              <CardDescription>
                A witness with these and no script does better than a witness with a script and none
                of these.
              </CardDescription>
            </div>
            <Lightbulb aria-hidden="true" className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {GROUND_RULES.map((rule, position) => (
                <li key={rule.id} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[0.7rem] font-bold text-primary"
                  >
                    {position + 1}
                  </span>
                  <div>
                    <p className="font-serif font-semibold leading-snug">{rule.rule}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {rule.why}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {AWAITING_WITNESS.length > 0 ? (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <div>
              <CardTitle>The answers we cannot write for you</CardTitle>
              <CardDescription>
                {AWAITING_WITNESS.length} of {PREP_CARDS.length} cards, and they are the two the
                case turns on.
              </CardDescription>
            </div>
            <Badge variant="destructive">Bring these to {PREP.session.label}</Badge>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {AWAITING_WITNESS.map((card) => (
                <li key={card.id} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 font-mono text-[0.7rem] font-bold text-destructive"
                  >
                    {card.number}
                  </span>
                  <p className="font-serif text-[0.95rem] leading-snug">{card.asked}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section aria-labelledby="deck-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="deck-heading" className="font-serif text-2xl font-semibold tracking-tight">
              The deck
            </h2>
            <p className="text-sm text-muted-foreground">
              {ROUND_COUNTS.cross} questions from {PREP.examinerFirm} · {ROUND_COUNTS.direct} of our
              own · {HEAT_COUNTS.hard} we will spend the session on
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(next) => next && choose(next as Filter)}
              aria-label="Filter the deck"
            >
              {FILTERS.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(next) => next && setMode(next as 'study' | 'all')}
              aria-label="How to work through the deck"
            >
              <ToggleGroupItem value="study">One at a time</ToggleGroupItem>
              <ToggleGroupItem value="all">All of them</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {mode === 'study' && current ? (
          <div className="space-y-4">
            {/*
             * Keyed by card id so that moving through the deck re-mounts the
             * card and takes the answer back down with it. A revealed card that
             * stays revealed when the next question arrives has stopped being a
             * flashcard.
             */}
            <Flashcard key={current.id} card={current} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setAt(Math.max(index - 1, 0))}
                disabled={index === 0}
              >
                <ArrowLeft /> Previous
              </Button>
              <p aria-live="polite" className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                Card {index + 1} of {deck.length}
              </p>
              {index === deck.length - 1 ? (
                <Button variant="outline" onClick={() => setAt(0)}>
                  <RotateCcw /> Start over
                </Button>
              ) : (
                <Button onClick={() => setAt(index + 1)}>
                  Next <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {mode === 'all' ? (
          <div className="space-y-5">
            {deck.map((card) => (
              <Flashcard key={card.id} card={card} />
            ))}
          </div>
        ) : null}

        {deck.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No cards match that filter.
            </CardContent>
          </Card>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <MockCross />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>What they have already sworn to</CardTitle>
                <CardDescription>
                  The cards are drafted from the record, not from our imagination.
                </CardDescription>
              </div>
              <Gavel aria-hidden="true" className="size-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p>
                Wendell Prine answered eight interrogatories under oath on 27 July, and three of
                those answers are better for us than anything we could have written: he never
                mentioned a soul at the hedge, he never raised the doughnut again in a year of
                talking, and he dates his own contention to the day the doughnut was finished.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <a href={portalPath('#discovery')}>
                    What they swore <ArrowRight />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={portalPath('#interrogatories')}>
                    What you will swear <ArrowRight />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert variant="warning">
            <TriangleAlert />
            <AlertTitle>A rehearsal, not a script</AlertTitle>
            <AlertDescription>
              <p>
                Nothing on this page tells you what to say. It tells you what will be asked, what
                the question is for, and how to answer it truthfully without giving away ground you
                do not have to give. Every suggested answer is drawn from what you have already told
                us — if one of them is not true, or not how you remember it, that is the most
                important thing you can tell us on {PREP.session.label}.
              </p>
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <ShieldAlert />
            <AlertTitle>Fixture, like the rest of the portal</AlertTitle>
            <AlertDescription>
              <p>
                {MATTER.caption} is a simulated matter. {PREP.witness}, {PREP.examiner} of{' '}
                {PREP.examinerFirm}, every question on this page and every answer beneath one are
                invented for it. No witness was prepared with this deck and nothing here is legal
                advice.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}

/**
 * One card, question side up.
 *
 * The back is not hidden with CSS — it is not rendered. A visually hidden
 * answer is still an answer a reader's eye catches, a screen reader reads out,
 * and a find-in-page lands on, and any of those turns the deck back into a
 * memo. `revealed` is local state so that each card in the list mode is turned
 * over on its own, and so that the study mode's `key` takes it back down.
 */
function Flashcard({ card }: { card: PrepCard }) {
  const [revealed, setRevealed] = useState(false)
  const heading = `${card.id}-heading`

  return (
    <article aria-labelledby={heading}>
      <Card className={cn(card.heat === 'hard' && 'border-l-4 border-l-destructive')}>
        <CardHeader>
          <div className="flex flex-1 items-start gap-4">
            <span className="hidden shrink-0 rounded-lg border bg-muted/40 p-2 sm:block">
              <TopicVignette topic={card.topic} size={56} />
            </span>
            <div className="space-y-1">
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                Card {card.number} · {ROUND_LABEL[card.round]} · {TOPIC_LABEL[card.topic]}
              </p>
              <CardTitle id={heading} className="font-serif text-lg leading-snug">
                <Quote aria-hidden="true" className="mr-1.5 inline size-4 text-primary/60" />
                {card.asked}
              </CardTitle>
              <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                Asked by {ROUND_ASKER[card.round]}
              </p>
            </div>
          </div>
          <Badge variant={HEAT_TONE[card.heat]}>{HEAT_LABEL[card.heat]}</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {revealed ? (
            <>
              <Block label="What the question is for" tone="muted">
                {card.aim}
              </Block>

              {card.answer ? (
                <section className="space-y-2 rounded-lg border border-success/40 bg-success/5 p-4">
                  <Attribution
                    who="What you say"
                    what={`${PREP.witness} · your words, not ours`}
                  />
                  <p className="font-serif text-[1.05rem] leading-relaxed">{card.answer}</p>
                </section>
              ) : (
                <section className="space-y-2 rounded-lg border border-dashed border-destructive/50 p-4">
                  <Attribution
                    who="Nothing drafted, and nothing will be"
                    what="This answer has to be yours"
                  />
                  <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
                    We will not write this one for you. Bring your own account of it to{' '}
                    {PREP.session.label}.
                  </p>
                </section>
              )}

              <Block label="Why that answer" tone="plain">
                {card.why}
              </Block>

              {card.weak ? (
                <section className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 p-4">
                  <Attribution
                    who="An answer that is true and still costs you"
                    what="Not a lie — just ground given away"
                  />
                  <p className="font-serif text-[0.95rem] italic leading-relaxed">
                    &ldquo;{card.weak.said}&rdquo;
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.weak.costs}</p>
                </section>
              ) : null}

              {card.followUp ? (
                <p className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  <ArrowRight aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span>
                    <span className="font-semibold text-foreground">Then he asks: </span>
                    {card.followUp}
                  </span>
                </p>
              ) : null}

              {card.anchor ? (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <Attribution
                    who="Where this comes from"
                    what={
                      card.anchor.set === 'served'
                        ? 'Their sworn answers to the set we served'
                        : 'The responses being drafted for your oath'
                    }
                  />
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {card.anchor.says}
                  </p>
                  <a
                    href={portalPath(`#${card.anchor.view}`)}
                    className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Read it in the record <ArrowRight aria-hidden="true" className="size-3" />
                  </a>
                </div>
              ) : null}
            </>
          ) : (
            <Button variant="outline" onClick={() => setRevealed(true)}>
              <Eye /> Turn the card over
            </Button>
          )}
        </CardContent>
      </Card>
    </article>
  )
}

/** A labeled paragraph on the back of a card. Two tones, and no third. */
function Block({
  label,
  tone,
  children,
}: {
  label: string
  tone: 'muted' | 'plain'
  children: string
}) {
  return (
    <section className="space-y-1">
      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'text-[0.95rem] leading-relaxed',
          tone === 'muted' && 'text-muted-foreground',
        )}
      >
        {children}
      </p>
    </section>
  )
}

/**
 * The simulated examination.
 *
 * The cards teach one question at a time, which is not how they arrive. This is
 * the same material as a run: three agreeable questions, then the one they were
 * for. The coaching notes are asides rather than dialogue, so a reader can turn
 * them off and read the exchange the way the jury would hear it.
 */
function MockCross() {
  const [coaching, setCoaching] = useState(true)

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>What it sounds like when the questions come in a row</CardTitle>
          <CardDescription>
            A simulated cross-examination. Every question in it is fair and every answer is true —
            the pressure is entirely in the order.
          </CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={coaching ? 'on' : 'off'}
          onValueChange={(next) => next && setCoaching(next === 'on')}
          aria-label="Coaching notes"
        >
          <ToggleGroupItem value="on">Notes on</ToggleGroupItem>
          <ToggleGroupItem value="off">Notes off</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {MOCK_CROSS.map((turn) => (
            <TranscriptTurn key={turn.id} turn={turn} coaching={coaching} />
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

/** One line of the transcript, set by who is speaking. */
function TranscriptTurn({ turn, coaching }: { turn: Turn; coaching: boolean }) {
  const rail: Record<Voice, string> = {
    examiner: 'border-l-destructive/60',
    witness: 'border-l-primary/60',
    counsel: 'border-l-warning/70',
  }

  return (
    <li className={cn('border-l-2 pl-4', rail[turn.voice])}>
      <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
        {VOICE_LABEL[turn.voice]}
      </p>
      <p className="font-serif text-[1.05rem] leading-relaxed">{turn.text}</p>
      {coaching && turn.coaching ? (
        <p className="mt-1.5 flex gap-2 text-sm leading-relaxed text-muted-foreground">
          <Lightbulb aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{turn.coaching}</span>
        </p>
      ) : null}
    </li>
  )
}

/** The two-line label above a block, so nothing on a card is unattributed. */
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
