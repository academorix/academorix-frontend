/**
 * @file ai-assistant-sheet-mount.tsx
 * @module components/ai-assistant-sheet-mount
 *
 * @description
 * Mount component for the AI Assistant sheet. Subscribes to
 * {@link AiAssistantService} via `useSyncExternalStore`; renders the
 * `<AiAssistantSheet>` when both a slot AND `isOpen` are true, and fires
 * the "open a dashboard first" toast when the user clicks the navbar's
 * Assistant icon on a route that hasn't registered an editor.
 *
 * ## Mount contract
 *
 * Mount ONCE at the authenticated shell level (in `app-root.tsx`, at the
 * same position the legacy `<AiAssistantProvider>` used to sit). The
 * sheet floats above every route so the navbar's Assistant icon can pop
 * it from any page.
 *
 * ## Why the toast lives here (not in the service)
 *
 * Services should not depend on HeroUI's `toast()` singleton — that's a
 * React-tree binding, not a container-level primitive. Instead the
 * service maintains a monotonic "open requested but no slot" counter
 * and this mount observes it via an effect: every bump surfaces the
 * toast inside the React tree.
 */

import { toast } from "@heroui/react";
import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

import { useInject } from "@stackra/container/react";

import { AiAssistantSheet } from "@/modules/dashboard/components/ai-assistant-sheet";
import { AiAssistantService } from "@/services/ai-assistant";
import { AI_ASSISTANT_SERVICE } from "@/tokens/ai-assistant-service.token";

/**
 * Sheet + toast mount for the AI Assistant. Subscribes to the service's
 * snapshot and renders the sheet + "no dashboard" toast fallback.
 */
export function AiAssistantSheetMount(): ReactNode {
  const service = useInject<AiAssistantService>(AI_ASSISTANT_SERVICE);

  // Reactive read of the sheet's open state + active slot.
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);

  // Reactive read of the "no slot" open counter — a monotonic tick that
  // the service bumps every time `open()` is called on a page without
  // an editor. Watching this in an effect surfaces a toast without the
  // service needing to depend on HeroUI's global `toast()`.
  const openRequestCounter = useSyncExternalStore(
    service.subscribe,
    service.getOpenRequestNoSlotCounter,
    service.getOpenRequestNoSlotCounter,
  );

  useEffect(() => {
    // Guard the very first mount — the counter starts at 0 and the
    // effect runs once on mount even without a real "bump". We don't
    // want to fire a toast for a value that never transitioned.
    if (openRequestCounter === 0) {
      return;
    }

    // WHY not `toast.warning` or a specific variant: the legacy
    // provider used the neutral `toast(...)` overload, matching the
    // rest of the shell's tone for informational nudges.
    toast("Open a dashboard first", {
      description: "The assistant is scoped to a dashboard editor. Head to /dashboard to start.",
    });
  }, [openRequestCounter]);

  // Guard the sheet render on BOTH conditions: (1) a slot is registered
  // so `<AiAssistantSheet>` has a non-null editor to bind to, and (2)
  // the sheet is currently open so we don't pay the overlay + transition
  // cost on every page load.
  const slot = snapshot.slot;

  if (slot === null) {
    // No editor — nothing to mount. The "no slot" toast (above) still
    // fires if `open()` is invoked.
    return null;
  }

  return (
    <AiAssistantSheet
      editor={slot.editor}
      isOpen={snapshot.isOpen}
      isReadOnly={slot.isReadOnly}
      onOpenChange={service.setOpen}
    />
  );
}
