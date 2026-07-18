/**
 * @file ai.module.tsx
 * @module modules/ai
 *
 * @description
 * The AI Assistant module — a placeholder that reserves the route, nav entry,
 * and `ai` feature gate for the upcoming assistant. Single surface, no detail.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §18 "AI & Assistants"
 */

// SparklesIcon import removed — the icon is now specified as the
// Iconify string token `"sparkles"` in the resource meta (matches
// the rest of the workspace convention).
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AiAssistantPage = lazy(() => import("@/modules/ai/pages/list"));

/** The AI Assistant feature module. */
const aiModule: AppModule = {
  name: "ai",
  resources: [
    {
      name: "ai",
      list: "/ai",
      meta: {
        label: "AI Assistant",
        // Icon tokens follow the rest of the workspace convention
        // (Iconify string). SparklesIcon (a component) doesn't match
        // AppResourceMeta.icon's string type — Iconify handles the
        // renderer at the call site.
        icon: "sparkles",
        featureKey: "ai",
        requiredPermission: "ai.use",
        order: 52,
        groupKey: "ai",
      },
    },
  ],
  routes: [{ tier: "protected", path: "/ai", element: createElement(AiAssistantPage) }],
};

export default aiModule;
