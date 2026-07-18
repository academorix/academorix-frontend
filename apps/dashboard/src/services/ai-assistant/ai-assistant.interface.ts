/**
 * @file ai-assistant.interface.ts
 * @module @academorix/dashboard/services/ai-assistant
 * @description Data-plane types for {@link AiAssistantService}.
 */

import type { UseDashboardEditor } from "@/modules/dashboard/dashboards";

/**
 * The registration passed in when a page mounts that owns a live editor.
 * Kept identical to the legacy `AiAssistantSlotRegistration` shape so
 * every call site migrates without editing arguments.
 */
export interface IAiAssistantSlotRegistration {
  /** The editor bound to the on-screen dashboard. */
  editor: UseDashboardEditor;
  /**
   * Whether the current dashboard is read-only. Built-in dashboards
   * flip this on — the sheet still opens (so users can chat) but
   * suggestion application is gated.
   */
  isReadOnly: boolean;
}

/**
 * Reactive snapshot emitted by the service. `slot === null` means no
 * dashboard is currently visible; opening the sheet in that state fires
 * the "open a dashboard first" toast fallback (handled by the mount
 * component).
 */
export interface IAiAssistantSnapshot {
  /** Whether the assistant sheet is currently open. */
  readonly isOpen: boolean;
  /** The active editor + read-only flag, if a dashboard is mounted. */
  readonly slot: IAiAssistantSlotRegistration | null;
}
