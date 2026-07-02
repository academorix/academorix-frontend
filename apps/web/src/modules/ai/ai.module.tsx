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

import { SparklesIcon } from "@academorix/ui/icons/outline";
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
        icon: SparklesIcon,
        featureKey: "ai",
        requiredPermission: "ai.use",
        order: 52,
      },
    },
  ],
  routes: [{ tier: "protected", path: "/ai", element: createElement(AiAssistantPage) }],
};

export default aiModule;
