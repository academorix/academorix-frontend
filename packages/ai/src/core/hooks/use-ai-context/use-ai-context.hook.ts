/**
 * @file use-ai-context.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiContext()` — read-side hook. Exposes the currently
 *   registered frames, the ordered focus stack, and a lightweight
 *   snapshot suitable for rendering an `AiContextIndicator`.
 */

import { useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import { AI_CONTEXT_REGISTRY, type IAiContextFrame } from '@stackra/contracts';

import { ContextRegistry } from '@/core/registries/context.registry';

/** The value returned by {@link useAiContext}. */
export interface IUseAiContextResult {
  /** Every registered frame, in insertion order. */
  frames: IAiContextFrame[];
  /** Ordered focus stack, topmost first. */
  stack: IAiContextFrame[];
  /** Count of registered frames. */
  count: number;
}

/**
 * Snapshot of the current AI context registry — re-renders when frames
 * are added/updated/removed.
 */
export function useAiContext(): IUseAiContextResult {
  const registry = useInject<ContextRegistry>(AI_CONTEXT_REGISTRY);
  const [snapshot, setSnapshot] = useState<IUseAiContextResult>(() => build(registry));

  useEffect(() => {
    return registry.onChange(() => setSnapshot(build(registry)));
  }, [registry]);

  return snapshot;
}

function build(registry: ContextRegistry): IUseAiContextResult {
  const frames = registry.all();
  return {
    frames,
    stack: registry.orderedStack(),
    count: frames.length,
  };
}
