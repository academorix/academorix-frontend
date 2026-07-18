/**
 * @file ai-assistant-sheet.tsx
 * @module modules/dashboard/components/ai-assistant-sheet
 *
 * @description
 * Wraps {@link AiCopilotTab} in a HeroUI Pro `Sheet` so the AI
 * assistant can be launched from the dashboard page header rather
 * than being buried inside the Customise panel's tab list.
 *
 * The panel stays scoped to the current dashboard editor — this
 * component owns the open/close state via a controlled `isOpen`
 * prop, and forwards the same `editor` + `isReadOnly` handshake the
 * Customise-panel tab used to receive.
 *
 * Rationale for the header placement:
 *   * The assistant is a **peer** of Present / Share / Customise,
 *     not a sub-tab inside Customise. Nesting it made the tab list
 *     seven-deep and hid the highest-value affordance in the app.
 *   * Header buttons stay reachable whether or not the Customise
 *     panel is open, so operators can chat with the assistant
 *     while editing widgets in the aside slot without collapsing
 *     one to see the other.
 *
 * ## HeroUI Pro Sheet compound API
 *
 * The v3 Sheet compound is:
 *
 *   Sheet → Sheet.Backdrop → Sheet.Content → Sheet.Dialog
 *       → Sheet.Header → Sheet.Heading + free-form paragraphs
 *       → Sheet.Body
 *       → Sheet.CloseTrigger
 *
 * The root `<Sheet>` accepts `placement="right"` for a right-edge
 * slide (matches how the Customise aside enters from the same edge,
 * so the mental model stays consistent).
 */

import { Sheet } from "@heroui-pro/react";

import type { UseDashboardEditor } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { AiCopilotTab } from "@/modules/dashboard/components/ai-copilot-tab";

export interface AiAssistantSheetProps {
  editor: UseDashboardEditor;
  /**
   * Whether the assistant runs read-only — built-in dashboards can
   * still chat, but Accept buttons on suggestion cards stay
   * disabled so changes never apply.
   */
  isReadOnly: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiAssistantSheet({
  editor,
  isReadOnly,
  isOpen,
  onOpenChange,
}: AiAssistantSheetProps): ReactNode {
  return (
    <Sheet isOpen={isOpen} onOpenChange={onOpenChange} placement="right">
      <Sheet.Backdrop>
        <Sheet.Content className="w-full max-w-lg">
          <Sheet.Dialog>
            <Sheet.Header>
              <Sheet.Heading className="flex items-center gap-2">
                <Iconify className="size-4 text-accent" icon="sparkles" />
                Dashboard assistant
              </Sheet.Heading>
              <p className="mt-1 text-sm text-muted">
                {isReadOnly
                  ? "Chat with the assistant to explore what this built-in dashboard can show. Duplicate it to apply changes."
                  : `Ask for a widget, a reorder, or a rename — the assistant walks you through changes to ${editor.draft.name}.`}
              </p>
              <Sheet.CloseTrigger />
            </Sheet.Header>
            <Sheet.Body className="flex min-h-0 flex-col p-0">
              <AiCopilotTab editor={editor} isReadOnly={isReadOnly} />
            </Sheet.Body>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
