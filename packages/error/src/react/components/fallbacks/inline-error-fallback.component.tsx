/**
 * @file inline-error-fallback.component.tsx
 * @module @stackra/error/react/components
 * @description Compact inline fallback for component-level boundaries.
 */

import type { ReactNode } from "react";

import { Alert, Button } from "@stackra/ui/react";

/**
 * Props for {@link InlineErrorFallback}.
 */
export interface IInlineErrorFallbackProps {
  /** The caught error. */
  error: Error;

  /** Reset handle — when provided, a "Retry" action is shown. */
  reset?: () => void;

  /** Short label describing what failed. */
  label?: string;
}

/**
 * Compact danger alert suited to a failed widget or section — keeps the
 * surrounding page intact. Built from `@stackra/ui` HeroUI primitives.
 *
 * @param props - {@link IInlineErrorFallbackProps}.
 * @returns The fallback element.
 */
export function InlineErrorFallback({
  error,
  reset,
  label = "This section failed to load.",
}: IInlineErrorFallbackProps): ReactNode {
  return (
    <Alert status="danger" role="alert" className="w-full">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{label}</Alert.Title>
        <Alert.Description>{error.message}</Alert.Description>
        {reset ? (
          <Button className="mt-2" size="sm" variant="danger" onPress={reset}>
            Retry
          </Button>
        ) : null}
      </Alert.Content>
    </Alert>
  );
}
