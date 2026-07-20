/**
 * @file test-providers.tsx
 * @module @stackra/ui/testing
 * @description React component that wraps children in every provider a
 *   test-rendered `@stackra/ui/react` component may need.
 *
 *   HeroUI v3 does NOT require an `<HeroUIProvider>` — components render
 *   directly. This wrapper is intentionally lightweight and grows as new
 *   framework-owned providers are introduced; consumers that need a
 *   custom subset can just import the individual providers and wrap by
 *   hand.
 */

import type { ReactElement, ReactNode } from "react";

/**
 * Props for {@link TestProviders}.
 */
export interface TestProvidersProps {
  children: ReactNode;
}

/**
 * Wrap a React subtree in the providers required to render most
 * `@stackra/ui/react` components in a test environment.
 *
 * Currently a passthrough — HeroUI v3 works without a provider. Kept as
 * a stable API so consumers can adopt it now and pick up future
 * framework-owned providers automatically.
 *
 * @example
 * ```tsx
 * import { render } from '@testing-library/react';
 * import { TestProviders } from '@stackra/ui/testing';
 *
 * render(<TestProviders><Button>Click</Button></TestProviders>);
 * ```
 */
export function TestProviders({ children }: TestProvidersProps): ReactElement {
  return <>{children}</>;
}

TestProviders.displayName = "StackraTestProviders";
