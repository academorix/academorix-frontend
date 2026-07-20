/**
 * @file default-empty-fallback.component.tsx
 * @module @stackra/routing/react/components/fallbacks/default-empty-fallback
 * @description Framework-default empty fallback — HeroUI Pro
 *   `<EmptyState>` with a folder icon default.
 *
 *   Rendered by the framework when a route's loader returns a
 *   value that its `isEmpty(data)` predicate flags as empty
 *   (PLAN §5). Consumers override the whole component OR just the
 *   copy via props.
 *
 *   Anatomy per the HeroUI Pro docs (verified via
 *   `mcp_heroui_pro_get_component_docs`):
 *
 *     <EmptyState>
 *       <EmptyState.Header>
 *         <EmptyState.Media variant="icon">{icon}</EmptyState.Media>
 *         <EmptyState.Title />
 *         <EmptyState.Description />
 *       </EmptyState.Header>
 *       <EmptyState.Content>{action button}</EmptyState.Content>
 *     </EmptyState>
 *
 *   Uses the design system's `variant="icon"` media treatment to
 *   render the icon inside a circular muted background — the
 *   canonical "empty" affordance from the Pro examples.
 */

import { type ReactElement } from "react";
import { Button, EmptyState } from "@stackra/ui/react";

import type { IDefaultEmptyFallbackProps } from "./default-empty-fallback.interface";

/**
 * Inline folder icon — 24x24 stroke SVG. Rendered inside
 * `EmptyState.Media variant="icon"` so it inherits the muted
 * circular background from the design system. Inlined rather
 * than pulled from an icon library so the framework fallback
 * stays zero-dep.
 */
function FolderIcon(): ReactElement {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

/**
 * The default empty fallback.
 *
 * @param props - See {@link IDefaultEmptyFallbackProps}.
 * @returns A HeroUI Pro `<EmptyState>` element inside a centered
 *   flex wrapper.
 */
export function DefaultEmptyFallback({
  title = "Nothing here yet",
  description = "This route returned no data. Try adjusting filters or come back later.",
  icon,
  action,
  className,
}: IDefaultEmptyFallbackProps = {}): ReactElement {
  // Default icon — an inline folder SVG that matches the HeroUI
  // Pro examples' "no projects yet" media. Consumers pass their
  // own via `icon` to use a domain-specific glyph.
  const media = icon ?? <FolderIcon />;

  const rootClass = ["flex min-h-64 items-center justify-center p-6", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">{media}</EmptyState.Media>
          <EmptyState.Title>{title}</EmptyState.Title>
          <EmptyState.Description>{description}</EmptyState.Description>
        </EmptyState.Header>
        {action ? (
          <EmptyState.Content>
            {/* Primary action — HeroUI's default button variant is
                `primary`, which reads as the CTA. */}
            <Button onPress={action.onPress}>{action.label}</Button>
          </EmptyState.Content>
        ) : null}
      </EmptyState>
    </div>
  );
}
