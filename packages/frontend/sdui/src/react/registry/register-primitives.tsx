/**
 * @file register-primitives.tsx
 * @module @stackra/sdui/react/registry
 * @description Hand-registered "core primitives" — pure Tailwind-layout
 *   wrappers over semantic tokens (`Box`, `Stack`, `Grid`, `Section`,
 *   `Text`, `Heading`). These aren't HeroUI components; they are the
 *   layout scaffolding SDUI schemas use for composition.
 *
 *   HeroUI OSS + HeroUI Pro components ship through the manifest
 *   extractor (deferred, see `.kiro/specs/sdui/tasks.md`); this file
 *   provides the always-available primitives so a minimal screen can
 *   render today.
 */

import type { HTMLAttributes, ReactNode } from "react";
import type { ComponentRegistry } from "@/core/registries/component.registry";

// ── Layout primitives ────────────────────────────────────────────────

interface IBoxProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** `Box` — a plain `<div>` passthrough. Every SDUI-composed layout roots
 * on `Box` when no more specific compound is called for. */
function Box({ children, ...rest }: IBoxProps) {
  return <div {...rest}>{children}</div>;
}

interface IStackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: number;
  direction?: "row" | "column";
  children?: ReactNode;
}

/** `Stack` — flex column (or row) with a numeric `gap` (Tailwind units). */
function Stack({ gap = 3, direction = "column", className, children, ...rest }: IStackProps) {
  const dir = direction === "row" ? "flex-row" : "flex-col";
  const composed = `flex ${dir} gap-${gap} ${className ?? ""}`.trim();
  return (
    <div {...rest} className={composed}>
      {children}
    </div>
  );
}

interface IGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: number;
  gap?: number;
  children?: ReactNode;
}

/** `Grid` — Tailwind grid with `cols` and `gap`. */
function Grid({ cols = 2, gap = 3, className, children, ...rest }: IGridProps) {
  const composed = `grid grid-cols-${cols} gap-${gap} ${className ?? ""}`.trim();
  return (
    <div {...rest} className={composed}>
      {children}
    </div>
  );
}

interface ISectionProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

/** `Section` — semantic `<section>` with light default padding. */
function Section({ className, children, ...rest }: ISectionProps) {
  const composed = `py-4 ${className ?? ""}`.trim();
  return (
    <section {...rest} className={composed}>
      {children}
    </section>
  );
}

interface ITextProps extends HTMLAttributes<HTMLSpanElement> {
  value?: string | number | boolean | null;
  children?: ReactNode;
}

/** `Text` — inline text; renders `value` (schema leaf) OR `children`. */
function Text({ value, children, ...rest }: ITextProps) {
  return <span {...rest}>{value != null ? String(value) : children}</span>;
}

interface IHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  value?: string;
  children?: ReactNode;
}

/** `Heading` — `h1`-`h6` with sensible default sizes. */
function Heading({ level = 2, className, value, children, ...rest }: IHeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const sizes = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-sm"] as const;
  const composed = `${sizes[level - 1] ?? "text-xl"} font-semibold ${className ?? ""}`.trim();
  return (
    <Tag {...rest} className={composed}>
      {value ?? children}
    </Tag>
  );
}

/**
 * Register the always-available SDUI primitives with a component
 * registry. Idempotent — safe to call multiple times.
 */
export function registerCorePrimitives(registry: ComponentRegistry): void {
  registry.register("Box", { component: Box, category: "primitive" });
  registry.register("Stack", { component: Stack, category: "primitive" });
  registry.register("Grid", { component: Grid, category: "primitive" });
  registry.register("Section", { component: Section, category: "primitive" });
  registry.register("Text", { component: Text, category: "primitive", acceptsChildren: false });
  registry.register("Heading", {
    component: Heading,
    category: "primitive",
    acceptsChildren: false,
  });
}
