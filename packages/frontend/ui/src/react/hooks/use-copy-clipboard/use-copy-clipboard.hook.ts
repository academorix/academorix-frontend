/**
 * @file use-copy-clipboard.hook.ts
 * @module @stackra/ui/react/hooks/use-copy-clipboard
 * @description Copy-to-clipboard hook with success feedback state.
 *   Provides a `copy()` function and a `copied` boolean that auto-resets.
 */

"use client";

import { useState, useCallback, useRef } from "react";

import type { UseCopyClipboardReturn } from "./use-copy-clipboard.interface";

/**
 * Copy text to clipboard with a temporary success state.
 *
 * The `copied` flag auto-resets after the specified duration.
 *
 * @param resetDelay - Milliseconds before `copied` resets to false. Defaults to 2000.
 * @returns Object with `copy()` function, `copied` state, and `error`.
 *
 * @example
 * ```tsx
 * const { copy, copied } = useCopyClipboard();
 *
 * <Button onPress={() => copy(apiKey)}>
 *   {copied ? 'Copied!' : 'Copy API Key'}
 * </Button>
 * ```
 */
export function useCopyClipboard(resetDelay = 2000): UseCopyClipboardReturn {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetDelay);
      } catch (err) {
        setCopied(false);
        setError(err instanceof Error ? err : new Error("Failed to copy"));
      }
    },
    [resetDelay],
  );

  return { copy, copied, error };
}
