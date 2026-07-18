/**
 * @file render-with-providers.tsx
 * @module @stackra/ui/testing
 * @description `renderWithProviders` factory.
 *
 *   Rather than pinning the whole `@stackra/ui/testing` subpath to
 *   `@testing-library/react`, this exports a factory that binds a
 *   consumer-supplied `render` function so calls are terse in test
 *   files while the RTL dependency stays optional (consumers install it
 *   themselves).
 */

import type { ReactElement } from "react";
import { TestProviders } from "./test-providers";

/** Minimal shape of `render` from `@testing-library/react`. */
export type RenderLike<TResult> = (ui: ReactElement, options?: unknown) => TResult;

/**
 * Create a `renderWithProviders(ui, options?)` bound to the given
 * render function.
 *
 * @param render - The RTL `render` function (or any compatible signature).
 * @returns A function that wraps `ui` in {@link TestProviders} before
 *   handing it to `render`.
 *
 * @example
 * ```tsx
 * import { render } from '@testing-library/react';
 * import { createRenderWithProviders } from '@stackra/ui/testing';
 *
 * const renderWithProviders = createRenderWithProviders(render);
 * const { getByText } = renderWithProviders(<Button>Click</Button>);
 * ```
 */
export function createRenderWithProviders<TResult>(
  render: RenderLike<TResult>,
): (ui: ReactElement, options?: unknown) => TResult {
  return function renderWithProviders(ui: ReactElement, options?: unknown): TResult {
    return render(<TestProviders>{ui}</TestProviders>, options);
  };
}
