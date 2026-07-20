/**
 * @file use-ai-catalog.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiCatalog()` — merges the client-declared persona
 *   registry with the backend persona catalog + the backend tool
 *   catalog (Req 14.4, 14.5).
 */

import { useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import {
  AI_AGENT_REGISTRY,
  AI_CLIENT,
  type IAiClient,
  type IAiClientToolDefinition,
  type IPersona,
} from '@stackra/contracts';

import { AgentRegistry } from '@/core/registries/agent.registry';

/** The value returned by {@link useAiCatalog}. */
export interface IUseAiCatalogResult {
  /** Merged personas (client + backend). */
  personas: IPersona[];
  /** Backend tool catalog. */
  tools: IAiClientToolDefinition[];
  /** Whether the initial fetch is still in-flight. */
  loading: boolean;
  /** Error surfaced by the initial fetch, if any. */
  error: Error | null;
  /** Re-fetch the backend catalog. */
  refresh: () => Promise<void>;
}

/**
 * Fetch and cache the merged AI catalog (personas + tools).
 */
export function useAiCatalog(): IUseAiCatalogResult {
  const client = useInject<IAiClient>(AI_CLIENT);
  const registry = useInject<AgentRegistry>(AI_AGENT_REGISTRY);

  const [personas, setPersonas] = useState<IPersona[]>(() => registry.all());
  const [tools, setTools] = useState<IAiClientToolDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    void refreshInner();
    async function refreshInner(): Promise<void> {
      try {
        const [backendPersonas, backendTools] = await Promise.all([
          client.listPersonas(),
          client.listTools(),
        ]);
        if (cancelled) return;
        setPersonas(mergePersonas(registry.all(), backendPersonas));
        setTools(backendTools);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [client, registry]);

  useEffect(() => {
    return registry.onChange(() => setPersonas((prev) => mergePersonas(registry.all(), prev)));
  }, [registry]);

  const refresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const [backendPersonas, backendTools] = await Promise.all([
        client.listPersonas(),
        client.listTools(),
      ]);
      setPersonas(mergePersonas(registry.all(), backendPersonas));
      setTools(backendTools);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return { personas, tools, loading, error, refresh };
}

/**
 * Merge two persona lists into a set keyed by `slug` — the client
 * registry wins on conflict (it's app-declared, and the app is the
 * source of truth for its own agents).
 */
function mergePersonas(client: IPersona[], backend: IPersona[]): IPersona[] {
  const map = new Map<string, IPersona>();
  for (const persona of backend) map.set(persona.slug, persona);
  for (const persona of client) map.set(persona.slug, persona);
  return Array.from(map.values());
}
