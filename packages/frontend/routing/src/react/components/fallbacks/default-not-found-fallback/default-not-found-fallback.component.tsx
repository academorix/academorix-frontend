/**
 * @file default-not-found-fallback.component.tsx
 * @module @stackra/routing/react/components/fallbacks/default-not-found-fallback
 * @description Framework-default 404 fallback — HeroUI Pro
 *   `<EmptyState>` with a "not found" preset and a home button.
 *
 *   Rendered whenever the router throws a `notFound()` signal or
 *   yields a match with no valid data (PLAN §5). Consumers
 *   override via `RoutingModule.forRoot(
 *     {fallbacks: {NotFoundComponent: ...}}
 *   )` or by passing custom title/description/action props.
 *
 *   Home button — defaults to `() => window.history.pushState(null, '', '/')`
 *   because this component is often reached with a broken router
 *   context (the reason we're on a 404 fallback). Consumers wire
 *   an app-scoped handler via `action` for correct routing.
 *
 *   Anatomy matches `<DefaultEmptyFallback />` — verified via
 *   `mcp_heroui_pro_get_component_docs`.
 */

import { type ReactElement } from "react";
import { Button, EmptyState } from "@stackra/ui/react";

import type { IDefaultNotFoundFallbackProps } from "./default-not-found-fallback.interface";

/**
 * Inline "no results" magnifier icon — 24x24 stroke SVG. Reads
 * as "we looked, we didn't find it" and matches the HeroUI Pro
 * empty-state "no results found" example. Inlined so the
 * framework fallback stays zero-dep.
 */
function MagnifierIcon(): ReactElement {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * Default home-button spec — replaced when consumers pass `action`.
 * The default target is `/` which every SPA can honour without
 * additional framework wiring.
 */
const DEFAULT_ACTION: IDefaultNotFoundFallbackProps["action"] = {
  label: "Go home",
  // A plain `assign` navigation — safe fallback when we can't
  // trust the router context (which is why we're on a 404 in the
  // first place). Consumers override with `action` to use
  // `useNavigate()` semantics.
  onPress: () => {
    if (typeof window !== "undefined") {
      window.location.assign("/");
    }
  },
};

/**
 * The default not-found fallback.
 *
 * @param props - See {@link IDefaultNotFoundFallbackProps}.
 * @returns A HeroUI Pro `<EmptyState>` in "404" style.
 */
export function DefaultNotFoundFallback({
  title = "Page not found",
  description = "The URL doesn't match any route in this app.",
  icon,
  action = DEFAULT_ACTION,
  hideAction = false,
  className,
}: IDefaultNotFoundFallbackProps = {}): ReactElement {
  // Default icon — an inline magnifier SVG.
  const media = icon ?? <MagnifierIcon />;

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
        {!hideAction && action ? (
          <EmptyState.Content>
            <Button onPress={action.onPress}>{action.label}</Button>
          </EmptyState.Content>
        ) : null}
      </EmptyState>
    </div>
  );
}
