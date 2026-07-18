/**
 * @file use-copy-clipboard.interface.ts
 * @module @stackra/ui/react/hooks/use-copy-clipboard
 * @description Interfaces for the useCopyClipboard hook.
 */

// ============================================================================
// Hook Types
// ============================================================================

/** Return value of the useCopyClipboard hook. */
export interface UseCopyClipboardReturn {
  /** Copy text to the clipboard. Returns a promise. */
  copy: (text: string) => Promise<void>;

  /** Whether the last copy was successful (auto-resets after delay). */
  copied: boolean;

  /** Error if the last copy failed. */
  error: Error | null;
}
