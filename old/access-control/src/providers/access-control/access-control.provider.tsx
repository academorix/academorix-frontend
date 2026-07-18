/**
 * @file access-control.provider.tsx
 * @module @academorix/access-control/providers/access-control
 *
 * @description
 * `<AccessControlProvider>` — the root of the authorization
 * consumer surface. Mount at the app root (typically inside
 * `<ContainerProvider>`).
 *
 * Two data-source shapes:
 *   - `preloaded` — the app already has `me` (SSR / RSC handoff).
 *   - `fetch-on-mount` — resolve `ACCESS_CONTROL_SERVICE` and fetch.
 *
 * Every consumer hook (`useHasPermission`, `useHasRole`,
 * `useMyAbilities`, ...) reads the context this provider carries.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useInject } from "@academorix/container/react";

import {
  ACCESS_CONTROL_SERVICE,
  type IAbilityData,
  type IAccessControlContextValue,
} from "@academorix/contracts";

import { AccessControlContext } from "../../contexts/access-control/access-control.context";
import type { AccessControlProviderProps } from "./access-control.interface";

/**
 * `<AccessControlProvider>` — root provider component.
 *
 * @param props - Provider props.
 * @returns The context provider wrapping `children`.
 */
export function AccessControlProvider(props: AccessControlProviderProps): React.ReactElement {
  const { source, children } = props;

  const isPreloaded = source.kind === "preloaded";
  const service = useInject(ACCESS_CONTROL_SERVICE);

  const [permissions, setPermissions] = useState<readonly string[]>(() =>
    isPreloaded ? source.permissions : [],
  );
  const [roles, setRoles] = useState<readonly string[]>(() => (isPreloaded ? source.roles : []));
  const [abilities, setAbilities] = useState<readonly IAbilityData[]>(() =>
    isPreloaded ? source.abilities : [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(!isPreloaded);
  const [isError, setIsError] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    setIsError(false);
    try {
      const payload = await service.fetchBootPayload();
      if (!isMountedRef.current) return;
      setPermissions(payload.permissions);
      setRoles(payload.roles);
      setAbilities(payload.abilities);
    } catch {
      if (!isMountedRef.current) return;
      setIsError(true);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (source.kind === "fetch-on-mount") {
      void refetch();
    }
  }, [source.kind, refetch]);

  const value = useMemo<IAccessControlContextValue>(
    () => ({
      permissions,
      roles,
      abilities,
      isLoading,
      isError,
      refetch: source.kind === "fetch-on-mount" ? refetch : null,
    }),
    [permissions, roles, abilities, isLoading, isError, refetch, source.kind],
  );

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

AccessControlProvider.displayName = "AccessControlProvider";
