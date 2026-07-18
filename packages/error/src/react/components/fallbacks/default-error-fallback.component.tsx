/**
 * @file default-error-fallback.component.tsx
 * @module @stackra/error/react/components
 * @description Full-page default fallback, built on HeroUI primitives.
 */

import type { ReactNode } from "react";

import { Alert, Button, Card } from "@stackra/ui/react";

/**
 * Props for {@link DefaultErrorFallback}.
 */
export interface IDefaultErrorFallbackProps {
  /** The caught error. */
  error: Error;

  /** Reset handle — when provided, a "Try again" action is shown. */
  reset?: () => void;

  /** Heading text. Defaults to a generic message. */
  title?: string;

  /** Supporting copy under the heading. */
  description?: ReactNode;

  /** Show the raw stack trace in a scrollable panel. Defaults to `false`. */
  showDetails?: boolean;
}

/**
 * Page-level error fallback: a centered card with a danger alert and an
 * optional retry action. Composed entirely from `@stackra/ui` HeroUI
 * primitives; only Tailwind layout utilities are used for arrangement.
 *
 * @param props - {@link IDefaultErrorFallbackProps}.
 * @returns The fallback element.
 */
export function DefaultErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description,
  showDetails = false,
}: IDefaultErrorFallbackProps): ReactNode {
  return (
    <div role="alert" className="flex min-h-[60vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <Card.Header>
          <Card.Title>{title}</Card.Title>
          <Card.Description>
            {description ?? "An unexpected error occurred while rendering this page."}
          </Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error.name}</Alert.Title>
              <Alert.Description>{error.message}</Alert.Description>
            </Alert.Content>
          </Alert>

          {showDetails && error.stack ? (
            <Card variant="secondary">
              <Card.Content>
                <pre className="max-h-64 overflow-auto text-xs whitespace-pre-wrap">
                  {error.stack}
                </pre>
              </Card.Content>
            </Card>
          ) : null}
        </Card.Content>

        {reset ? (
          <Card.Footer className="mt-2 flex justify-end gap-2">
            <Button variant="danger" onPress={reset}>
              Try again
            </Button>
          </Card.Footer>
        ) : null}
      </Card>
    </div>
  );
}
