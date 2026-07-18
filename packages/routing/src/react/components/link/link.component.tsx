/**
 * @file link.component.tsx
 * @module @stackra/routing/react/components/link
 * @description Framework `<Link>` with per-mode prefetching.
 *
 *   Renders a plain `<a>` and intercepts `onClick` to dispatch
 *   through the routing provider. Prefetch modes trigger a
 *   loader-warmup fetch via the RRv7 router's internal `fetch()`
 *   API so the destination is warm by the time the user commits.
 *
 *   Logic-only component per `ui-components.md` — no HeroUI
 *   markup to restyle. Consumers wrap `<Link>` in HeroUI
 *   primitives (Button, NavLink) for styled navigation.
 *
 *   Default hover affordance — the framework `<Link>` ships a
 *   subtle underline-on-hover via Tailwind so raw usage in prose
 *   still reads as a link. Consumers who don't want the
 *   affordance override with `className` (Tailwind's utility
 *   ordering makes the caller's value win).
 *
 * TODO(actions): swap the navigate call to
 *   `useAction<INavigateAction, void>('navigate')` when
 *   @stackra/actions runtime lands.
 */

import {
  useCallback,
  useEffect,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
} from "react";

import { useNavigate } from "@/react/hooks/use-navigate";
import { useStackraRoutingContext } from "@/react/hooks/use-stackra-routing-context";
import type { ILinkProps } from "./link.interface";

/**
 * Default hover / focus styling. Underline on hover + focus, offset
 * so it reads as a proper text link. Overridable via `className`.
 */
const DEFAULT_LINK_CLASS =
  "cursor-pointer text-inherit underline-offset-2 hover:underline focus-visible:underline";

/**
 * `<Link to="/dashboard" prefetch="hover">Dashboard</Link>`.
 *
 * @param props - See {@link ILinkProps}.
 * @returns Anchor element wired to the routing provider.
 */
export function Link({
  to,
  prefetch = "hover",
  replace,
  onClick,
  onPointerEnter,
  onPointerDown,
  onFocus,
  onKeyDown,
  onTouchStart,
  className,
  children,
  ...anchorProps
}: ILinkProps): ReactElement {
  const navigate = useNavigate();
  const { router } = useStackraRoutingContext();

  // Prefetch helper — warm up the loader for `to` on the router.
  // RRv7's data-router doesn't expose a direct "prefetch" method
  // in its public types, but internal minors expose `router.fetch`
  // (used by the framework's <Link prefetch>). We duck-type the
  // lookup so this stays forward-compatible without a hard cast to
  // the internal RouterState.
  const doPrefetch = useCallback(() => {
    if (prefetch === "off") return;
    // Guard — bail if the destination is absolute (external URL).
    if (/^https?:\/\//i.test(to)) return;
    const fetcher = (router as unknown as { fetch?: (href: string) => void }).fetch;
    if (typeof fetcher === "function") {
      try {
        fetcher.call(router, to);
      } catch {
        // fail-soft — prefetch is best-effort; never block
        // interaction on a failed cache warm.
      }
    }
  }, [prefetch, router, to]);

  // Render-mode prefetch — mount effect. Runs exactly once per link
  // mount; unmount triggers no cleanup because the request is fire-
  // and-forget through RRv7's cache.
  useEffect(() => {
    if (prefetch === "render") doPrefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click interception — dispatch through `useNavigate` unless the
  // user modified the click (open in new tab, right-click, etc.).
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      // Modifier keys — let the browser handle. Mirrors RRv7's
      // `<Link>` behaviour so `<Link>` composes with keyboard-tab
      // "open in new tab" gestures.
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;

      event.preventDefault();
      void navigate(to, { replace });
    },
    [navigate, onClick, to, replace],
  );

  const handleHoverPrefetch = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerEnter?.(event);
      if (prefetch === "hover") doPrefetch();
    },
    [doPrefetch, onPointerEnter, prefetch],
  );

  const handleIntentPointerDown = useCallback(
    (event: PointerEvent<HTMLAnchorElement>) => {
      onPointerDown?.(event);
      if (prefetch === "intent") doPrefetch();
    },
    [doPrefetch, onPointerDown, prefetch],
  );

  // Concat caller class AFTER the default so Tailwind's specificity
  // ordering lets the caller override defaults trivially.
  const resolvedClass = [DEFAULT_LINK_CLASS, className].filter(Boolean).join(" ");

  return (
    <a
      {...anchorProps}
      href={to}
      className={resolvedClass}
      onClick={handleClick}
      onPointerEnter={handleHoverPrefetch}
      onPointerDown={handleIntentPointerDown}
      onFocus={(event) => {
        onFocus?.(event);
        // Focus prefetch — treat keyboard focus the same as
        // pointer hover so keyboard users don't pay a warmup
        // penalty on Enter.
        if (prefetch === "hover") doPrefetch();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // Intent — Space / Enter both signal about-to-activate.
        if (prefetch === "intent" && (event.key === "Enter" || event.key === " ")) {
          doPrefetch();
        }
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (prefetch === "intent") doPrefetch();
      }}
    >
      {children}
    </a>
  );
}
