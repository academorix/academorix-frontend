/**
 * @file brand-mark.tsx
 * @module components/brand/brand-mark
 *
 * @description
 * Renders the Academorix brand asset from `public/brand/*` as an
 * optimized `next/image`. Three variants are exposed so the same
 * component covers every marketing surface the mark shows up on:
 *
 * | Variant    | Asset          | Intrinsic size | Typical use                          |
 * | ---------- | -------------- | -------------- | ------------------------------------ |
 * | `mark`     | `mark.png`     | 720 x 620      | Compact icon next to a text wordmark |
 * | `wordmark` | `wordmark.png` | 731 x 63       | Header wordmark when space allows    |
 * | `lockup`   | `lockup.png`   | 900 x 390      | Hero / brand-forward layouts         |
 *
 * ## Sizing
 *
 * Rather than baking in a fixed pixel size, the component accepts a
 * `height` prop (in pixels) and computes the width from the asset's
 * intrinsic aspect ratio. That keeps the image crisp on high-DPR
 * displays because `next/image` still receives explicit `width` +
 * `height` attributes (required for layout-shift-safe rendering).
 * Callers can also pass a `className` to override sizing further
 * (for example, adding a Tailwind `size-*` utility on the parent).
 *
 * ## Accessibility
 *
 * `alt` defaults to `"Academorix"`. Pass `alt=""` when the mark is
 * paired with a visible text label to avoid double-announcement by
 * screen readers.
 *
 * ## Optimization
 *
 * Set `priority` on the header instance so the LCP image is not
 * lazy-loaded. Every other placement can leave the default.
 */

import Image from "next/image";

import lockupSrc from "../../../public/brand/lockup.png";
import markSrc from "../../../public/brand/mark.png";
import wordmarkSrc from "../../../public/brand/wordmark.png";

/** Which brand asset to render. */
export type BrandMarkVariant = "mark" | "wordmark" | "lockup";

/** Props for {@link BrandMark}. */
export interface BrandMarkProps {
  /** Which brand asset to render. Defaults to `"mark"`. */
  variant?: BrandMarkVariant;
  /**
   * Target height in pixels. The width is computed from the asset's
   * intrinsic aspect ratio so the image is never stretched. If both
   * `height` and `className` are omitted, the height falls back to
   * `28` (a comfortable header size).
   */
  height?: number;
  /**
   * Accessible alternative text. Defaults to `"Academorix"`. Pass
   * an empty string when a visible text label is rendered next to
   * the mark to prevent screen readers announcing the brand twice.
   */
  alt?: string;
  /** Additional Tailwind or CSS class names applied to the image. */
  className?: string;
  /**
   * Whether to opt into `next/image` priority loading. Turn this on
   * for the header instance (LCP-critical) and leave it off for the
   * footer and drawer.
   */
  priority?: boolean;
}

/** Intrinsic aspect ratio for each variant, derived from the shipped PNGs. */
const INTRINSIC = {
  mark: markSrc,
  wordmark: wordmarkSrc,
  lockup: lockupSrc,
} as const;

/**
 * Renders the Academorix brand mark. See the file-level docblock for
 * a full description of the variants, sizing behavior, and a11y
 * expectations.
 */
export function BrandMark({
  variant = "mark",
  height = 28,
  alt = "Academorix",
  className,
  priority = false,
}: BrandMarkProps) {
  const source = INTRINSIC[variant];
  const aspectRatio = source.width / source.height;
  const computedWidth = Math.round(height * aspectRatio);

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      priority={priority}
      src={source}
      width={computedWidth}
    />
  );
}
