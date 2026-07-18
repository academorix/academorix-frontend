/**
 * @file use-ai-assistant-slot.hook.ts
 * @module @academorix/dashboard/hooks/use-ai-assistant-slot
 * @description Register the current page's editor with the AI Assistant.
 *
 *   Called from a page that owns a live `UseDashboardEditor` (today only
 *   the dashboard route). The hook takes care of un-registering on
 *   unmount so route changes don't leak stale editors into the sheet.
 */

import { useEffect } from "react";

import { useInject } from "@stackra/container/react";

import type { UseDashboardEditor } from "@/modules/dashboard/dashboards";
import { AiAssistantService } from "@/services/ai-assistant";
import { AI_ASSISTANT_SERVICE } from "@/tokens/ai-assistant-service.token";

/**
 * Register / unregister the caller's editor slot with the AI Assistant
 * service. Passing `null` (or an unmount) clears the registration and
 * auto-closes the sheet if it was open.
 *
 * @param editor - The `UseDashboardEditor` currently visible, or `null`
 *                 while the page is loading.
 * @param options - Slot flags. `isReadOnly` gates suggestion application
 *                  (built-in dashboards flip this on).
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const editor = useDashboardEditor(...);
 *   const current = useCurrentDashboard();
 *   useAiAssistantSlot(current ? editor : null, {
 *     isReadOnly: current?.isBuiltIn ?? false,
 *   });
 *   // ...
 * }
 * ```
 */
export function useAiAssistantSlot(
  editor: UseDashboardEditor | null,
  options: { isReadOnly: boolean } = { isReadOnly: false },
): void {
  const service = useInject<AiAssistantService>(AI_ASSISTANT_SERVICE);

  useEffect(() => {
    if (editor === null) {
      service.registerSlot(null);

      return undefined;
    }

    service.registerSlot({ editor, isReadOnly: options.isReadOnly });

    return () => {
      service.registerSlot(null);
    };
    // WHY listing `options.isReadOnly` explicitly (not `options`):
    // the caller usually passes a fresh object literal every render
    // (`{isReadOnly: current.isBuiltIn}`). Depending on the object
    // identity would re-register on every parent render — depending on
    // the primitive is stable.
  }, [editor, options.isReadOnly, service]);
}
