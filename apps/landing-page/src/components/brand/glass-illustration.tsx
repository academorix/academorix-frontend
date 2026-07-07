/**
 * @file glass-illustration.tsx
 * @module components/brand/glass-illustration
 *
 * @description
 * Per-slug decorative SVG illustration used on marketing surfaces
 * (bento tiles, feature hero cards). The compositions are inspired
 * by technical-drawing / isometric marketing sites (Raycast, Linear,
 * Vercel): a stack of translucent rounded rectangles, a scatter of
 * accent dots, and a couple of straight reference lines to suggest a
 * schematic.
 *
 * ## Design language
 *
 * - **Palette**: `currentColor` for outlines / neutral fills, and
 *   `var(--accent)` for the accent shape in each composition. Both
 *   sit on the parent's translucent background, so the illustration
 *   reads on any surface without a hard-coded colour.
 * - **Stroke**: `stroke-width="1"` on outlines, `vector-effect="non-
 *   scaling-stroke"` so the stroke stays crisp when the SVG is CSS-
 *   scaled.
 * - **Viewbox**: 320 x 200 for a landscape-friendly aspect ratio.
 * - **No text inside the SVG** — captions (`FIG. 01`) live in HTML
 *   sibling nodes so screen readers announce them separately from
 *   the decorative graphic.
 *
 * ## Slug routing
 *
 * `SLUG_TO_VARIANT` maps every known product / sport / persona slug
 * to a variant. Unknown slugs fall back to `"schema"` (a generic
 * layered card composition). Add new mappings here when a new slug
 * lands in `products.json` / `sports.json`.
 *
 * ## Accessibility
 *
 * The illustration is purely decorative. It renders `aria-hidden`
 * and never carries a `role="img"`. The parent card supplies its
 * own accessible name via the surrounding heading + description.
 */

import clsx from "clsx";

import type { ReactNode } from "react";

/** Every distinct illustration composition. */
export type IllustrationVariant =
  | "roster"
  | "team"
  | "calendar"
  | "receipt"
  | "chart"
  | "pie"
  | "trophy"
  | "wave"
  | "belt"
  | "target"
  | "route"
  | "schema";

/** Slug → variant lookup. Unknown slugs fall back to `"schema"`. */
const SLUG_TO_VARIANT: Record<string, IllustrationVariant> = {
  // ─── Products ──────────────────────────────────────────────────
  athletes: "roster",
  teams: "team",
  scheduling: "calendar",
  attendance: "calendar",
  payments: "receipt",
  memberships: "receipt",
  performance: "chart",
  progress: "chart",
  reports: "pie",
  communications: "schema",
  documents: "schema",
  "attribute-engine": "schema",
  // ─── Sports ────────────────────────────────────────────────────
  football: "trophy",
  swimming: "wave",
  basketball: "trophy",
  tennis: "target",
  "martial-arts": "belt",
  gymnastics: "wave",
  volleyball: "trophy",
  padel: "target",
  athletics: "route",
  // ─── Enterprise / solutions ────────────────────────────────────
  security: "schema",
  compliance: "schema",
  onboarding: "route",
  contracts: "receipt",
  observability: "chart",
  "multi-branch": "team",
  "bilingual-rtl": "schema",
};

/**
 * Resolve a slug to its illustration variant. Public so the bento
 * card wrapper can compose the variant with additional styling
 * without needing to know the variant name.
 */
export function resolveIllustrationVariant(slug: string | undefined): IllustrationVariant {
  if (!slug) return "schema";

  return SLUG_TO_VARIANT[slug] ?? "schema";
}

/** Props for {@link GlassIllustration}. */
export interface GlassIllustrationProps {
  /** Content slug (e.g. `"athletes"`). Falls back to `"schema"`. */
  slug?: string;
  /** Force a specific variant (bypasses `slug` lookup). */
  variant?: IllustrationVariant;
  /** Tailwind classes for the outer SVG (usually sizing + colouring). */
  className?: string;
}

/**
 * Decorative SVG dispatcher. Picks a variant based on `slug`
 * (unless `variant` is passed explicitly) and delegates to the
 * per-variant renderer.
 */
export function GlassIllustration({ slug, variant, className }: GlassIllustrationProps) {
  const resolved = variant ?? resolveIllustrationVariant(slug);

  return (
    <svg
      aria-hidden
      className={clsx("text-foreground/70 select-none", className)}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 320 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderVariant(resolved)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Variants
// ═══════════════════════════════════════════════════════════════════

function renderVariant(variant: IllustrationVariant): ReactNode {
  switch (variant) {
    case "roster":
      return <RosterVariant />;
    case "team":
      return <TeamVariant />;
    case "calendar":
      return <CalendarVariant />;
    case "receipt":
      return <ReceiptVariant />;
    case "chart":
      return <ChartVariant />;
    case "pie":
      return <PieVariant />;
    case "trophy":
      return <TrophyVariant />;
    case "wave":
      return <WaveVariant />;
    case "belt":
      return <BeltVariant />;
    case "target":
      return <TargetVariant />;
    case "route":
      return <RouteVariant />;
    case "schema":
    default:
      return <SchemaVariant />;
  }
}

// ─── Shared subprimitives ──────────────────────────────────────────

/** Faint dot-grid backdrop shared by every variant. */
function DotBackdrop() {
  return (
    <g opacity="0.25">
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 14 }).map((__, col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 22}
            cy={20 + row * 22}
            fill="currentColor"
            r="0.7"
          />
        )),
      )}
    </g>
  );
}

/** Cross-hair reference marks in the far corners. */
function CornerCrosshairs() {
  return (
    <g opacity="0.4" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke">
      {/* top-left */}
      <path d="M 10 4 L 10 14 M 4 10 L 14 10" />
      {/* top-right */}
      <path d="M 310 4 L 310 14 M 304 10 L 314 10" />
      {/* bottom-left */}
      <path d="M 10 186 L 10 196 M 4 190 L 14 190" />
      {/* bottom-right */}
      <path d="M 310 186 L 310 196 M 304 190 L 314 190" />
    </g>
  );
}

// ─── Variant renderers ─────────────────────────────────────────────

/** Athletes / roster: stack of profile cards. */
function RosterVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      {/* Card 3 (back) */}
      <rect
        fill="currentColor"
        height="80"
        opacity="0.08"
        rx="10"
        stroke="currentColor"
        strokeOpacity="0.4"
        vectorEffect="non-scaling-stroke"
        width="200"
        x="70"
        y="50"
      />
      {/* Card 2 (middle) */}
      <rect
        fill="currentColor"
        height="80"
        opacity="0.12"
        rx="10"
        stroke="currentColor"
        strokeOpacity="0.5"
        vectorEffect="non-scaling-stroke"
        width="200"
        x="60"
        y="60"
      />
      {/* Card 1 (front, with accent avatar) */}
      <g>
        <rect
          fill="currentColor"
          height="80"
          opacity="0.18"
          rx="10"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
          width="200"
          x="50"
          y="70"
        />
        <circle cx="80" cy="110" fill="var(--accent)" r="14" />
        <rect fill="currentColor" height="6" opacity="0.6" rx="3" width="80" x="104" y="98" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="120" x="104" y="112" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="100" x="104" y="122" />
      </g>
    </g>
  );
}

/** Teams: overlapping avatars in a diamond grouping. */
function TeamVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      <g transform="translate(160, 100)">
        <circle cx="0" cy="-30" fill="var(--accent)" opacity="0.9" r="18" />
        <circle cx="-32" cy="20" fill="currentColor" opacity="0.35" r="18" />
        <circle cx="32" cy="20" fill="currentColor" opacity="0.35" r="18" />
        <circle cx="-64" cy="-10" fill="currentColor" opacity="0.2" r="14" />
        <circle cx="64" cy="-10" fill="currentColor" opacity="0.2" r="14" />
        <circle cx="0" cy="50" fill="currentColor" opacity="0.15" r="12" />
      </g>
      <line
        opacity="0.3"
        stroke="currentColor"
        strokeDasharray="2 4"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        x1="20"
        x2="300"
        y1="100"
        y2="100"
      />
    </g>
  );
}

/** Scheduling: mini week-view calendar with a highlighted day. */
function CalendarVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      <rect
        fill="currentColor"
        height="112"
        opacity="0.1"
        rx="10"
        stroke="currentColor"
        strokeOpacity="0.4"
        vectorEffect="non-scaling-stroke"
        width="220"
        x="50"
        y="44"
      />
      {/* header bar */}
      <rect fill="currentColor" height="16" opacity="0.25" rx="4" width="220" x="50" y="44" />
      {/* Week grid */}
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i}>
          <rect
            fill="currentColor"
            height="8"
            opacity="0.35"
            rx="2"
            width="16"
            x={62 + i * 30}
            y="70"
          />
          {Array.from({ length: 3 }).map((__, r) => (
            <rect
              key={`${i}-${r}`}
              fill={i === 3 && r === 1 ? "var(--accent)" : "currentColor"}
              height="14"
              opacity={i === 3 && r === 1 ? "1" : "0.15"}
              rx="3"
              width="18"
              x={61 + i * 30}
              y={90 + r * 20}
            />
          ))}
        </g>
      ))}
    </g>
  );
}

/** Payments: stacked receipt / invoice cards. */
function ReceiptVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      {/* back card */}
      <rect
        fill="currentColor"
        height="120"
        opacity="0.08"
        rx="10"
        stroke="currentColor"
        strokeOpacity="0.35"
        vectorEffect="non-scaling-stroke"
        width="120"
        x="120"
        y="30"
      />
      {/* main receipt */}
      <g transform="translate(70, 40)">
        <rect
          fill="currentColor"
          height="120"
          opacity="0.16"
          rx="10"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
          width="120"
        />
        <rect fill="var(--accent)" height="6" rx="3" width="60" x="10" y="12" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="100" x="10" y="30" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="80" x="10" y="42" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="90" x="10" y="54" />
        <line
          opacity="0.4"
          stroke="currentColor"
          strokeDasharray="2 3"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1="10"
          x2="110"
          y1="72"
          y2="72"
        />
        <rect fill="currentColor" height="6" opacity="0.7" rx="2" width="40" x="10" y="82" />
        <rect fill="var(--accent)" height="6" opacity="0.9" rx="2" width="30" x="80" y="82" />
        <rect
          fill="currentColor"
          height="18"
          opacity="0.2"
          rx="4"
          stroke="var(--accent)"
          vectorEffect="non-scaling-stroke"
          width="100"
          x="10"
          y="94"
        />
      </g>
    </g>
  );
}

/** Performance: bar chart with accent tallest bar. */
function ChartVariant() {
  const bars = [24, 40, 32, 56, 48, 72, 60];

  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      {/* Axes */}
      <line
        opacity="0.35"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        x1="50"
        x2="270"
        y1="160"
        y2="160"
      />
      <line
        opacity="0.35"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        x1="50"
        x2="50"
        y1="40"
        y2="160"
      />
      {bars.map((h, i) => (
        <rect
          key={i}
          fill={i === 5 ? "var(--accent)" : "currentColor"}
          height={h}
          opacity={i === 5 ? "1" : "0.3"}
          rx="3"
          width="20"
          x={60 + i * 30}
          y={160 - h}
        />
      ))}
      {/* Trend line */}
      <path
        d="M 70 136 L 100 120 L 130 128 L 160 104 L 190 112 L 220 88 L 250 100"
        opacity="0.6"
        stroke="var(--accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/** Reports: pie / donut chart with accent slice. */
function PieVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      <g transform="translate(160, 100)">
        <circle cx="0" cy="0" fill="currentColor" opacity="0.12" r="60" />
        <circle
          cx="0"
          cy="0"
          fill="none"
          opacity="0.4"
          r="60"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {/* Accent slice — from angle 0 to -120 (240deg fill) */}
        <path d="M 0 0 L 60 0 A 60 60 0 0 0 -30 -51.96 Z" fill="var(--accent)" opacity="0.95" />
        <circle cx="0" cy="0" fill="var(--background)" r="26" />
        {/* Center label lines */}
        <rect fill="currentColor" height="4" opacity="0.6" rx="2" width="28" x="-14" y="-6" />
        <rect fill="currentColor" height="3" opacity="0.35" rx="1.5" width="20" x="-10" y="4" />
      </g>
      {/* Legend */}
      <g transform="translate(30, 30)">
        <rect fill="var(--accent)" height="8" rx="2" width="8" x="0" y="0" />
        <rect fill="currentColor" height="4" opacity="0.5" rx="2" width="34" x="14" y="2" />
        <rect fill="currentColor" height="8" opacity="0.4" rx="2" width="8" x="0" y="14" />
        <rect fill="currentColor" height="4" opacity="0.3" rx="2" width="28" x="14" y="16" />
      </g>
    </g>
  );
}

/** Sports: trophy silhouette on a plinth. */
function TrophyVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      <g transform="translate(160, 100)">
        {/* handles */}
        <path
          d="M -40 -30 Q -60 -30 -60 -10 Q -60 10 -40 10"
          fill="none"
          opacity="0.5"
          stroke="currentColor"
          strokeWidth="6"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 40 -30 Q 60 -30 60 -10 Q 60 10 40 10"
          fill="none"
          opacity="0.5"
          stroke="currentColor"
          strokeWidth="6"
          vectorEffect="non-scaling-stroke"
        />
        {/* cup */}
        <path
          d="M -40 -40 L 40 -40 L 36 20 Q 34 32 20 34 L -20 34 Q -34 32 -36 20 Z"
          fill="var(--accent)"
          opacity="0.95"
        />
        {/* stem */}
        <rect fill="currentColor" height="12" opacity="0.6" rx="2" width="20" x="-10" y="34" />
        {/* base */}
        <rect
          fill="currentColor"
          height="8"
          opacity="0.8"
          rx="3"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
          width="60"
          x="-30"
          y="46"
        />
        {/* star */}
        <path
          d="M 0 -25 L 3 -15 L 13 -15 L 5 -9 L 8 1 L 0 -5 L -8 1 L -5 -9 L -13 -15 L -3 -15 Z"
          fill="var(--background)"
          opacity="0.9"
        />
      </g>
    </g>
  );
}

/** Sports (fluid): wave lines evoking swimming / gymnastics. */
function WaveVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      {Array.from({ length: 5 }).map((_, i) => (
        <path
          key={i}
          d={`M 20 ${60 + i * 20} Q 80 ${40 + i * 20} 160 ${60 + i * 20} T 300 ${60 + i * 20}`}
          fill="none"
          opacity={0.15 + i * 0.15}
          stroke={i === 2 ? "var(--accent)" : "currentColor"}
          strokeWidth={i === 2 ? "2.5" : "1.5"}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <circle cx="240" cy="100" fill="var(--accent)" r="6" />
    </g>
  );
}

/** Martial arts: horizontal belt with a knot and grading pips. */
function BeltVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      {/* belt */}
      <rect
        fill="currentColor"
        height="32"
        opacity="0.25"
        rx="4"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        width="240"
        x="40"
        y="84"
      />
      {/* accent tip */}
      <rect fill="var(--accent)" height="32" rx="4" width="40" x="240" y="84" />
      {/* knot */}
      <rect
        fill="currentColor"
        height="48"
        opacity="0.55"
        rx="4"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
        width="24"
        x="150"
        y="76"
      />
      {/* grading pips */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={60 + i * 16} cy="100" fill="var(--background)" opacity="0.7" r="3" />
      ))}
    </g>
  );
}

/** Racket sports: concentric target rings with an accent bullseye. */
function TargetVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      <g transform="translate(160, 100)">
        {[70, 56, 42, 28, 14].map((r, i) => (
          <circle
            key={r}
            cx="0"
            cy="0"
            fill={i === 4 ? "var(--accent)" : "currentColor"}
            opacity={i === 4 ? "1" : 0.08 + i * 0.04}
            r={r}
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {/* Crosshair */}
        <line
          opacity="0.4"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1="-80"
          x2="80"
          y1="0"
          y2="0"
        />
        <line
          opacity="0.4"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1="0"
          x2="0"
          y1="-80"
          y2="80"
        />
      </g>
    </g>
  );
}

/** Route / journey: dotted path across the canvas with waypoints. */
function RouteVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      <path
        d="M 40 150 Q 90 40 160 120 T 280 60"
        fill="none"
        opacity="0.5"
        stroke="currentColor"
        strokeDasharray="3 4"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx="40" cy="150" fill="currentColor" opacity="0.6" r="5" />
      <circle cx="160" cy="120" fill="currentColor" opacity="0.6" r="5" />
      <circle cx="280" cy="60" fill="var(--accent)" r="8" />
      <rect fill="currentColor" height="4" opacity="0.4" rx="2" width="30" x="46" y="160" />
      <rect fill="currentColor" height="4" opacity="0.4" rx="2" width="30" x="166" y="130" />
      <rect fill="var(--accent)" height="4" opacity="0.9" rx="2" width="30" x="240" y="70" />
    </g>
  );
}

/** Generic fallback: layered rounded rectangles suggesting a schema. */
function SchemaVariant() {
  return (
    <g>
      <DotBackdrop />
      <CornerCrosshairs />
      {/* back panel */}
      <rect
        fill="currentColor"
        height="100"
        opacity="0.08"
        rx="10"
        stroke="currentColor"
        strokeOpacity="0.35"
        vectorEffect="non-scaling-stroke"
        width="180"
        x="90"
        y="40"
      />
      {/* middle panel */}
      <rect
        fill="currentColor"
        height="100"
        opacity="0.14"
        rx="10"
        stroke="currentColor"
        strokeOpacity="0.5"
        vectorEffect="non-scaling-stroke"
        width="180"
        x="70"
        y="60"
      />
      {/* front panel with accent chip */}
      <g>
        <rect
          fill="currentColor"
          height="100"
          opacity="0.2"
          rx="10"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
          width="180"
          x="50"
          y="80"
        />
        <rect fill="var(--accent)" height="10" rx="4" width="40" x="66" y="96" />
        <rect fill="currentColor" height="6" opacity="0.5" rx="2" width="120" x="66" y="116" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="100" x="66" y="130" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="140" x="66" y="142" />
        <rect fill="currentColor" height="4" opacity="0.35" rx="2" width="80" x="66" y="154" />
      </g>
    </g>
  );
}
