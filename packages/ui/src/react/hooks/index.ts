/**
 * @file index.ts
 * @module @stackra/ui/react/hooks
 * @description Barrel export for all hooks.
 */

// ============================================================================
// Component Hooks
// ============================================================================
export { useProgressTabs } from "./use-progress-tabs";
export { usePageProgress } from "./use-page-progress";

// ============================================================================
// Utility Hooks
// ============================================================================
export { useConfirmDialog } from "./use-confirm-dialog";
export type {
  UseConfirmDialogOptions,
  UseConfirmDialogProps,
  UseConfirmDialogReturn,
} from "./use-confirm-dialog";

export { useCopyClipboard } from "./use-copy-clipboard";
export type { UseCopyClipboardReturn } from "./use-copy-clipboard";
