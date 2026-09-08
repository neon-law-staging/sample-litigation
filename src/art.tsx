// Copyright (C) 2026 Shook Law PLLC.
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Original illustrations for Count II.
 *
 * Drawn here rather than fetched, for two reasons that happen to agree. The
 * legal one: the characters this fixture alludes to are somebody's, and a
 * sample application that ships scraped frames of them teaches a contributor
 * the wrong habit. The architectural one: Navigator serves this bundle under
 * `script-src 'self'` with no off-origin sources, and the library stylesheet is
 * built to fetch nothing at runtime — a hotlinked image would be the only thing
 * in the bundle that could fail because of somebody else's server.
 *
 * So these are silhouettes and shapes: a horned figure over a hedge, a round
 * one reaching, and a doughnut with something in it. Every fill is a theme
 * variable or a gradient built from one, which is what lets them follow the
 * portal into dark mode with no second copy. The warm and cool pair they are
 * drawn from is `--art-*` in `src/index.css` rather than the `--chart-*` graph
 * series they used to borrow, so re-ordering the series cannot recolor a
 * drawing that means something by warm.
 */

/** Bite state, which is the whole chronology in one enum. */
export type BiteState = 'whole' | 'bitten' | 'gone'

/** Sprinkle placements, chosen so none of them land in the hole or on the bite. */
const SPRINKLES: { x: number; y: number; rotate: number; warm: boolean }[] = [
  { x: 70, y: 58, rotate: -30, warm: true },
  { x: 124, y: 62, rotate: 20, warm: false },
  { x: 58, y: 118, rotate: 55, warm: false },
  { x: 136, y: 126, rotate: -15, warm: true },
  { x: 100, y: 44, rotate: 5, warm: false },
  { x: 46, y: 88, rotate: 70, warm: false },
  { x: 150, y: 92, rotate: -50, warm: true },
  { x: 96, y: 158, rotate: 10, warm: false },
  { x: 66, y: 148, rotate: -35, warm: false },
  { x: 132, y: 156, rotate: 40, warm: true },
]

/**
 * The hedge scene: the offer, as pleaded.
 *
 * `aria-hidden` is deliberate — the caption beneath it in the page carries the
 * same content as text, and a screen reader should hear that once.
 */
export function HedgeScene() {
  return (
    <svg
      viewBox="0 0 800 300"
      width="100%"
      aria-hidden="true"
      style={{ display: 'block', borderRadius: 'var(--radius)' }}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--muted)" />
          <stop offset="55%" stopColor="color-mix(in oklch, var(--art-dough) 16%, var(--background))" />
          <stop offset="100%" stopColor="color-mix(in oklch, var(--art-warm) 14%, var(--background))" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--art-dough)" stopOpacity="0.85" />
          <stop offset="60%" stopColor="var(--art-dough)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--art-dough)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="800" height="300" fill="url(#sky)" />

      {/* A low sun behind the defendant, because the pleading says so. */}
      <circle cx="655" cy="120" r="58" fill="var(--art-dough)" opacity="0.28" />

      {/* Plaintiff: round, unsuspecting, reaching. */}
      <g fill="var(--foreground)" opacity="0.86">
        <circle cx="205" cy="132" r="41" />
        <path d="M164 300 v-96 a41 41 0 0 1 82 0 v96 z" />
        {/* The reaching arm. */}
        <path
          d="M243 186 q54 -12 88 -30"
          stroke="var(--foreground)"
          strokeWidth="15"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Defendant: taller, horned, extending the instrument. */}
      <g fill="var(--art-warm)">
        <circle cx="600" cy="118" r="38" />
        {/* Horns. */}
        <path d="M572 90 q-16 -26 -3 -44 q13 14 22 32 z" />
        <path d="M628 90 q16 -26 3 -44 q-13 14 -22 32 z" />
        <path d="M562 300 v-108 a38 38 0 0 1 76 0 v108 z" />
        <path
          d="M566 178 q-56 -6 -96 12"
          stroke="var(--art-warm)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* The doughnut, mid-air, mid-offer. */}
      <g transform="translate(400 186)">
        <circle r="72" fill="url(#glow)" />
        <circle r="34" fill="var(--art-dough)" stroke="var(--foreground)" strokeWidth="3" />
        <circle r="12" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2.5" />
      </g>

      {/* The hedge, which is where every neighborly conversation in this matter happens. */}
      <g fill="var(--art-figure)">
        <rect y="228" width="800" height="72" opacity="0.9" />
        {[...Array(21).keys()].map((i) => (
          <circle key={i} cx={i * 40 + 10} cy="230" r="24" opacity="0.9" />
        ))}
      </g>
      <rect y="228" width="800" height="4" fill="var(--foreground)" opacity="0.14" />
    </svg>
  )
}

/**
 * The instrument itself, in whatever state the reader has scrubbed it to.
 *
 * The `§` at the center is the concealed term — visible to us because we are
 * reading the pleading, and not to the offeree, which is the entire count.
 */
export function Doughnut({ state = 'whole', size = 200 }: { state?: BiteState; size?: number }) {
  const gone = state === 'gone'
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={
        gone
          ? 'The doughnut, fully consumed'
          : state === 'bitten'
            ? 'The doughnut with a single bite taken from it'
            : 'The doughnut, whole'
      }
      style={{ display: 'block' }}
    >
      <defs>
        {/*
         * The bite is a mask, not a path edit: the same dough and the same
         * glaze are drawn in every state, and only what shows through changes.
         * One shape to maintain instead of three.
         */}
        <mask id="bite-mask">
          <rect width="200" height="200" fill="white" />
          {state === 'bitten' ? <circle cx="163" cy="52" r="34" fill="black" /> : null}
          {gone ? <rect width="200" height="200" fill="black" /> : null}
        </mask>
      </defs>

      {/* Where the doughnut was — always drawn, so "gone" reads as absence rather than a blank box. */}
      <circle
        cx="100"
        cy="100"
        r="76"
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
        strokeDasharray="6 6"
      />

      <g mask="url(#bite-mask)">
        <circle cx="100" cy="100" r="76" fill="var(--art-dough)" opacity="0.55" />
        <circle
          cx="100"
          cy="100"
          r="66"
          fill="var(--art-dough)"
          stroke="var(--foreground)"
          strokeWidth="2.5"
          opacity="0.95"
        />
        <circle
          cx="100"
          cy="100"
          r="24"
          fill="var(--card)"
          stroke="var(--foreground)"
          strokeWidth="2.5"
        />
        {/* Sprinkles, placed by hand so they never land in the hole. */}
        {SPRINKLES.map((sprinkle) => (
          <rect
            key={`${sprinkle.x}-${sprinkle.y}`}
            x={sprinkle.x - 6}
            y={sprinkle.y - 2}
            width="12"
            height="4"
            rx="2"
            transform={`rotate(${sprinkle.rotate} ${sprinkle.x} ${sprinkle.y})`}
            fill={sprinkle.warm ? 'var(--art-warm)' : 'var(--art-cool)'}
          />
        ))}
      </g>

      {/* The concealed term, sitting in the hole where nobody eating would look. */}
      <text
        x="100"
        y="100"
        textAnchor="middle"
        dy="0.35em"
        fontSize="26"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontWeight="700"
        fill="var(--art-warm)"
        opacity={gone ? 1 : 0.85}
      >
        §
      </text>
    </svg>
  )
}

/**
 * The examination, as a room.
 *
 * The witness keeps the round, plain silhouette the plaintiff has in
 * `HedgeScene`, and the examiner keeps the defendant's warm one, so a reader
 * who has seen the hedge already knows who is who before reading a caption. The
 * ids in `defs` are prefixed because both scenes can render in one document and
 * an SVG id is global to the page — two `#glow`s and the second one wins.
 */
export function CrossExaminationScene() {
  return (
    <svg
      viewBox="0 0 800 280"
      width="100%"
      aria-hidden="true"
      style={{ display: 'block', borderRadius: 'var(--radius)' }}
    >
      <defs>
        <linearGradient id="prep-room" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--muted)" />
          <stop offset="60%" stopColor="var(--background)" />
          <stop offset="100%" stopColor="color-mix(in oklch, var(--art-warm) 12%, var(--background))" />
        </linearGradient>
      </defs>

      <rect width="800" height="280" fill="url(#prep-room)" />

      {/* The rail. Everything in the room is arranged against this line. */}
      <rect y="236" width="800" height="4" fill="var(--foreground)" opacity="0.14" />

      {/* The witness box, and the witness in it. */}
      <g>
        <g fill="var(--foreground)" opacity="0.86">
          <circle cx="196" cy="94" r="34" />
          <path d="M162 236 v-84 a34 34 0 0 1 68 0 v84 z" />
        </g>
        <rect x="118" y="168" width="156" height="68" rx="4" fill="var(--card)" stroke="var(--foreground)" strokeWidth="3" />
        <rect x="118" y="168" width="156" height="10" rx="4" fill="var(--foreground)" opacity="0.16" />
      </g>

      {/* The examiner, at the lectern, mid-question. */}
      <g fill="var(--art-warm)">
        <circle cx="612" cy="86" r="32" />
        <path d="M580 236 v-96 a32 32 0 0 1 64 0 v96 z" />
        {/* The pointing arm, which is what a cross-examination looks like from the box. */}
        <path
          d="M584 156 q-58 -10 -104 -6"
          stroke="var(--art-warm)"
          strokeWidth="13"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <path d="M648 236 v-58 h84 l14 58 z" fill="var(--card)" stroke="var(--art-warm)" strokeWidth="3" />

      {/* Three questions on the way over, the nearest one loudest. */}
      <g
        fill="var(--art-warm)"
        fontFamily="ui-serif, Georgia, serif"
        fontWeight="700"
        textAnchor="middle"
      >
        <text x="470" y="120" fontSize="46" opacity="0.85">?</text>
        <text x="404" y="98" fontSize="34" opacity="0.55">?</text>
        <text x="350" y="82" fontSize="24" opacity="0.3">?</text>
      </g>

      {/* The transcript, which is the only thing that leaves the room. */}
      <g opacity="0.5">
        <rect x="300" y="196" width="196" height="40" rx="3" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2" />
        {[0, 1, 2].map((line) => (
          <rect
            key={line}
            x="312"
            y={206 + line * 9}
            width={line === 2 ? 104 : 172}
            height="4"
            rx="2"
            fill="var(--foreground)"
            opacity="0.35"
          />
        ))}
      </g>
    </svg>
  )
}

/**
 * A small drawing per topic, for the face of a card.
 *
 * These are marks rather than pictures: at 64 pixels a scene is mud, so each is
 * three or four shapes that read at a glance and carry the same warm/cool pair
 * as everything else in this file. They are `aria-hidden` because the topic is
 * always written beside them — a card whose subject is legible only as a
 * drawing is a card a screen reader cannot sort.
 */
export type Vignette =
  | 'formation'
  | 'aspect'
  | 'concealment'
  | 'knowledge'
  | 'ratification'
  | 'records'
  | 'damages'

function VignetteBody({ topic }: { topic: Vignette }) {
  switch (topic) {
    case 'formation':
      // The offer over the hedge: a ring changing hands above the greenery.
      return (
        <>
          <circle cx="50" cy="34" r="17" fill="none" stroke="var(--art-dough)" strokeWidth="9" />
          <rect x="6" y="60" width="88" height="28" rx="6" fill="var(--art-figure)" opacity="0.9" />
          <circle cx="22" cy="60" r="12" fill="var(--art-figure)" opacity="0.9" />
          <circle cx="50" cy="60" r="12" fill="var(--art-figure)" opacity="0.9" />
          <circle cx="78" cy="60" r="12" fill="var(--art-figure)" opacity="0.9" />
        </>
      )
    case 'aspect':
      // The horned aspect, denied under oath — and the sweater he says he wore.
      return (
        <>
          <path d="M32 30 q-10 -18 -1 -30 q9 10 15 22 z" fill="var(--art-warm)" />
          <path d="M68 30 q10 -18 1 -30 q-9 10 -15 22 z" fill="var(--art-warm)" />
          <circle cx="50" cy="38" r="20" fill="var(--art-warm)" />
          <path d="M24 92 v-24 a26 26 0 0 1 52 0 v24 z" fill="var(--art-warm)" opacity="0.5" />
        </>
      )
    case 'concealment':
      // The term, under the glaze: readable here because we are reading the pleading.
      return (
        <>
          <circle cx="50" cy="50" r="34" fill="var(--art-dough)" opacity="0.55" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="var(--foreground)" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="13" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2.5" />
          <text
            x="50"
            y="50"
            dy="0.35em"
            textAnchor="middle"
            fontSize="17"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontWeight="700"
            fill="var(--art-warm)"
          >
            §
          </text>
        </>
      )
    case 'knowledge':
      // One day on a calendar, which in this count is the whole case.
      return (
        <>
          <rect x="14" y="20" width="72" height="66" rx="6" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2.5" />
          <rect x="14" y="20" width="72" height="16" rx="6" fill="var(--art-cool)" />
          <rect x="30" y="12" width="6" height="16" rx="3" fill="var(--foreground)" />
          <rect x="64" y="12" width="6" height="16" rx="3" fill="var(--foreground)" />
          <circle cx="50" cy="62" r="15" fill="var(--art-warm)" opacity="0.85" />
        </>
      )
    case 'ratification':
      // The year in the refrigerator: a ring with a bite gone, and the gap drawn round it.
      return (
        <>
          <path
            d="M50 12 a38 38 0 1 1 -26 66"
            fill="none"
            stroke="var(--art-cool)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="7 7"
          />
          <circle cx="50" cy="52" r="24" fill="var(--art-dough)" opacity="0.6" />
          <circle cx="50" cy="52" r="24" fill="none" stroke="var(--foreground)" strokeWidth="2.5" />
          <circle cx="50" cy="52" r="9" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2.5" />
          <circle cx="70" cy="34" r="13" fill="var(--background)" />
        </>
      )
    case 'records':
      // Odile's notebook, dated and not to be tidied.
      return (
        <>
          <rect x="22" y="14" width="60" height="74" rx="4" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2.5" />
          <rect x="22" y="14" width="10" height="74" fill="var(--art-cool)" opacity="0.7" />
          {[0, 1, 2, 3].map((line) => (
            <rect
              key={line}
              x="40"
              y={30 + line * 14}
              width={line === 3 ? 22 : 32}
              height="4"
              rx="2"
              fill="var(--foreground)"
              opacity="0.45"
            />
          ))}
          {[0, 1, 2].map((ring) => (
            <circle key={ring} cx="27" cy={30 + ring * 22} r="3.5" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.5" />
          ))}
        </>
      )
    case 'damages':
      // The relief actually sought: a balance, with nothing in either pan.
      return (
        <>
          <rect x="47" y="20" width="6" height="62" rx="3" fill="var(--foreground)" opacity="0.8" />
          <rect x="18" y="26" width="64" height="5" rx="2.5" fill="var(--foreground)" opacity="0.8" />
          <rect x="30" y="82" width="40" height="6" rx="3" fill="var(--foreground)" opacity="0.8" />
          <path d="M12 34 h24 l-12 20 z" fill="var(--art-cool)" opacity="0.8" />
          <path d="M64 34 h24 l-12 20 z" fill="var(--art-warm)" opacity="0.8" />
        </>
      )
  }
}

/** One vignette, sized by the caller. `size` is both dimensions — they are square. */
export function TopicVignette({ topic, size = 64 }: { topic: Vignette; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ display: 'block' }}>
      <VignetteBody topic={topic} />
    </svg>
  )
}
