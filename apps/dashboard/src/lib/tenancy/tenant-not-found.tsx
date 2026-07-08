/**
 * @file tenant-not-found.tsx
 * @module lib/tenancy/tenant-not-found
 *
 * @description
 * Public 404 rendered when the SPA boots on a tenant hostname (e.g.
 * `bogus.academorix.com`) that the backend does not recognise. The tenancy
 * provider surfaces this state via `host.kind === "tenant" && tenant === null
 * && !isLoading`.
 *
 * ## Copy tone
 *
 * Deliberately friendly + non-technical. A prospect who mistypes a URL is
 * more valuable to bounce back to the marketing site than a visitor who
 * sees a stack trace. The single CTA links back to the central host so
 * they can find the right workspace or sign up for a new one.
 *
 * ## Not routed
 *
 * This is not wired into the module registry — the tenancy provider
 * decides when to render it (it is a boot-time gate, not a URL). If we
 * ever want it accessible under a real path, add a route entry then.
 */

import type { ReactNode } from "react";

import { buildCentralUrl } from "@/lib/http";

/**
 * Full-viewport page shown when the host does not resolve to any tenant.
 * Falls back to the central host for both the CTA and the site branding.
 */
export function TenantNotFoundPage(): ReactNode {
  const centralUrl = buildCentralUrl("/");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-6xl font-bold tracking-tight text-foreground">404</p>
      <div className="max-w-md space-y-2">
        <p className="text-lg font-semibold text-foreground">Workspace not found</p>
        <p className="text-muted">
          We couldn&apos;t find an Academorix workspace at this address. Check the URL, or head back
          to the main site to find yours.
        </p>
      </div>
      {/*
        Native <a> styled with HeroUI's Button BEM classes — the Button
        component itself only renders a <button>, and swapping the element
        via the `render` prop introduces a Ref type conflict. Applying the
        BEM classes directly is the pattern HeroUI's Link docs recommend
        for framework-agnostic linked buttons.
      */}
      <a className="button button--primary" href={centralUrl}>
        Go to Academorix
      </a>
    </main>
  );
}
