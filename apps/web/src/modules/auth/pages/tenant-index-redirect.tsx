/**
 * @file tenant-index-redirect.tsx
 * @module modules/auth/pages/tenant-index-redirect
 *
 * @description
 * The tenant-host root (`{slug}.academorix.com/`) used to render a full
 * marketing landing page. That content lives in the standalone Next.js
 * marketing app now (`apps/landing-page`), so this route simply forwards
 * anonymous visitors to `/login`. Refine's `<Authenticated>` guard on the
 * `/login` route already handles the flip case — signed-in users get
 * bounced onward to `/dashboard` from there.
 *
 * The `replace` on the redirect keeps `/` out of the history stack so a
 * "back" button never lands the visitor on this pass-through.
 */

import { Navigate } from "react-router";

import type { ReactElement } from "react";

import { appRoutes } from "@/lib/module/routes";

/** Redirects `/` on a tenant host to the tenant's login page. */
export default function TenantIndexRedirect(): ReactElement {
  return <Navigate replace to={appRoutes.login} />;
}
