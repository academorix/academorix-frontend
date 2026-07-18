/**
 * @file a11y-announcer.component.tsx
 * @module @stackra/routing/react/components/a11y-announcer
 * @description Announce route transitions to assistive tech.
 *
 *   Mounts a visually hidden `role="status" aria-live="polite"`
 *   region. On every route change the component resolves the
 *   announcement text per PLAN v3.11.6 (in order):
 *
 *     1. `handle[STACKRA_HANDLE].announce` — explicit per-route
 *        override (string OR (ctx) => string).
 *     2. `seo.title` — the browser tab title (from the leaf match).
 *     3. `handle.breadcrumb` — the current breadcrumb string.
 *     4. `pathname` — final fallback.
 *
 *   When `announce === false`, the route opted out — the region
 *   stays empty for that transition. Rapid navigations replace the
 *   message atomically (React setState schedules a batch): the
 *   assistive tech announces the LATEST value, cancelling any
 *   pending previous announcement. This is the desired behaviour
 *   for a polite live region.
 *
 *   The component itself renders no visual UI — it is exempt from
 *   the `ui-components` HeroUI rule per the "logic-only components
 *   are exempt" clause. The single `<div>` is `sr-only` (a Tailwind
 *   utility that clips the element visually while keeping it in
 *   the accessibility tree).
 */

import { useEffect, useMemo, useState, useSyncExternalStore, type ReactElement } from "react";
import type { Params } from "react-router";

import { STACKRA_HANDLE } from "@/core/constants";
import { resolveValue } from "@/core/utils";
import type { ISeoDescriptor } from "@/seo/interfaces/seo-descriptor.interface";
import { useStackraRoutingContext } from "@/react/hooks/use-stackra-routing-context";

/**
 * Local flat-match shape mirroring RRv7's `UIMatch<Data, Handle>` — the
 * type `useMatches()` returns to consumers inside `<RouterProvider>`.
 *
 * `router.state.matches` (the shape available from outside the router
 * subtree) exposes `AgnosticDataRouteMatch` instead — same information
 * but reshuffled: `handle` lives on `match.route.handle`, `data` lives
 * in `router.state.loaderData[match.route.id]`. This component
 * flattens the pair at the subscribe boundary so the descriptor
 * resolvers below see the same shape they'd see under `<RouterProvider>`.
 */
interface IFlatMatch {
  readonly id: string;
  readonly pathname: string;
  readonly params: Params;
  readonly handle: unknown;
  readonly data: unknown;
}

/**
 * The visually-hidden announcer region.
 *
 * @returns A live-region element that assistive tech reads on route
 *   transitions.
 *
 * @remarks
 * Reads the router state via `router.subscribe(...)` rather than
 * `useLocation()` / `useMatches()`. Reason: `<StackraRoutingProvider>`
 * mounts `<A11yAnnouncer />` as a SIBLING of `<RouterProvider>`, not
 * a descendant — RRv7's `RouterProvider` does not accept a `children`
 * prop, so any component that must always render (like this live
 * region) has to live outside its tree. React Router's own
 * `useLocation` throws when called outside `<RouterProvider>`; the
 * router's `subscribe(cb)` API is the supported way to observe state
 * changes from outside the RRv7 subtree.
 */
export function A11yAnnouncer(): ReactElement {
  const { router } = useStackraRoutingContext();

  // `useSyncExternalStore` bridges the RRv7 router (an external
  // store) into React rendering. On every `router.state` change,
  // React re-renders this component with the fresh location +
  // matches. The `getServerSnapshot` argument is intentionally the
  // same as `getSnapshot` — routing state is not SSR-hydrated in
  // this framework (SSR is locked to `false` per PLAN v3).
  //
  // We subscribe THREE slices of `router.state` — `location`,
  // `matches`, and `loaderData` — and flatten `matches` + `loaderData`
  // into a `UIMatch`-shaped array via `useMemo` (see `IFlatMatch`
  // above). Doing the transform inside `getSnapshot` would allocate
  // a new array every call and blow up `useSyncExternalStore`'s
  // referential-equality guard; doing it in `useMemo` keeps the
  // reference stable across re-renders that don't change either
  // upstream slice.
  const location = useSyncExternalStore(
    (onChange) => router.subscribe(onChange),
    () => router.state.location,
    () => router.state.location,
  );
  const rawMatches = useSyncExternalStore(
    (onChange) => router.subscribe(onChange),
    () => router.state.matches,
    () => router.state.matches,
  );
  const loaderData = useSyncExternalStore(
    (onChange) => router.subscribe(onChange),
    () => router.state.loaderData,
    () => router.state.loaderData,
  );

  const matches = useMemo<readonly IFlatMatch[]>(
    () =>
      rawMatches.map((m) => ({
        id: m.route.id,
        pathname: m.pathname,
        params: m.params,
        handle: m.route.handle,
        data: loaderData[m.route.id],
      })),
    [rawMatches, loaderData],
  );

  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // Build a stable URL for descriptor resolvers — the same shape
    // `<SeoHead />` uses.
    const url = new URL(location.pathname + location.search, "http://placeholder/");
    const request = new Request(url.toString());

    // Walk from leaf to root — first match with a resolvable
    // announcement wins. Explicit `announce` wins over auto-derived
    // labels (SEO title, breadcrumb, pathname).
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const match = matches[i];
      const stackra = (match.handle as Record<string | symbol, unknown> | undefined)?.[
        STACKRA_HANDLE
      ] as { readonly announce?: unknown; readonly seo?: unknown } | undefined;

      // 0. Explicit opt-out — `announce: false` means "stay silent
      //    on this transition". Clear any stale message so the live
      //    region doesn't re-announce leftover text.
      if (stackra?.announce === false) {
        setMessage("");
        return;
      }

      // 1. Explicit per-route announcer (string OR function).
      if (stackra?.announce !== undefined) {
        const context = {
          data: match.data,
          params: match.params,
          matches,
          request,
          url,
        };
        const resolved = resolveValue<string, unknown>(stackra.announce as never, context as never);
        if (typeof resolved === "string" && resolved.length > 0) {
          setMessage(resolved);
          return;
        }
      }
    }

    // 2. Fall back to the leaf's SEO title.
    if (matches.length > 0) {
      const leaf = matches[matches.length - 1];
      const stackra = (leaf.handle as Record<string | symbol, unknown> | undefined)?.[
        STACKRA_HANDLE
      ] as { readonly seo?: unknown } | undefined;
      if (stackra?.seo) {
        const context = {
          data: leaf.data,
          params: leaf.params,
          matches,
          request,
          url,
        };
        const seo = resolveValue<ISeoDescriptor, unknown>(stackra.seo as never, context as never);
        if (seo?.title) {
          setMessage(seo.title);
          return;
        }
      }
    }

    // 3. Fall back to the current breadcrumb (walk leaf → root).
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      const match = matches[i];
      const breadcrumb = (match.handle as { breadcrumb?: unknown } | undefined)?.breadcrumb;
      if (breadcrumb) {
        const context = {
          data: match.data,
          params: match.params,
          matches,
          request,
          url,
        };
        const label = resolveValue<string, unknown>(breadcrumb as never, context as never);
        if (typeof label === "string" && label.length > 0) {
          setMessage(label);
          return;
        }
      }
    }

    // 4. Final fallback — the pathname. Better than silent for a
    //    route that ships no metadata at all.
    setMessage(location.pathname);
  }, [location.pathname, location.search, matches]);

  // Visually hidden region. The `sr-only` Tailwind utility clips
  // the element visually while keeping it in the accessibility
  // tree — the canonical live-region pattern. `aria-atomic="true"`
  // instructs the screen reader to announce the whole node on any
  // change (not just the diff) so mid-navigation partial content
  // never leaks into the announcement.
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
