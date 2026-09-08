// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  EDGE_KINDS,
  GRAPH_EDGES,
  GRAPH_NODES,
  type EdgeKind,
  type GraphNode,
  type NodeKind,
} from './soulContract'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/**
 * The parties, the doughnut, and the term, as a force-directed web.
 *
 * `d3-force` runs the physics and nothing else — it never touches the DOM. The
 * simulation owns the numbers, React owns the SVG, and the tick handler is the
 * only bridge between them. That split is why this component can be dragged,
 * filtered, and re-rendered without the two libraries fighting over who holds
 * the element: d3 here is a math library that happens to ship in the same
 * ecosystem as a DOM library.
 *
 * Colors come from the theme's `--chart-*` series through `var()` in SVG
 * presentation attributes rather than from Tailwind classes. Utilities cannot
 * reach `fill` and `stroke` on arbitrary SVG children, and hardcoding hex here
 * would be the one place in the app that does not follow the theme into dark
 * mode.
 */

const WIDTH = 900
const HEIGHT = 520

/** Radius by kind. The instrument and the term are the largest — they are what the case is about. */
const RADIUS: Record<NodeKind, number> = {
  party: 30,
  instrument: 34,
  term: 28,
  witness: 21,
}

/** Fill per node kind, as token references rather than colors. */
const FILL: Record<NodeKind, string> = {
  party: 'var(--chart-1)',
  instrument: 'var(--chart-3)',
  term: 'var(--chart-2)',
  witness: 'var(--card)',
}

const LABEL_FILL: Record<NodeKind, string> = {
  party: 'var(--primary-foreground)',
  instrument: 'var(--warning-foreground)',
  term: 'var(--destructive-foreground)',
  witness: 'var(--foreground)',
}

const EDGE_STROKE: Record<EdgeKind, string> = {
  adverse: 'var(--chart-2)',
  instrument: 'var(--chart-3)',
  evidence: 'var(--chart-5)',
  family: 'var(--border)',
}

/** Adverse edges are heaviest; family ties are the quiet background structure. */
const EDGE_WIDTH: Record<EdgeKind, number> = {
  adverse: 2.4,
  instrument: 2.4,
  evidence: 1.4,
  family: 1.2,
}

const EDGE_DASH: Record<EdgeKind, string | undefined> = {
  adverse: undefined,
  instrument: undefined,
  evidence: '5 4',
  family: '2 4',
}

/**
 * Rest length per edge kind.
 *
 * The instrument is the shortest — it should read as sitting between the two
 * parties rather than off to one side — but not so short that the doughnut and
 * Dermot overlap, which is what a distance under about 140 produced.
 */
const EDGE_DISTANCE: Record<EdgeKind, number> = {
  adverse: 190,
  instrument: 150,
  evidence: 200,
  family: 110,
}

type SimNode = GraphNode & SimulationNodeDatum
type SimEdge = SimulationLinkDatum<SimNode> & { kind: EdgeKind; label: string }

/** A link once the simulation has swapped the string ids for node objects. */
interface ResolvedEdge extends SimEdge {
  source: SimNode
  target: SimNode
}

function isResolved(edge: SimEdge): edge is ResolvedEdge {
  return typeof edge.source === 'object' && typeof edge.target === 'object'
}

/**
 * Seed x by household so the two families settle on opposite sides.
 *
 * Without this the layout is correct but arbitrary — the Crullers and the
 * Prines interleave differently on every load, and a reader who looks twice
 * sees two unrelated pictures. Pinning the horizontal bias makes the shape
 * stable and, more usefully, makes "the doughnut sits between the households"
 * a thing the picture says rather than a coincidence.
 */
const HOUSEHOLD_X: Record<GraphNode['household'], number> = {
  cruller: WIDTH * 0.24,
  res: WIDTH * 0.5,
  prine: WIDTH * 0.76,
}

/**
 * Take or release pointer capture without letting it break the drag.
 *
 * `releasePointerCapture` throws `NotFoundError` when the given pointer is not
 * actually captured by the element, and the two sides of a drag do not always
 * agree that it is: the element can be re-rendered or removed between down and
 * up, and jsdom reports capture state it does not really hold. Neither call has
 * anything to say about whether the drag succeeded — capture is an optimization
 * that keeps events coming to this node once the pointer leaves it — so a
 * failure here should cost nothing.
 */
function capture(element: Element, pointerId: number, take: boolean) {
  try {
    if (take) element.setPointerCapture(pointerId)
    else if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId)
  } catch {
    // Capture is a nicety; the pointer handlers work without it.
  }
}

export interface RelationshipGraphProps {
  /** Currently selected node id, owned by the page so the detail pane can sit outside the SVG. */
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function RelationshipGraph({ selectedId, onSelect }: RelationshipGraphProps) {
  const [filter, setFilter] = useState<EdgeKind | 'all'>('all')
  const [hoverId, setHoverId] = useState<string | null>(null)
  /** Bumped on every simulation tick to pull fresh positions out of the mutable node objects. */
  const [, setTick] = useState(0)

  const svgRef = useRef<SVGSVGElement>(null)
  const simRef = useRef<Simulation<SimNode, SimEdge> | null>(null)

  /*
   * The simulation mutates these objects in place, so they must be created
   * once and never re-derived on render — a fresh copy each render would reset
   * every position to undefined and the graph would restart mid-drag.
   */
  const nodes = useMemo<SimNode[]>(
    () =>
      GRAPH_NODES.map((node) =>
        Object.assign({}, node, { x: HOUSEHOLD_X[node.household], y: HEIGHT / 2 }),
      ),
    [],
  )

  // Cloned, not shared: `forceLink` rewrites `source` and `target` from ids to
  // node objects in place, and doing that to the exported module constant would
  // corrupt it for every later reader.
  const edges = useMemo<SimEdge[]>(() => GRAPH_EDGES.map((edge) => Object.assign({}, edge)), [])

  useEffect(() => {
    const simulation = forceSimulation<SimNode, SimEdge>(nodes)
      .force(
        'link',
        forceLink<SimNode, SimEdge>(edges)
          .id((node) => node.id)
          .distance((edge) => EDGE_DISTANCE[edge.kind])
          .strength((edge) => (edge.kind === 'family' ? 0.75 : 0.35)),
      )
      .force('charge', forceManyBody<SimNode>().strength(-1150))
      // The margin covers the name drawn *below* each disc, not just the disc:
      // collision on the radius alone lets two labels sit on top of each other
      // while the circles are technically clear.
      .force('collide', forceCollide<SimNode>((node) => RADIUS[node.kind] + 30))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('household', forceX<SimNode>((node) => HOUSEHOLD_X[node.household]).strength(0.14))
      // Weak, so the web uses its full height instead of collapsing onto a line.
      .force('vertical', forceY<SimNode>(HEIGHT / 2).strength(0.04))
      .on('tick', () => setTick((n) => n + 1))

    simRef.current = simulation
    return () => {
      simulation.stop()
      simRef.current = null
    }
  }, [nodes, edges])

  /** Convert a pointer event to the SVG's own coordinate space, which is scaled by the viewBox. */
  const toSvgPoint = useCallback((event: React.PointerEvent): { x: number; y: number } | null => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent, node: SimNode) => {
      const point = toSvgPoint(event)
      if (!point) return
      capture(event.currentTarget, event.pointerId, true)
      // Reheat so the rest of the web reacts while this node is held.
      simRef.current?.alphaTarget(0.3).restart()
      node.fx = point.x
      node.fy = point.y
    },
    [toSvgPoint],
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent, node: SimNode) => {
      // Only a node currently pinned by a pointer-down is being dragged.
      if (typeof node.fx !== 'number') return
      const point = toSvgPoint(event)
      if (!point) return
      node.fx = point.x
      node.fy = point.y
    },
    [toSvgPoint],
  )

  const onPointerUp = useCallback((event: React.PointerEvent, node: SimNode) => {
    capture(event.currentTarget, event.pointerId, false)
    simRef.current?.alphaTarget(0)
    // Release the pin: the node rejoins the physics where the reader left it.
    node.fx = null
    node.fy = null
  }, [])

  const visibleEdges = useMemo(
    () => edges.filter((edge) => filter === 'all' || edge.kind === filter),
    [edges, filter],
  )

  /**
   * Ids one hop from whatever the reader is pointing at.
   *
   * Highlighting is computed from the *visible* edges rather than all of them,
   * so a filtered graph highlights what it is actually showing. Anything else
   * would dim a node for not being connected by an edge the reader just hid.
   */
  const focusId = hoverId ?? selectedId
  const neighbors = useMemo(() => {
    if (!focusId) return null
    const near = new Set<string>([focusId])
    for (const edge of visibleEdges) {
      const source = typeof edge.source === 'object' ? edge.source.id : String(edge.source)
      const target = typeof edge.target === 'object' ? edge.target.id : String(edge.target)
      if (source === focusId) near.add(target)
      if (target === focusId) near.add(source)
    }
    return near
  }, [focusId, visibleEdges])

  const dimmed = (id: string) => (neighbors && !neighbors.has(id) ? 0.16 : 1)

  return (
    <div>
      <div className="mb-4">
        <ToggleRow value={filter} onChange={setFilter} />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        role="group"
        aria-label="Relationship graph: parties, witnesses, the doughnut, and the concealed term"
        // `touch-none` matters: without it a drag on a phone scrolls the page
        // instead of moving the node.
        className="block touch-none rounded-lg border bg-muted"
      >
        <g>
          {visibleEdges.filter(isResolved).map((edge) => {
            const id = `${edge.source.id}-${edge.target.id}-${edge.kind}`
            const lit =
              !neighbors || (neighbors.has(edge.source.id) && neighbors.has(edge.target.id))
            return (
              <g key={id} opacity={lit ? 1 : 0.1}>
                <line
                  x1={edge.source.x}
                  y1={edge.source.y}
                  x2={edge.target.x}
                  y2={edge.target.y}
                  stroke={EDGE_STROKE[edge.kind]}
                  strokeWidth={EDGE_WIDTH[edge.kind]}
                  strokeDasharray={EDGE_DASH[edge.kind]}
                  strokeLinecap="round"
                />
                {/*
                 * Labelled only when the edge actually touches what the reader
                 * is pointing at. `lit` is broader than that — it includes
                 * edges *between* two neighbors — and labelling those crowds
                 * the middle of the graph with text about a relationship
                 * nobody asked about.
                 */}
                {edgeTouches(edge, focusId) ? (
                  <EdgeLabel edge={edge} />
                ) : null}
              </g>
            )
          })}
        </g>

        <g>
          {nodes.map((node) => {
            const radius = RADIUS[node.kind]
            const selected = selectedId === node.id
            return (
              <g
                key={node.id}
                transform={`translate(${node.x ?? 0} ${node.y ?? 0})`}
                opacity={dimmed(node.id)}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`${node.label} — ${node.role}`}
                style={{ cursor: 'grab', outline: 'none' }}
                onPointerDown={(event) => onPointerDown(event, node)}
                onPointerMove={(event) => onPointerMove(event, node)}
                onPointerUp={(event) => onPointerUp(event, node)}
                onPointerCancel={(event) => onPointerUp(event, node)}
                onClick={() => onSelect(selected ? null : node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(selected ? null : node.id)
                  }
                }}
                onMouseEnter={() => setHoverId(node.id)}
                onMouseLeave={() => setHoverId(null)}
                onFocus={() => setHoverId(node.id)}
                onBlur={() => setHoverId(null)}
              >
                {selected ? (
                  <circle
                    r={radius + 7}
                    fill="none"
                    stroke="var(--ring)"
                    strokeWidth="2.5"
                  />
                ) : null}
                <circle
                  r={radius}
                  fill={FILL[node.kind]}
                  stroke={
                    node.kind === 'witness' ? 'var(--border)' : 'var(--card)'
                  }
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  dy="0.36em"
                  fontSize={node.kind === 'witness' ? 11 : 13}
                  fontWeight="600"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill={LABEL_FILL[node.kind]}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.initials}
                </text>
                <text
                  textAnchor="middle"
                  y={radius + 16}
                  fontSize="12.5"
                  fontWeight={node.kind === 'witness' ? 400 : 600}
                  fill="var(--foreground)"
                  style={{
                    paintOrder: 'stroke',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                  stroke="var(--muted)"
                  strokeWidth="3.5"
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      <Legend />
    </div>
  )
}

function edgeTouches(edge: ResolvedEdge, focusId: string | null): boolean {
  return focusId !== null && (edge.source.id === focusId || edge.target.id === focusId)
}

/**
 * An edge's label, nudged off the line rather than sitting on it.
 *
 * Six edges meet at the doughnut, so their midpoints converge; offsetting each
 * label along the edge's own normal fans them apart. The halo is a fat stroke
 * under the fill (`paintOrder: stroke`) so the text stays legible where it
 * crosses another line.
 */
function EdgeLabel({ edge }: { edge: ResolvedEdge }) {
  const x1 = edge.source.x ?? 0
  const y1 = edge.source.y ?? 0
  const x2 = edge.target.x ?? 0
  const y2 = edge.target.y ?? 0
  const length = Math.hypot(x2 - x1, y2 - y1) || 1
  // Unit normal to the edge, times the offset.
  const nx = (-(y2 - y1) / length) * 9
  const ny = ((x2 - x1) / length) * 9

  return (
    <text
      x={(x1 + x2) / 2 + nx}
      y={(y1 + y2) / 2 + ny}
      textAnchor="middle"
      dy="0.32em"
      fontSize="10.5"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      fill="var(--muted-foreground)"
      style={{ paintOrder: 'stroke', pointerEvents: 'none', userSelect: 'none' }}
      stroke="var(--muted)"
      strokeWidth="4"
    >
      {edge.label}
    </text>
  )
}

function ToggleRow({
  value,
  onChange,
}: {
  value: EdgeKind | 'all'
  onChange: (value: EdgeKind | 'all') => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      // Radix reports `''` when the pressed item is pressed again. A filter
      // with nothing selected would show an empty canvas, so an unset falls
      // back to showing everything.
      onValueChange={(next) => onChange((next || 'all') as EdgeKind | 'all')}
      aria-label="Filter the graph by relationship type"
    >
      {EDGE_KINDS.map((kind) => (
        <ToggleGroupItem key={kind.value} value={kind.value}>
          {kind.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

const LEGEND: { label: string; stroke: string; dash?: string }[] = [
  { label: 'Adverse', stroke: EDGE_STROKE.adverse },
  { label: 'Instrument', stroke: EDGE_STROKE.instrument },
  { label: 'Evidence', stroke: EDGE_STROKE.evidence, dash: EDGE_DASH.evidence },
  { label: 'Family', stroke: EDGE_STROKE.family, dash: EDGE_DASH.family },
]

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {LEGEND.map((entry) => (
        <span key={entry.label} className="inline-flex items-center gap-1.5">
          <svg width="22" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="22"
              y2="4"
              stroke={entry.stroke}
              strokeWidth="2.4"
              strokeDasharray={entry.dash}
            />
          </svg>
          {entry.label}
        </span>
      ))}
      <span>Drag a node · click to pin its detail</span>
    </div>
  )
}
