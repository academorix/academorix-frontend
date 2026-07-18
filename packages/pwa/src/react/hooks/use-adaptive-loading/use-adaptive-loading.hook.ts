/**
 * @file use-adaptive-loading.hook.ts
 * @module @stackra/pwa/react/hooks
 * @description `navigator.connection`-driven adaptive-loading hook.
 *
 *   Chromium-only. Subscribes to `connection.change` so components
 *   re-render when the effective type flips (e.g. WiFi → cellular).
 */

import { useEffect, useState } from 'react';

import type { IUseAdaptiveLoadingResult } from './use-adaptive-loading.interface';

/** Structural shape of `navigator.connection`. */
interface INetworkInformationLike {
  readonly effectiveType?: string;
  readonly saveData?: boolean;
  readonly downlink?: number;
  readonly rtt?: number;
  addEventListener?(type: string, listener: () => void): void;
  removeEventListener?(type: string, listener: () => void): void;
}

/**
 * Read `navigator.connection` reactively.
 *
 * @example
 * ```tsx
 * import { useAdaptiveLoading } from '@stackra/pwa/react';
 *
 * function HeroImage() {
 *   const { effectiveType, saveData } = useAdaptiveLoading();
 *   const showBackground = !saveData && effectiveType !== 'slow-2g';
 *   return showBackground ? <img src="/hero.webp" /> : <div className="bg-default-100" />;
 * }
 * ```
 */
export function useAdaptiveLoading(): IUseAdaptiveLoadingResult {
  const [state, setState] = useState<IUseAdaptiveLoadingResult>(() => readState());

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const connection = (navigator as unknown as { connection?: INetworkInformationLike })
      .connection;
    if (!connection?.addEventListener) return;
    const onChange = (): void => setState(readState());
    connection.addEventListener('change', onChange);
    return () => connection.removeEventListener?.('change', onChange);
  }, []);

  return state;
}

/** Snapshot the current connection info. Fail-soft on SSR. */
function readState(): IUseAdaptiveLoadingResult {
  if (typeof navigator === 'undefined') {
    return { effectiveType: 'unknown', saveData: false, downlink: null, rtt: null };
  }
  const connection = (navigator as unknown as { connection?: INetworkInformationLike }).connection;
  if (!connection) {
    return { effectiveType: 'unknown', saveData: false, downlink: null, rtt: null };
  }
  const raw = connection.effectiveType;
  // Guard against unexpected values so consumers can rely on the
  // discriminated type.
  const effectiveType =
    raw === 'slow-2g' || raw === '2g' || raw === '3g' || raw === '4g' ? raw : 'unknown';
  return {
    effectiveType,
    saveData: connection.saveData ?? false,
    downlink: connection.downlink ?? null,
    rtt: connection.rtt ?? null,
  };
}
