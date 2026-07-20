/**
 * @file index.ts
 * @module @stackra/ui/testing
 * @description Public API for `@stackra/ui/testing`.
 *
 *   Assertable mocks for the imperative UI services (`ToastService`,
 *   `DialogService`, `OverlayRegistry`) plus a `TestProviders`
 *   component and a `createRenderWithProviders` factory that adapt to
 *   the consumer's own `@testing-library/react` install without
 *   pinning it as a dependency here.
 *
 *   Standard testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts.
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`.
 *   - `test-providers.tsx` — React provider wrapper for component tests.
 *   - `render-with-providers.tsx` — RTL-adapter factory.
 *
 * @example
 * ```tsx
 * import { render } from '@testing-library/react';
 * import {
 *   createMockToastService,
 *   createMockOverlayRegistry,
 *   createRenderWithProviders,
 * } from '@stackra/ui/testing';
 *
 * const toast = createMockToastService();
 * const overlays = createMockOverlayRegistry();
 * const renderWithProviders = createRenderWithProviders(render);
 *
 * const { getByRole } = renderWithProviders(<MyComponent toast={toast} />);
 * getByRole('button').click();
 * expect(toast.$.wasCalled('show')).toBe(true);
 * ```
 */

export { MockToastService, type RecordedToast } from "./mock-toast-service";
export { MockDialogService, type RecordedDialogCall } from "./mock-dialog-service";
export { MockOverlayRegistry, type RecordedOverlayCall } from "./mock-overlay-registry";
export {
  createMockToastService,
  createMockDialogService,
  createMockOverlayRegistry,
} from "./create-mock-ui";
export { TestProviders, type TestProvidersProps } from "./test-providers";
export { createRenderWithProviders, type RenderLike } from "./render-with-providers";
