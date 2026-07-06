/**
 * @file create-realtime-context.tsx
 * @module @academorix/realtime/context/create-realtime-context
 *
 * @description
 * Factory that returns `{ RealtimeProvider, useRealtimeClient }` bound
 * to an app's {@link RealtimeClient} instance.
 *
 * Why a factory over a package-level singleton? Both apps have
 * different Reverb configs (dashboard authorises via bearer tokens;
 * a future admin surface might authorise via a session cookie), so
 * the client instance must live at the app level. The factory keeps
 * the React glue reusable while letting the app own the transport.
 *
 * The provider is stateless — it just exposes the passed-in client
 * through context so downstream hooks (`useChannel`, `usePresence`)
 * can read it. Apps that want to swap the client at runtime (e.g. on
 * logout) unmount + remount the provider.
 *
 * @example
 * ```tsx
 * // apps/dashboard/src/providers.tsx
 * import { createRealtimeContext } from "@academorix/realtime/context";
 * import { realtimeClient } from "@/lib/realtime";
 *
 * export const { RealtimeProvider, useRealtimeClient } =
 *   createRealtimeContext();
 *
 * <RealtimeProvider client={realtimeClient}>{children}</RealtimeProvider>
 * ```
 */

import { createContext, useContext, useMemo } from "react";

import type { RealtimeClient } from "../client/realtime-client.type";
import type { ReactNode } from "react";

/** Props for the `RealtimeProvider`. */
export interface RealtimeProviderProps {
  readonly children: ReactNode;
  /** The realtime client to expose through context. */
  readonly client: RealtimeClient;
}

/** Bundle returned by {@link createRealtimeContext}. */
export interface RealtimeContextBundle {
  /** Wrap the app tree; must be above every hook consumer. */
  readonly RealtimeProvider: (props: RealtimeProviderProps) => ReactNode;
  /** Read the current {@link RealtimeClient} from context. */
  readonly useRealtimeClient: () => RealtimeClient;
}

/**
 * Creates a `{ RealtimeProvider, useRealtimeClient }` pair. Each app
 * instantiates once at boot.
 */
export function createRealtimeContext(): RealtimeContextBundle {
  const RealtimeContext = createContext<RealtimeClient | null>(null);

  RealtimeContext.displayName = "RealtimeContext";

  function RealtimeProvider({ children, client }: RealtimeProviderProps): ReactNode {
    // The client itself is stable across renders — memoize the
    // context value so downstream consumers don't re-render on
    // unrelated parent updates.
    const value = useMemo(() => client, [client]);

    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
  }

  function useRealtimeClient(): RealtimeClient {
    const client = useContext(RealtimeContext);

    if (!client) {
      throw new Error(
        "useRealtimeClient must be used within a <RealtimeProvider>. " +
          "Make sure the provider is mounted above the component tree.",
      );
    }

    return client;
  }

  return { RealtimeProvider, useRealtimeClient };
}
