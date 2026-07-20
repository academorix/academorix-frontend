/**
 * @file create-mock-ui.ts
 * @module @stackra/ui/testing
 * @description Factories returning assertable mock UI services.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockToastService } from "./mock-toast-service";
import { MockDialogService } from "./mock-dialog-service";
import { MockOverlayRegistry } from "./mock-overlay-registry";

/**
 * Create an assertable mock toast service.
 *
 * @example
 * ```ts
 * const toast = createMockToastService();
 * toast.show('Saved.', { variant: 'success' });
 * expect(toast.$.wasCalledWith('show', 'Saved.', { variant: 'success' })).toBe(true);
 * expect(toast.toasts).toHaveLength(1);
 * ```
 */
export function createMockToastService(): AssertableProxy<MockToastService> {
  return createAssertableProxy(new MockToastService());
}

/**
 * Create an assertable mock dialog service.
 */
export function createMockDialogService(): AssertableProxy<MockDialogService> {
  return createAssertableProxy(new MockDialogService());
}

/**
 * Create an assertable mock overlay registry.
 *
 * @example
 * ```ts
 * const overlays = createMockOverlayRegistry();
 * overlays.open('confirm', { reason: 'delete' });
 * expect(overlays.isOpen('confirm')).toBe(true);
 * expect(overlays.$.wasCalledWith('open', 'confirm', { reason: 'delete' })).toBe(true);
 * ```
 */
export function createMockOverlayRegistry(): AssertableProxy<MockOverlayRegistry> {
  return createAssertableProxy(new MockOverlayRegistry());
}
