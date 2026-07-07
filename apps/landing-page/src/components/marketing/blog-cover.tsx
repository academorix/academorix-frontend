/**
 * @file blog-cover.tsx
 * @module components/marketing/blog-cover
 *
 * @description
 * Deterministic cover art for a blog post. Renders a category-
 * specific SVG composition tinted with a slug-hashed accent so every
 * post gets a unique-feeling illustration without an image asset in
 * source control.
 *
 * ## Why generative art
 *
 * The marketing site ships without commissioned imagery yet. Rather
 * than default to a plain gradient placeholder, we generate a rich
 * SVG per post that:
 *
 *   1. Reads consistently with the rest of the site (Glass theme,
 *      Academorix green accent hue).
 *   2. Is deterministic — the same slug always produces the same
 *      cover, so refreshing a post never re-shuffles the artwork.
 *   3. Is scalable — the same component drives the blog index card
 *      thumbnail and the article-page hero banner via a size prop.
 *
 * ## Composition
 *
 * The cover is a stack of three layers, top-to-bottom:
 *
 *   1. Dot-grid backdrop tinted with `currentColor` (0.2 opacity).
 *   2. Category-specific accent geometry (see the switch inside
 *      `renderCategoryLayer`).
 *   3. Slug-hash-driven decorator (rotating shape, colour offset)
 *      so no two covers within the same category look identical.
 *
 * A subtle top-to-bottom gradient wash makes the top of the cover
 * a touch darker to anchor the mock chrome (e.g. category chip,
 * date badge) that pages layer on top of the SVG.
 */

import clsx from "clsx";

import type { ReactNode } from "react";

/** Blog categories the cover recognises. Anything else → `"Company"`. */
export type BlogCoverCategory = "Product" | "Design" | "Engineering" | "Compliance" | "Company";

/** Props for {@link BlogCover}. */
export interface BlogCoverProps {
  /**
   * Post slug — hashed to derive a subtle accent variant so the
   * covers on the blog index look intentionally different from each
   * other even within the same category.
   */
  slug: string;
  /** Post category (mixed-case). Unknown values fall back to `"Company"`. */
  category: string;
  /** Extra Tailwind classes on the outer SVG (size, aspect, etc.). */
  className?: string;
  /** Accessibility label. Defaults to `""` (decorative). */
  alt?: string;
}

/**
 * Normalize a category string to the canonical set. Locale-collapsed
 * values arrive in either English or Arabic; we match on the
 * English form first, then a couple of Arabic aliases.
 */
function normalizeCategory(input: string): BlogCoverCategory {
  const canonical: readonly BlogCoverCategory[] = [
    "Product",
    "Design",
    "Engineering",
    "Compliance",
    "Company",
  ];

  const match = canonical.find((c) => c.toLowerCase() === input.toLowerCase());

  if (match) return match;

  // Common Arabic-side categories fall back to their English pair.
  const arabicToEnglish: Record<string, BlogCoverCategory> = {
    المنتج: "Product",
    التصميم: "Design",
    الهندسة: "Engineering",
    الامتثال: "Compliance",
    الشركة: "Company",
  };

  return arabicToEnglish[input] ?? "Company";
}

/**
 * Tiny stable string hash. Not cryptographic; used only to pick a
 * decoration variant deterministically from the post slug.
 */
function hashSlug(slug: string): number {
  let h = 0;

  for (let i = 0; i < slug.length; i += 1) {
    h = (h << 5) - h + slug.charCodeAt(i);
    h |= 0;
  }

  return Math.abs(h);
}

/**
 * Category-agnostic dot grid used behind every cover so all posts
 * share a visual root.
 */
function CoverBackdrop() {
  return (
    <g opacity="0.2">
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 20 }).map((__, col) => (
          <circle
            key={`${row}-${col}`}
            cx={20 + col * 20}
            cy={20 + row * 18}
            fill="currentColor"
            r="0.8"
          />
        )),
      )}
    </g>
  );
}

/**
 * Renders a blog post cover. See the file-level docblock for the
 * composition contract and design intent.
 */
export function BlogCover({ slug, category, className, alt = "" }: BlogCoverProps) {
  const canonical = normalizeCategory(category);
  const variantIndex = hashSlug(slug) % 3;
  const decorated = alt.length > 0;

  return (
    <svg
      aria-hidden={decorated ? undefined : true}
      aria-label={decorated ? alt : undefined}
      className={clsx("text-foreground/75 select-none", className)}
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      role={decorated ? "img" : undefined}
      viewBox="0 0 400 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base surface tint — glass theme reads through this. */}
      <rect fill="var(--surface)" height="240" opacity="0.5" width="400" x="0" y="0" />

      <CoverBackdrop />

      {renderCategoryLayer(canonical, variantIndex)}

      {/* Top-edge wash so a category chip overlaid at the top stays legible. */}
      <rect fill="url(#blog-cover-topwash)" height="240" opacity="0.6" width="400" x="0" y="0" />
      <defs>
        <linearGradient id="blog-cover-topwash" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--surface)" stopOpacity="0.6" />
          <stop offset="0.4" stopColor="var(--surface)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--surface)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Category layers
// ═══════════════════════════════════════════════════════════════════

function renderCategoryLayer(category: BlogCoverCategory, variant: number): ReactNode {
  switch (category) {
    case "Product":
      return <ProductLayer variant={variant} />;
    case "Design":
      return <DesignLayer variant={variant} />;
    case "Engineering":
      return <EngineeringLayer variant={variant} />;
    case "Compliance":
      return <ComplianceLayer variant={variant} />;
    case "Company":
    default:
      return <CompanyLayer variant={variant} />;
  }
}

// ─── Product: card stack with tags ─────────────────────────────────

function ProductLayer({ variant }: { variant: number }) {
  const skew = [0, 3, -3][variant] ?? 0;

  return (
    <g transform={`translate(60, 40) rotate(${skew} 140 80)`}>
      {/* back card */}
      <rect
        fill="currentColor"
        height="150"
        opacity="0.08"
        rx="12"
        stroke="currentColor"
        strokeOpacity="0.35"
        vectorEffect="non-scaling-stroke"
        width="280"
        x="20"
        y="20"
      />
      {/* middle card */}
      <rect
        fill="currentColor"
        height="150"
        opacity="0.14"
        rx="12"
        stroke="currentColor"
        strokeOpacity="0.5"
        vectorEffect="non-scaling-stroke"
        width="280"
        x="10"
        y="10"
      />
      {/* front card */}
      <g>
        <rect
          fill="currentColor"
          height="150"
          opacity="0.22"
          rx="12"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
          width="280"
        />
        {/* tag pill */}
        <rect fill="var(--accent)" height="14" rx="7" width="80" x="20" y="18" />
        {/* headline lines */}
        <rect fill="currentColor" height="8" opacity="0.6" rx="3" width="220" x="20" y="46" />
        <rect fill="currentColor" height="6" opacity="0.4" rx="3" width="200" x="20" y="64" />
        <rect fill="currentColor" height="6" opacity="0.4" rx="3" width="180" x="20" y="78" />
        {/* stat row */}
        <rect fill="var(--accent)" height="36" opacity="0.4" rx="6" width="70" x="20" y="100" />
        <rect fill="currentColor" height="36" opacity="0.15" rx="6" width="70" x="100" y="100" />
        <rect fill="currentColor" height="36" opacity="0.15" rx="6" width="70" x="180" y="100" />
      </g>
    </g>
  );
}

// ─── Design: colour swatches with a wave overlay ────────────────────

function DesignLayer({ variant }: { variant: number }) {
  const shift = [0, 40, -40][variant] ?? 0;

  return (
    <g>
      <g transform={`translate(${60 + shift}, 60)`}>
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            fill={i === 0 ? "var(--accent)" : "currentColor"}
            height="60"
            opacity={i === 0 ? "1" : 0.14 + i * 0.06}
            rx="8"
            stroke="currentColor"
            strokeOpacity="0.4"
            vectorEffect="non-scaling-stroke"
            width="60"
            x={i * 70}
            y="0"
          />
        ))}
      </g>
      {/* Wave overlay */}
      <path
        d="M 20 180 Q 100 140 200 170 T 380 150"
        fill="none"
        opacity="0.6"
        stroke="var(--accent)"
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M 20 200 Q 100 160 200 190 T 380 170"
        fill="none"
        opacity="0.3"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

// ─── Engineering: brackets + code lines ────────────────────────────

function EngineeringLayer({ variant }: { variant: number }) {
  const offset = [0, 20, -20][variant] ?? 0;

  return (
    <g transform={`translate(${offset}, 0)`}>
      {/* Left bracket */}
      <path
        d="M 80 60 L 60 60 L 60 180 L 80 180"
        fill="none"
        opacity="0.8"
        stroke="var(--accent)"
        strokeLinecap="round"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
      {/* Right bracket */}
      <path
        d="M 320 60 L 340 60 L 340 180 L 320 180"
        fill="none"
        opacity="0.8"
        stroke="var(--accent)"
        strokeLinecap="round"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
      {/* Code lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(100, ${75 + i * 20})`}>
          <rect fill="currentColor" height="6" opacity="0.35" rx="3" width="30" x="0" y="0" />
          <rect
            fill="currentColor"
            height="6"
            opacity="0.55"
            rx="3"
            width={i % 2 === 0 ? "80" : "120"}
            x="40"
            y="0"
          />
          <rect
            fill={i === 2 ? "var(--accent)" : "currentColor"}
            height="6"
            opacity={i === 2 ? "1" : 0.35}
            rx="3"
            width="40"
            x={i % 2 === 0 ? "130" : "170"}
            y="0"
          />
        </g>
      ))}
      {/* Cursor blink */}
      <rect fill="var(--accent)" height="16" rx="1" width="2" x="220" y="70" />
    </g>
  );
}

// ─── Compliance: shield with checkmark ─────────────────────────────

function ComplianceLayer({ variant }: { variant: number }) {
  const scale = [1, 1.08, 0.92][variant] ?? 1;

  return (
    <g transform={`translate(200, 120) scale(${scale}) translate(-200, -120)`}>
      {/* Outer shield */}
      <path
        d="M 200 40 L 130 68 L 130 130 Q 130 180 200 210 Q 270 180 270 130 L 270 68 Z"
        fill="currentColor"
        opacity="0.16"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      {/* Inner shield fill */}
      <path
        d="M 200 60 L 148 82 L 148 128 Q 148 172 200 196 Q 252 172 252 128 L 252 82 Z"
        fill="var(--accent)"
        opacity="0.9"
      />
      {/* Checkmark */}
      <path
        d="M 172 130 L 192 150 L 232 106"
        fill="none"
        stroke="var(--background)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
      />
      {/* Certification stamps */}
      <g opacity="0.4" transform="translate(20, 40)">
        <rect fill="currentColor" height="6" rx="3" width="40" x="0" y="0" />
        <rect fill="currentColor" height="4" opacity="0.6" rx="2" width="60" x="0" y="12" />
      </g>
      <g opacity="0.4" transform="translate(300, 40)">
        <rect fill="currentColor" height="6" rx="3" width="40" x="20" y="0" />
        <rect fill="currentColor" height="4" opacity="0.6" rx="2" width="60" x="0" y="12" />
      </g>
    </g>
  );
}

// ─── Company: connected nodes ──────────────────────────────────────

function CompanyLayer({ variant }: { variant: number }) {
  const nodes = [
    { x: 80, y: 100 },
    { x: 160, y: 60 },
    { x: 240, y: 140 },
    { x: 320, y: 80 },
    { x: 120, y: 180 },
    { x: 200, y: 200 },
  ];
  const edges: ReadonlyArray<readonly [number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [2, 5],
    [1, 3],
  ];
  const accentNode = [1, 2, 3][variant] ?? 1;

  return (
    <g>
      {/* Edges */}
      {edges.map(([a, b], i) => {
        const na = nodes[a];
        const nb = nodes[b];

        if (!na || !nb) return null;

        return (
          <line
            key={i}
            opacity="0.4"
            stroke="currentColor"
            strokeDasharray={i % 2 === 0 ? undefined : "3 3"}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            x1={na.x}
            x2={nb.x}
            y1={na.y}
            y2={nb.y}
          />
        );
      })}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle
            cx={n.x}
            cy={n.y}
            fill={i === accentNode ? "var(--accent)" : "currentColor"}
            opacity={i === accentNode ? "1" : "0.45"}
            r={i === accentNode ? 16 : 10}
          />
          {i === accentNode ? (
            <circle
              cx={n.x}
              cy={n.y}
              fill="none"
              opacity="0.5"
              r="24"
              stroke="var(--accent)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </g>
      ))}
    </g>
  );
}
