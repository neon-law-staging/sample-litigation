// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { markdown } from '@codemirror/lang-markdown'
import { yaml } from '@codemirror/lang-yaml'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'

/**
 * A CodeMirror pane, themed off this bundle's own CSS variables rather than
 * one of CodeMirror's bundled themes.
 *
 * A packaged theme (`@uiw/codemirror-theme-*` and the like) ships a fixed
 * light palette and a fixed dark one, and following the system would mean
 * picking between them in script — a second mechanism next to the
 * `prefers-color-scheme` query navigator-ux's tokens already answer to. Every
 * color below is a `var(--color-*)` from `index.css` instead, so the editor
 * re-tones the moment the alias does, the same way the rest of the app does.
 */
const theme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--color-muted)',
    color: 'var(--color-foreground)',
    fontSize: '0.8rem',
  },
  '.cm-content': {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    padding: '0.75rem 0',
    caretColor: 'var(--color-primary)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--color-muted)',
    color: 'var(--color-muted-foreground)',
    border: 'none',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
  },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-foreground)' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--color-primary)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
  },
  '.cm-scroller': { overflow: 'auto' },
})

const highlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--color-primary)', fontWeight: 700 },
  { tag: tags.strong, fontWeight: 700 },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: [tags.keyword, tags.definitionKeyword, tags.propertyName], color: 'var(--color-primary)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--color-success)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--color-warning-foreground)' },
  { tag: tags.comment, color: 'var(--color-muted-foreground)', fontStyle: 'italic' },
  { tag: tags.link, color: 'var(--color-primary)', textDecoration: 'underline' },
  { tag: tags.monospace, color: 'var(--color-foreground)' },
  { tag: tags.meta, color: 'var(--color-muted-foreground)' },
])

interface NotationEditorProps {
  value: string
  onChange: (value: string) => void
  language: 'yaml' | 'markdown'
  label: string
}

/** CodeMirror (MIT-licensed), bundled from npm rather than pulled from a CDN — the portal CSP is `script-src 'self'`. */
export function NotationEditor({ value, onChange, language, label }: NotationEditorProps) {
  const extensions = useMemo(
    () => [language === 'yaml' ? yaml() : markdown(), theme, syntaxHighlighting(highlightStyle)],
    [language],
  )

  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        basicSetup={{ foldGutter: false, highlightSelectionMatches: false }}
        className="overflow-hidden rounded-lg border text-sm"
      />
    </div>
  )
}
