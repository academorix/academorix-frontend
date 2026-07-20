/**
 * @file stackra-query-provider.tsx
 * @module @stackra/query/react/providers
 * @description Bridge between the DI-registered `QueryClient` and
 *   TanStack Query's `<QueryClientProvider>`.
 *
 *   `QueryModule.forRoot` binds a `QueryClient` instance under its
 *   class token; this provider reads it via `useInject` and hands
 *   it to `<QueryClientProvider>` so `useQuery` / `useMutation`
 *   hooks find it through React context.
 *
 *   Wrap your app tree ONCE, ideally at the same level you install
 *   `<ContainerProvider>` and any other module-wide providers:
 *
 * @example
 * ```tsx
 * <ContainerProvider context={app}>
 *   <StackraQueryProvider>
 *     <YourApp />
 *   </StackraQueryProvider>
 * </ContainerProvider>
 * ```
 */

import type { ReactElement, ReactNode } from "react";
import { useInject } from "@stackra/container/react";
import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";

/**
 * Props for `<StackraQueryProvider>`.
 */
export interface StackraQueryProviderProps {
  /** Child tree that consumes `useQuery` / `useMutation`. */
  readonly children: ReactNode;
}

/**
 * Reads the DI-bound `QueryClient` and installs TanStack Query's
 * context provider. Renders `children` unchanged otherwise.
 *
 * @throws When `QueryModule.forRoot` hasn't been imported into the
 *   container. The `useInject` call throws in that case with the
 *   standard "no provider" error.
 */
export function StackraQueryProvider({ children }: StackraQueryProviderProps): ReactElement {
  const client = useInject<QueryClient>(QueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
