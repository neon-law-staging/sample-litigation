// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { BookOpen, ExternalLink } from 'lucide-react'

import { CASE_LIBRARY, CASE_LIBRARY_NOTE } from './caseLibrary'
import { READY_KICKER } from './ready'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * A shelf of real citations that are not Count II authorities.
 *
 * `IntroductionPage`'s research tab is deliberately narrow — five authorities,
 * each answering a question this matter actually asks. A citation that does not
 * fit that scope has nowhere to go on that page, and forcing it in there would
 * misrepresent it as bearing on Cruller v. Prine when it does not. This page is
 * that overflow: still real law, still verified, but explicitly not part of the
 * case, which is why every card states its own irrelevance up front.
 */
export function CaseLibraryPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {READY_KICKER}
        </p>
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
            Case Library
          </h1>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            General reference · not part of Count II
          </p>
        </div>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Real authorities that do not answer any question this matter asks — kept here rather than
          folded into the Count II research, where a reader would reasonably assume everything on the
          page bears on the case.
        </p>
      </header>

      <Alert variant="info">
        <BookOpen />
        <AlertTitle>These citations are real; their relevance to this matter is not claimed</AlertTitle>
        <AlertDescription>{CASE_LIBRARY_NOTE}</AlertDescription>
      </Alert>

      <div className="space-y-4">
        {CASE_LIBRARY.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle className="text-base">{item.cite}</CardTitle>
                <CardDescription>
                  {item.court} · {item.dateLabel} · {item.docket}
                </CardDescription>
              </div>
              <Badge variant="outline">{item.jurisdiction}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-[0.95rem] leading-relaxed">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">Not Count II authority.</span>{' '}
                {item.relevance}
              </p>
              {item.summary.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              {item.quotes.map((quote) => (
                <blockquote
                  key={quote.text.slice(0, 40)}
                  className="border-l-2 border-primary/40 bg-muted/50 py-2 pl-4 italic text-muted-foreground"
                >
                  &ldquo;{quote.text}&rdquo;
                  <footer className="mt-1 text-xs font-normal not-italic text-muted-foreground/80">
                    — {quote.source}
                  </footer>
                </blockquote>
              ))}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" size="sm">
                <a href={item.url} target="_blank" rel="noreferrer noopener">
                  Read the full opinion on CourtListener <ExternalLink />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
