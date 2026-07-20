/**
 * @file use-ai-connection.hook.ts
 * @module @stackra/ai/core/hooks
 * @description `useAiConnection()` — exposes the composed connection
 *   state (transport + offline overlay) and the human-readable reason
 *   surfaced when not connected (Req 24.1, 24.6).
 */

import { useEffect, useState } from 'react';
import { useInject } from '@stackra/container/react';
import { AI_CONNECTION_MANAGER, AiConnectionState } from '@stackra/contracts';

import {
  ConnectionManager,
  type IConnectionReason,
} from '@/core/services/connection-manager.service';

/** The value returned by {@link useAiConnection}. */
export interface IUseAiConnectionResult {
  /** Current composed connection state. */
  state: AiConnectionState;
  /** Reason surfaced while not connected. */
  reason: IConnectionReason | undefined;
  /** Whether the state is `Connected`. */
  isConnected: boolean;
  /** Whether the device is online. */
  isOnline: boolean;
}

/**
 * Reactive snapshot of the AI connection state.
 */
export function useAiConnection(): IUseAiConnectionResult {
  const connection = useInject<ConnectionManager>(AI_CONNECTION_MANAGER);
  const [snapshot, setSnapshot] = useState<IUseAiConnectionResult>(() => build(connection));

  useEffect(() => {
    return connection.onStateChange(() => setSnapshot(build(connection)));
  }, [connection]);

  return snapshot;
}

function build(connection: ConnectionManager): IUseAiConnectionResult {
  return {
    state: connection.state,
    reason: connection.reason,
    isConnected: connection.isConnected,
    isOnline: connection.isOnline,
  };
}
