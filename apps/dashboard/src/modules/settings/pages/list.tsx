/**
 * @file list.tsx
 * @module modules/settings/pages/list
 *
 * @description
 * The bare `/settings` route redirects to `/settings/general` — every real
 * settings surface lives under `/settings/:sectionId` and is rendered by
 * `pages/section.tsx`.
 */

import { Navigate } from "@stackra/routing/react";

export default function Page() {
  return <Navigate replace to="/settings/general" />;
}
