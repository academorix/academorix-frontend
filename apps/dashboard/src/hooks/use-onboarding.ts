/**
 * @file use-onboarding.ts
 * @module hooks/use-onboarding
 *
 * @description
 * `useOnboarding()` — reads the tenant's onboarding checklist from
 * `GET /api/auth/me/onboarding` and normalises the response for
 * consumers.
 *
 * ## Dev / mock behaviour
 *
 * `authApi.onboarding()` short-circuits in mock mode to the
 * dashboard fixture (`public/api/v1/dashboard.json` →
 * `onboardingSteps`) projected onto the backend
 * `OnboardingStatusResponse` shape, so the hook stays on a single
 * code path and this file no longer imports a compile-time fixture.
 *
 * The hook exposes `refresh()` for consumers that want to
 * re-fetch after a locally-observed write (e.g. the operator hits
 * "Create a branch" → the modal calls `refresh()` on close so the
 * step ticks off without waiting for the 60-second cache TTL).
 */

import { useCallback, useEffect, useState } from "react";

import type { OnboardingStatusResponse } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { authApi } from "@/lib/api/auth-api";

/** Snapshot returned by the hook. */
export interface UseOnboardingResult {
  /** Full aggregate, or `null` before the first successful read. */
  data: OnboardingStatusResponse | null;
  /** True while the fetch is in flight (both initial + refetches). */
  isLoading: boolean;
  /** Non-null when the last fetch failed. */
  error: { message: string; code: string } | null;
  /** Force a refetch — useful after a downstream write. */
  refresh: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const [data, setData] = useState<OnboardingStatusResponse | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.onboarding();

      setData(response);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError({ message: caught.message, code: caught.code });
      } else {
        setError({
          message: "We couldn't load your onboarding progress.",
          code: "network_error",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}
