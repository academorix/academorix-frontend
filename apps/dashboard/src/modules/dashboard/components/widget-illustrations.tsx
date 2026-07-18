/**
 * @file widget-illustrations.tsx
 * @module modules/dashboard/components/widget-illustrations
 *
 * @description
 * A tiny catalogue of vector illustrations used as widget "poster"
 * thumbnails in the Add-Widget drawer + on empty widget cards. Each
 * illustration is a purely-decorative SVG built with the theme's
 * semantic tokens (`text-accent`, `bg-surface-secondary`, …), so it
 * automatically re-tints under every theme (light, dark, glass) and
 * every brand.
 *
 * ## Design intent
 *
 *   * **Compositional, not literal.** Illustrations depict the *kind*
 *     of information a widget shows (a trend line, a stacked-bar, a
 *     three-metric row) rather than the widget's exact live data.
 *     This lets a single illustration cover multiple widgets in the
 *     same category and stay valid when the data source changes.
 *   * **Muted colour palette.** Every illustration uses the accent
 *     stroke on top of a `bg-surface-secondary` frame with a subtle
 *     inner border. The frame reads as a mini device chrome —
 *     mirrors the aesthetic in the reference screenshot the user
 *     shared.
 *   * **Fixed intrinsic size (192×112).** Rendered at a fixed 16:9-ish
 *     ratio via `viewBox` so the caller can scale it into any
 *     container without recomputing coordinates. Every stroke uses
 *     `vector-effect="non-scaling-stroke"` so line weight stays
 *     consistent from 96×56 thumbnails up to 384×224 posters.
 *
 * ## Registry
 *
 * Illustrations register by **widget key** (matches the catalogue
 * entry). Widgets without a bespoke illustration fall through to a
 * per-cohort default (see {@link COHORT_FALLBACK}). Nothing crashes
 * if the caller asks for a key that doesn't exist — the caller
 * receives `null` and can render its own placeholder.
 */

import type { WidgetCohort } from "@/modules/dashboard/widgets.catalogue";
import type { ComponentType, ReactNode } from "react";

/** Shared frame that gives every illustration its device-chrome look. */
function IllustrationFrame({ children }: { children: ReactNode }): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className="block h-full w-full text-accent"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 192 112"
    >
      {/* Outer frame — subtle inner shadow via double stroke */}
      <rect
        className="fill-surface-secondary stroke-border"
        height="104"
        rx="8"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        width="184"
        x="4"
        y="4"
      />
      {/* Top-left title placeholder */}
      <rect
        className="fill-border"
        height="4"
        rx="2"
        vectorEffect="non-scaling-stroke"
        width="44"
        x="16"
        y="16"
      />
      {children}
    </svg>
  );
}

/**
 * A rising trend line — used for revenue, forecast, and any
 * "growth over time" widget. Mimics the reference the user shared.
 */
function TrendLineIllustration(): ReactNode {
  // Y-axis tick placeholders
  const yTicks = [30, 44, 58, 72, 86];

  // X-axis tick placeholders
  const xTicks = [40, 64, 88, 112, 136, 160];

  return (
    <IllustrationFrame>
      {yTicks.map((y) => (
        <line
          key={y}
          className="stroke-border/40"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          x1="16"
          x2="180"
          y1={y}
          y2={y}
        />
      ))}
      {yTicks.map((y) => (
        <rect
          key={`tick-${y}`}
          className="fill-border"
          height="2"
          rx="1"
          vectorEffect="non-scaling-stroke"
          width="4"
          x="10"
          y={y - 1}
        />
      ))}
      {xTicks.map((x) => (
        <rect
          key={`xtick-${x}`}
          className="fill-border"
          height="4"
          rx="1"
          vectorEffect="non-scaling-stroke"
          width="6"
          x={x - 3}
          y="94"
        />
      ))}
      {/* Filled area under the curve */}
      <path
        className="fill-accent/15"
        d="M16 76 C 40 68, 56 60, 72 58 C 96 56, 112 46, 132 40 C 152 34, 168 32, 180 30 L 180 92 L 16 92 Z"
      />
      {/* The trend line itself */}
      <path
        className="stroke-accent"
        d="M16 76 C 40 68, 56 60, 72 58 C 96 56, 112 46, 132 40 C 152 34, 168 32, 180 30"
        fill="none"
        strokeLinecap="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </IllustrationFrame>
  );
}

/** A stacked bar chart — used for distribution-style widgets. */
function BarChartIllustration(): ReactNode {
  const bars = [
    { x: 24, h: 34 },
    { x: 46, h: 52 },
    { x: 68, h: 44 },
    { x: 90, h: 62 },
    { x: 112, h: 38 },
    { x: 134, h: 56 },
    { x: 156, h: 48 },
  ];

  return (
    <IllustrationFrame>
      {bars.map((bar, index) => (
        <rect
          key={index}
          className={index % 2 === 0 ? "fill-accent" : "fill-accent/40"}
          height={bar.h}
          rx="3"
          vectorEffect="non-scaling-stroke"
          width="14"
          x={bar.x}
          y={94 - bar.h}
        />
      ))}
      <line
        className="stroke-border"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        x1="16"
        x2="180"
        y1="94"
        y2="94"
      />
    </IllustrationFrame>
  );
}

/**
 * Three KPI cards side-by-side — the numbers-strip archetype.
 */
function KpiStripIllustration(): ReactNode {
  const cards = [
    { x: 12, label: 28, value: 34 },
    { x: 72, label: 28, value: 34 },
    { x: 132, label: 28, value: 34 },
  ];

  return (
    <IllustrationFrame>
      {cards.map((card, index) => (
        <g key={index}>
          <rect
            className="fill-background stroke-border"
            height="56"
            rx="6"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            width="48"
            x={card.x}
            y="36"
          />
          <rect
            className="fill-border"
            height="4"
            rx="2"
            vectorEffect="non-scaling-stroke"
            width={card.label}
            x={card.x + 8}
            y="46"
          />
          <rect
            className="fill-accent"
            height="8"
            rx="2"
            vectorEffect="non-scaling-stroke"
            width={card.value}
            x={card.x + 8}
            y="58"
          />
          <rect
            className="fill-border"
            height="3"
            rx="1"
            vectorEffect="non-scaling-stroke"
            width="20"
            x={card.x + 8}
            y="76"
          />
        </g>
      ))}
    </IllustrationFrame>
  );
}

/** A single KPI card with a sparkline — for standalone metric widgets. */
function KpiSparklineIllustration(): ReactNode {
  return (
    <IllustrationFrame>
      <rect
        className="fill-background stroke-border"
        height="72"
        rx="6"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        width="164"
        x="14"
        y="28"
      />
      <rect
        className="fill-border"
        height="4"
        rx="2"
        vectorEffect="non-scaling-stroke"
        width="52"
        x="24"
        y="40"
      />
      <rect
        className="fill-accent"
        height="14"
        rx="2"
        vectorEffect="non-scaling-stroke"
        width="76"
        x="24"
        y="52"
      />
      <path
        className="stroke-accent"
        d="M108 84 C 116 78, 122 82, 128 74 C 136 66, 144 72, 152 66 C 160 60, 168 62, 172 58"
        fill="none"
        strokeLinecap="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </IllustrationFrame>
  );
}

/** Calendar-style — day cells + a highlighted band across today. */
function CalendarIllustration(): ReactNode {
  return (
    <IllustrationFrame>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={`weekday-${i}`}
          className="fill-border"
          height="4"
          rx="1"
          vectorEffect="non-scaling-stroke"
          width="12"
          x={16 + i * 24}
          y="30"
        />
      ))}
      {[0, 1, 2, 3].map((row) => (
        <g key={row}>
          {[0, 1, 2, 3, 4, 5, 6].map((col) => (
            <rect
              key={`${row}-${col}`}
              className={
                row === 1 && col === 3 ? "fill-accent" : "fill-background stroke-border/60"
              }
              height="10"
              rx="2"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              width="20"
              x={16 + col * 24}
              y={40 + row * 14}
            />
          ))}
        </g>
      ))}
    </IllustrationFrame>
  );
}

/** A vertical list — rows of avatars/lines. Used for people + activity. */
function ListIllustration(): ReactNode {
  const rows = [30, 48, 66, 84];

  return (
    <IllustrationFrame>
      {rows.map((y) => (
        <g key={y}>
          <circle className="fill-accent/30" cx="24" cy={y + 6} r="6" />
          <rect
            className="fill-border"
            height="4"
            rx="1"
            vectorEffect="non-scaling-stroke"
            width="88"
            x="38"
            y={y + 3}
          />
          <rect
            className="fill-border/60"
            height="3"
            rx="1"
            vectorEffect="non-scaling-stroke"
            width="56"
            x="38"
            y={y + 10}
          />
          <rect
            className="fill-border"
            height="4"
            rx="1"
            vectorEffect="non-scaling-stroke"
            width="20"
            x="152"
            y={y + 6}
          />
        </g>
      ))}
    </IllustrationFrame>
  );
}

/** A checklist — rows with radio dots. Used for onboarding. */
function ChecklistIllustration(): ReactNode {
  const rows = [30, 48, 66, 84];

  return (
    <IllustrationFrame>
      {rows.map((y, index) => {
        const isDone = index < 2;

        return (
          <g key={y}>
            {isDone ? (
              <circle
                className="fill-success"
                cx="24"
                cy={y + 6}
                r="5"
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <circle
                className="fill-none stroke-border"
                cx="24"
                cy={y + 6}
                r="5"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {isDone ? (
              <path
                className="stroke-success-foreground"
                d={`M21 ${y + 6} L23 ${y + 8} L27 ${y + 4}`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <rect
              className={isDone ? "fill-border/60" : "fill-border"}
              height="4"
              rx="1"
              vectorEffect="non-scaling-stroke"
              width={100 - index * 8}
              x="38"
              y={y + 3}
            />
            <rect
              className="fill-border/50"
              height="3"
              rx="1"
              vectorEffect="non-scaling-stroke"
              width={60 - index * 6}
              x="38"
              y={y + 10}
            />
          </g>
        );
      })}
    </IllustrationFrame>
  );
}

/**
 * A shield + tick — used for the compliance / safeguarding widgets.
 */
function ComplianceIllustration(): ReactNode {
  return (
    <IllustrationFrame>
      <rect
        className="fill-background stroke-border"
        height="72"
        rx="6"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        width="164"
        x="14"
        y="28"
      />
      <path
        className="fill-accent/15 stroke-accent"
        d="M96 40 L120 48 L120 66 C 120 82, 108 88, 96 92 C 84 88, 72 82, 72 66 L 72 48 Z"
        strokeLinejoin="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="stroke-accent"
        d="M84 66 L94 74 L108 60"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
    </IllustrationFrame>
  );
}

/** Coin stack + arrow — used for money widgets. */
function MoneyIllustration(): ReactNode {
  const coins = [
    { y: 82, w: 96 },
    { y: 68, w: 84 },
    { y: 54, w: 72 },
    { y: 40, w: 60 },
  ];

  return (
    <IllustrationFrame>
      {coins.map((coin, index) => (
        <ellipse
          key={index}
          className={index === coins.length - 1 ? "fill-accent" : "fill-accent/40"}
          cx="72"
          cy={coin.y}
          rx={coin.w / 2}
          ry="6"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path
        className="stroke-accent"
        d="M136 66 L 172 30"
        fill="none"
        strokeLinecap="round"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="fill-accent"
        d="M172 30 L 164 32 L 170 38 Z"
        vectorEffect="non-scaling-stroke"
      />
    </IllustrationFrame>
  );
}

/**
 * Fallback illustration per widget cohort. Used when a specific
 * widget key has no bespoke drawing.
 *
 * Typed as `Partial` because {@link WidgetCohort} is intentionally
 * open (task F2) — feature modules may contribute their own cohort
 * keys via `registerCohort`, and those won't have a bespoke
 * illustration here. The lookup path handles missing entries
 * gracefully.
 */
const COHORT_FALLBACK: Partial<Record<WidgetCohort, ComponentType>> = {
  onboarding: ChecklistIllustration,
  numbers: KpiStripIllustration,
  charts: TrendLineIllustration,
  calendar: CalendarIllustration,
  people: ListIllustration,
  money: MoneyIllustration,
  compliance: ComplianceIllustration,
};

/**
 * Per-widget-key registry. Not every widget has an override —
 * missing entries fall through to the cohort fallback.
 */
const KEY_REGISTRY: Record<string, ComponentType> = {
  "kpi-strip": KpiStripIllustration,
  "kpi-athletes": KpiSparklineIllustration,
  "kpi-revenue-mtd": KpiSparklineIllustration,
  "kpi-attendance-rate": KpiSparklineIllustration,
  "kpi-open-leads": KpiSparklineIllustration,
  "chart-revenue-week": TrendLineIllustration,
  "chart-athletes-per-sport": BarChartIllustration,
  "money-outstanding-balance": MoneyIllustration,
  "money-refunds-mtd": MoneyIllustration,
  "money-forecast": TrendLineIllustration,
  "onboarding-checklist": ChecklistIllustration,
  "list-recent-activity": ListIllustration,
  "list-birthdays": ListIllustration,
  "list-new-athletes": ListIllustration,
  "agenda-today": CalendarIllustration,
  "compliance-credentials-expiring": ComplianceIllustration,
  "compliance-documents-missing": ComplianceIllustration,
  "compliance-safeguarding-training": ComplianceIllustration,
};

/**
 * Resolve the illustration component for a widget. Prefers a
 * key-specific override, falls back to the cohort default, and
 * returns `null` when nothing matches.
 */
export function widgetIllustrationFor(
  widgetKey: string,
  cohort: WidgetCohort | undefined,
): ComponentType | null {
  const override = KEY_REGISTRY[widgetKey];

  if (override) {
    return override;
  }

  if (cohort) {
    return COHORT_FALLBACK[cohort] ?? null;
  }

  return null;
}

/**
 * Convenience wrapper — renders the resolved illustration or a
 * neutral placeholder rectangle when nothing matches.
 */
export interface WidgetIllustrationProps {
  widgetKey: string;
  cohort: WidgetCohort | undefined;
  className?: string;
}

export function WidgetIllustration({
  widgetKey,
  cohort,
  className,
}: WidgetIllustrationProps): ReactNode {
  const Component = widgetIllustrationFor(widgetKey, cohort);

  return (
    <div
      className={
        "flex items-center justify-center overflow-hidden rounded-lg bg-surface-secondary/60" +
        (className ? ` ${className}` : "")
      }
    >
      {Component ? <Component /> : <div className="text-xs text-muted">Preview</div>}
    </div>
  );
}
