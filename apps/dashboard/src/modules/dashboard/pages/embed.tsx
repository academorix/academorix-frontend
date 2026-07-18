/**
 * @file embed.tsx
 * @module modules/dashboard/pages/embed
 *
 * @description
 * Legacy public embed viewer — kept alive so links minted before
 * the broadcast Phase-1 landing (`/embed/dashboard/:token`) continue
 * to resolve. The route delegates to {@link BroadcastRoute} with
 * `legacyEmbed` set so header copy softens ("Public view") for
 * bookmarked links.
 *
 * All the actual behaviour — resolve, unlock gate, embed vs present
 * fork, auto-refresh — lives in `./broadcast.tsx`. This file is a
 * one-liner delegator kept as its own route element so the module
 * manifest can register the legacy path independently.
 */

import type { ReactNode } from "react";

import BroadcastRoute from "./broadcast";

export default function DashboardEmbedRoute(): ReactNode {
  return <BroadcastRoute legacyEmbed />;
}
